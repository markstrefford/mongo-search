
var getRates = function (request, response, next) {

  var getRateFilter = function() {
    var match = {
      a: { $gte: request.search.adults },
      o: { $gte: request.search.adults + request.search.children },
      $or: [{ ds: { $exists: 0 } }, { de: { $lte: request.search.today } }],
      $or: [{ de: { $exists: 0 } }, { de: { $gte: request.search.today } }]
    };
    
    if(request.search.maxPrice) match.p = { $lte: request.search.maxPrice };
    if(request.search.minPrice) match.p 
      ? match.p.$gte = request.search.minPrice
      : match.p = { $gte: request.search.minPrice };
    switch(request.search.specialOffers) {
      case 'o':
        match.t = { $all: ['S']};
        break;
      case 'x':
        match.t = { $not: { $in: ['S']}};
        break;
      default:
        break;
    }
    return { $elemMatch: match };
  }

  var filter = getRateFilter();

  var date = request.search.date.toJSON().slice(0,10).replace('-','').replace('-','');
  var rates = request.db.collection('Rates' + date);

  var projection = {'_id':1};

  for (var n = 0; n < request.search.nights.length; n++) {
    projection[request.search.nights[n].toString()] = request.search.allRates ? 1 : filter;
  }

  request.rateResponse = [];

  var searchQuery = {'_id': {$in: request.ids}};
  if (request.search.nights.length > 1){
    var x = [];
    for (var n = 0; n < request.search.nights.length; n++) {
      var o = {};
      o[request.search.nights[n].toString()] = filter;
      x.push(o);
    }
    searchQuery.$or = x;

  } else {
    searchQuery[request.search.nights[0].toString()] = filter;
  }

  var mapRates = function (rate) {
    var hotel = request.hotels[rate._id];
    var rates = [];
    for(n = 0; n < request.search.nights.length; n++) {
      var nights = request.search.nights[n];
      var stayRates = rate[nights.toString()];
      if(!stayRates) break;
      for(r = 0; r < stayRates.length; r++) { 
        rates.push({
          nights: nights,
          roomId: stayRates[r].rid,
          adults: stayRates[r].a,
          children: stayRates[r].o - stayRates[0].a,
          price: stayRates[r].p,
          convertedPrice: stayRates[r].p / request.exchangeRates[hotel.currency],
          rack: stayRates[r].rr
        });
      }
    }
    hotel.rates = rates;
    return hotel;
  }

  var start = Date.now();
  var rateStream = rates.find(searchQuery, projection).stream();

  rateStream.on('error', function(err) {
    console.log(err);
    next(err);
  });

  rateStream.on('data', function(rate) {
    var hotel = mapRates(rate);
    request.rateResponse.push(hotel);
  });


  rateStream.on('end', function() {
    request.emit('stats', {
      rates_query_time: Date.now() - start,
      rates_count: request.rateResponse.length
    });
    next();
  });
}

module.exports.getRates = function() {
  return [
           getRates
         ];
}
