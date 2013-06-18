var restify = require('restify');
var MongoClient = require('mongodb').MongoClient;
var url = require('url');
var querystring = require('querystring');
var crypto = require('crypto');

var search = function (request, response, next) {
  var query = querystring.parse(url.parse(request.url).query);
  MongoClient.connect('mongodb://localhost:27017/test', function (err, db) {
    if (err) {
      response.send(err);
    }
    var eTag = crypto.createHash('md5');
    var collection = db.collection('Hotels');
    var date = new Date(query['d']).toJSON().slice(0,10).replace('-','').replace('-',''); 
    var rates = db.collection('Rates' + date);
    var ids = [];
    var hotels = {};
    var stream = collection
                     .find({ais: {$all:[parseInt(query['aid'])||100]}}, 
                           {
                             '_id': 0,
                             'hi': 1,
                             'hn': 1,
                             'l': 1,
                             'nsr': 1,
                             'add': 1
                           })
                     .stream();
    stream.on('data', function(doc) {
      //console.log(JSON.stringify(doc));
      ids.push(doc.hi);
      hotels[doc.hi] = doc;
    });
    stream.on('end', function(){
      response.setHeader('X-HotelsCount', ids.length.toString());

      var nightsList = query['n'].split(',');

      var projection = {'_id':0, 'hi':1};
      var match = { $elemMatch: {a:{$gte:parseInt(query['a']||2)}}};
      
      for (var n = 0; n < nightsList.length; n++) {
        projection[nightsList[n]] = match;
      }
      
      var pmin = query['pmin'] ?  parseFloat(query['pmin']) : null; 
      var pmax = query['pmax'] ?  parseFloat(query['pmax']) : null; 
      
      if(pmin && pmax) {
        match.$elemMatch.p = {$gte: pmin, $lte: pmax};
      } else if (pmin) {
        match.$elemMatch.p = {$gte: pmin};
      } else if (pmax) {
        match.$elemMatch.p = {$lte: pmax};
      }

      switch(query['s']) {
        case 'o':
          match.$elemMatch.t = {$all:['S']};
          break;
        case 'x':
          match.$elemMatch.t = {$not:{$in:['S']}};
          break;
        default:
      }


      //console.log(JSON.stringify(projection));
      //console.log(date);
      var rateResponse = [];

      var searchQuery = {'hi': {$in: ids}};
      if (nightsList.length > 1){
        var x = [];
        for (var n = 0; n < nightsList.length; n++) {
          var o = {};
          o[nightsList[n]] = match;
          x.push(o);
        }
        searchQuery.$or = x;

      } else {
        searchQuery[query['n']] = match;
      }
      //console.log(searchQuery);
      //console.log(projection);

      var rateStream = rates.find(searchQuery, projection).stream();
      
      rateStream.on('data', function(rate) {
        var hotel = hotels[rate.hi];
        for (var n = 0; n < nightsList.length; n++) {
          hotel[nightsList[n]] = rate[nightsList[n]];
        }
        
        rateResponse.push(hotel);
        eTag.update(JSON.stringify(hotel));
      });
      rateStream.on('end', function() {
        //console.log(rateResponse.length);
        rateResponse.sort(function(a,b){return (a[nightsList[0]]||[{p:99999999}])[0].p - (b[nightsList[0]]||[{p:99999999}])[0].p;});
        response.setHeader('X-HotelsAvailable', rateResponse.length.toString());
        var hash = eTag.digest('hex');
        response.setHeader('ETag',hash);
        //response.etag =hash;
        response.send(rateResponse);
      });
           
    });
  });

  next();
}

var rates = function(request, response, next) {
  MongoClient.connect('mongodb://localhost:27017/test', function (err, db) {
    if (err) {
      response.send(err);
    }
    var collection = db.collection('Rates'+request.params.year+request.params.month+request.params.date);
    var projection = {hi:1,_id:0};
    projection[request.params.nights] = 1;
    
    collection.findOne({_id: request.params.id},projection, function(err,doc){
      response.send(err||doc);
    });
  });
  next();
}

var server = restify.createServer();

server.use(restify.gzipResponse());

server.get('/hotels/', search, restify.conditionalRequest());
server.get('/hotels/:id/rates/:year/:month/:date/:nights', rates);

server.listen(9090);
