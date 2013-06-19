var crypto = require('crypto');


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

  var mapRates = function (rate) {
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
    hotel.rates = nightsList.length > 1 ? rates : rates[0];
    return hotel;
  }

  var rateStream = rates.find(searchQuery, projection).stream();

  rateStream.on('data', function(rate) {
    var hotel = mapRates(rate);
    rateResponse.push(hotel);
    eTag.update(JSON.stringify(hotel));
  });

  var priceComparer = function(a, b) {
    return a.rates.price - b.rates.price;
  }

  rateStream.on('end', function() {
    rateResponse.sort(priceComparer);
    response.setHeader('X-HotelsAvailable', rateResponse.length.toString());
    response.setHeader('X-HotelCount', request.ids.length.toString());
    response.setHeader('ETag', eTag.digest('hex'));
    response.send(rateResponse);
    next();
  });
}

module.exports.getRates = function() {
  return [
           getRates
         ];
}
