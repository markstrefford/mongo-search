var restify = require('restify');
var MongoClient = require('mongodb').MongoClient;
var url = require('url');
var crypto = require('crypto');

var Mongo = function(url) {
  this.connect = function(request, response, next) {
    MongoClient.connect(url, function (err, db) {
      if (err) {
        next(err);
        return;
      }
      request.db = db;
      next();
    });
  }
}

var getHotels = function (request, response, next) {
  var collection = request.db.collection('Hotels');
  request.ids = [];
  request.hotels = {};
  var stream = collection.find(
    { ais: {$all: [parseInt(request.query['aid'])] } }, 
    { _id: 0, hi: 1, hn: 1, l: 1, nsr: 1, add: 1 }
  ).stream();

  stream.on('data', function(hotel) {
    request.ids.push(hotel.hi);
    request.hotels[hotel.hi] = hotel;
  });
  
  stream.on('end', function() {
    response.setHeader('X-HotelCount', request.ids.length.toString());
    next();
  });
}

var getRates = function (request, response, next) {

  var buildRateMatcher = function () {
    var match = { $elemMatch: {a:{$gte:parseInt(request.query['a']||2)}}};
    var pmin = request.query['pmin'] ?  parseFloat(request.query['pmin']) : null; 
    var pmax = request.query['pmax'] ?  parseFloat(request.query['pmax']) : null; 
      
    if(pmin && pmax) {
      match.$elemMatch.p = {$gte: pmin, $lte: pmax};
    } else if (pmin) {
      match.$elemMatch.p = {$gte: pmin};
    } else if (pmax) {
      match.$elemMatch.p = {$lte: pmax};
    }

    switch(request.query['s']) {
      case 'o':
        match.$elemMatch.t = {$all:['S']};
        break;
      case 'x':
        match.$elemMatch.t = {$not:{$in:['S']}};
        break;
      default:
    }
    return match;
  }

  var eTag = crypto.createHash('md5');
  var date = new Date(request.query['d']).toJSON().slice(0,10).replace('-','').replace('-',''); 
  var rates = request.db.collection('Rates' + date);

  var nightsList = request.query['n'].split(',');

  var projection = {'_id':0, 'hi':1};
  var match = buildRateMatcher(); //{ $elemMatch: {a:{$gte:parseInt(request.query['a']||2)}}};
      
  for (var n = 0; n < nightsList.length; n++) {
    projection[nightsList[n]] = match;
  }
      
  var rateResponse = [];

  var searchQuery = {'hi': {$in: request.ids}};
  if (nightsList.length > 1){
    var x = [];
    for (var n = 0; n < nightsList.length; n++) {
      var o = {};
      o[nightsList[n]] = match;
      x.push(o);
    }
    searchQuery.$or = x;

  } else {
    searchQuery[request.query['n']] = match;
  }

  var mapHotel = function (rate) {
    var hotel = request.hotels[rate.hi];
    
    var rates = [];
    for(n = 0; n < nightsList.length; n++) {
      var nights = nightsList[n];
      rates.push({
        nights: parseInt(nights),
        roomId: rate[nights][0].rm,
        adults: rate[nights][0].a,
        children: rate[nights][0].c,
        price: rate[nights][0].p
      });
    }

    return {
      hotelId: hotel.hi,
      name: hotel.hn,
      stars: hotel.nsr,
      'location': { lat: hotel.l.la, 'long': hotel.l.lo },
      address: hotel.add,
      rates: nightsList.length > 1 ? rates : rates[0] 
    };
  }

  var rateStream = rates.find(searchQuery, projection).stream();
      
  rateStream.on('data', function(rate) {
    var hotel = mapHotel(rate);//request.hotels[rate.hi];
   // for (var n = 0; n < nightsList.length; n++) {
     // hotel[nightsList[n]] = rate[nightsList[n]];
    //}
        
    rateResponse.push(hotel);
    eTag.update(JSON.stringify(hotel));
  });
  rateStream.on('end', function() {
    rateResponse.sort(function(a,b){return (a[nightsList[0]]||[{p:99999999}])[0].p - (b[nightsList[0]]||[{p:99999999}])[0].p;});
    response.setHeader('X-HotelsAvailable', rateResponse.length.toString());
    var hash = eTag.digest('hex');
    response.setHeader('ETag',hash);
    response.send(rateResponse);
    next();
  });
}

var rates = function(request, response, next) {
  var db = request.db;
  var collection = db.collection('Rates'+request.params.year+request.params.month+request.params.date);
  var projection = {hi:1,_id:0};
  projection[request.params.nights] = 1;
  
  collection.findOne({_id: request.params.id},projection, function(err,doc){
    response.send(err||doc);
  });
  next();
}

var start = function(config) {
  var server = restify.createServer();
  server.use(restify.queryParser());
  server.use(restify.gzipResponse());

  var mongo = new Mongo(config.mongo_url);

  server.get('/hotels/', mongo.connect, getHotels, getRates);
  server.get('/hotels/:id/rates/:year/:month/:date/:nights', mongo.connect, rates);

  server.listen(config.port);
}

exports.start = start;

