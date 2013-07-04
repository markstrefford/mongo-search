
var getRates = function (request, response, next) {

  var getRateFilter = function() {
    var match = {
      a: { $gte: request.search.adults},
      o: { $gte: request.search.adults + request.search.children}
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

  var projection = {'_id':0, 'hi':1};

  for (var n = 0; n < request.search.nights.length; n++) {
    projection[request.search.nights[n].toString()] = filter;
  }

  request.rateResponse = [];

  var searchQuery = {'hi': {$in: request.ids}};
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
    var hotel = request.hotels[rate.hi];
    var rates = [];
    for(n = 0; n < request.search.nights.length; n++) {
      var nights = request.search.nights[n];
      var stayRate = rate[nights.toString()];
      if(!stayRate) break;
      rates.push({
        nights: nights,
        roomId: stayRate[0].rm,
        adults: stayRate[0].a,
        children: stayRate[0].o - stayRate[0].a,
        price: stayRate[0].p,
        convertedPrice: stayRate[0].p / request.exchangeRates[hotel.currency],
        rack: stayRate[0].rr
      });
    }
    hotel.rates = request.search.nights.length > 1 ? rates : rates[0];
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
