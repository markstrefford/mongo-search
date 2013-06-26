var crypto = require('crypto')
  , events = require("./events.js");

var filterByMaxPrice = function (param, request, response, next) {
  request.rateFilter.$elemMatch.p = request.rateFilter.$elemMatch.p || {};
  request.rateFilter.$elemMatch.p.$lte = parseFloat(request.query[param]);
  next();
}

var filterByMinPrice = function (param, request, response, next) {
  request.rateFilter.$elemMatch.p = request.rateFilter.$elemMatch.p || {};
  request.rateFilter.$elemMatch.p.$gte = parseFloat(request.query[param]);
  next();
}

var filterByAdults = function (param, request, response, next) {
  var match = request.rateFilter.$elemMatch;
  var adults = parseInt(request.query[param]);
  match.a = {$gte: adults};
  if(match.o) { 
     match.o.$gte += adults;
  } else {
     match.o = {$gte: adults};
  }
  request.emit("stats", { adults: adults });
  next();
}

var filterByChildren = function (param, request, response, next) {
  var match = request.rateFilter.$elemMatch;
  var children = parseInt(request.query[param]);
  if(match.o) {
    match.o.$gte += children;
  } else {
    match.o = {$gte: children};
  }
  request.emit("stats", { children: children });
  next();
}
  
var filterBySpecialOffer = function (param, request, response, next) {
  switch(request.query[param]) {
    case 'o':
      request.rateFilter.$elemMatch.t = {$all: ['S']};
      break;
    case 'x':
      request.rateFilter.$elemMatch.t = {$not:{$in:['S']}};
      break;
    default:
  }
  next();
}

var getRates = function (request, response, next) {

  //request.eTag = crypto.createHash('md5');
  var date = new Date(request.query['d'] || new Date()).toJSON().slice(0,10).replace('-','').replace('-','');
  var rates = request.db.collection('Rates' + date);

  var nightsList = (request.query['n']||'1').split(',');

  var projection = {'_id':0, 'hi':1};

  for (var n = 0; n < nightsList.length; n++) {
    projection[nightsList[n]] = request.rateFilter;
  }

  request.rateResponse = [];

  var searchQuery = {'hi': {$in: request.ids}};
  if (nightsList.length > 1){
    var x = [];
    for (var n = 0; n < nightsList.length; n++) {
      var o = {};
      o[nightsList[n]] = request.rateFilter;
      x.push(o);
    }
    searchQuery.$or = x;

  } else {
    searchQuery[request.query['n']] = request.rateFilter;
  }

  var mapRates = function (rate) {
    var hotel = request.hotels[rate.hi];
    var rates = [];
    for(n = 0; n < nightsList.length; n++) {
      var nights = nightsList[n];
      if(!rate[nights]) break;
      rates.push({
        nights: parseInt(nights),
        roomId: rate[nights][0].rm,
        adults: rate[nights][0].a,
        children: rate[nights][0].o - rate[nights][0].a,
        price: rate[nights][0].p,
        convertedPrice: rate[nights][0].p  * request.exchangeRates[request.query['cur']||'GBP'] / request.exchangeRates[hotel.currency],
        rack: rate[nights][0].rr
      });
    }
    hotel.rates = nightsList.length > 1 ? rates : rates[0];
    return hotel;
  }

  var rateStream = rates.find(searchQuery, projection).stream();

  rateStream.on('data', function(rate) {
    var hotel = mapRates(rate);
    request.rateResponse.push(hotel);
    //eTag.update(JSON.stringify(hotel));
  });


  rateStream.on('end', function() {
    next();
  });
}

var sortBy = {
  price: function(a, b) {
    return a.rates.convertedPrice - b.rates.convertedPrice;
  },
  distance: function(a, b) {
    return a.distance - b.distance;
  },
  discount: function(a, b) {
    return (a.rates.rack / a.rates.price) - (b.rates.rack / b.rates.price);
  },
  rating: function(a, b) {
    return a.rating - b.rating;
  },
  stars: function(a, b) {
    return a.stars - b.stars;
  },
  name: function(a, b) {
    if(a.name < b.name) return -1;
    if(a.name > b.name) return 1;
    return 0;
  }
}

var descending = function(sort) {
  return function (a, b) {
    return sort(b, a);
  }
}

var constructResponse = function(request, response, next) {
  
  request.rateResponse.sort(request.query['ord']=='desc'
                            ? descending(sortBy[request.query['sort']])
                            : sortBy[request.query['sort']]);

  response.setHeader('X-HotelsAvailable', request.rateResponse.length.toString());
  response.setHeader('X-HotelCount', request.ids.length.toString());
  //response.setHeader('ETag', request.eTag.digest('hex'));

  var page = parseInt(request.query['pg']||'1');
  var size = parseInt(request.query['ps']||'50');

  response.send(request.rateResponse.slice((page-1)*size, page*size));

  next();
};

var ifSpecified = function(param, filter) {
  return function(request, response, next) {
    if(!request.query[param]) {
      next();
      return;
    }
    if(!request.rateFilter) request.rateFilter = { $elemMatch: {}};

    filter(param, request, response, next);
  };
}

module.exports.getRates = function() {
  return [
           ifSpecified('a', filterByAdults),
           ifSpecified('c', filterByChildren),
           ifSpecified('pmin', filterByMinPrice),
           ifSpecified('pmax', filterByMaxPrice),
           ifSpecified('s', filterBySpecialOffer),
           getRates,
           constructResponse
         ];
}
