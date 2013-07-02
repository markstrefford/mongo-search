var constructResponse = require('./search-response.js');

var checkForCache = function(request, response, next) {
  
  var page = request.page.number;
  var size = request.page.size;
  var cache = request.db.collection('Cache');

  cache.findOne({ _id: request.cacheKey },
    {
      availableCount: 1,
      hotelCount: 1,
      rates: request.sort.descending 
        ? { $slice : [-size*page, size] }
        : { $slice : [size*(page-1), size] }
    }, 
    function(err, doc) {
      if(err) {
        console.log(err);
        next();
        return;
      }
      if(doc) {  
        var size = request.page.size;
        if(page > 1) {
          response.setHeader('X-Prev', request.getUrlForPage(page-1));
        }
        if(page*size < doc.availableCount) {
          response.setHeader('X-Next', request.getUrlForPage(page+1));     
        }
        response.setHeader('X-HotelsAvailable', doc.availableCount);
        response.setHeader('X-HotelCount', doc.hotelCount);
        response.setHeader('X-CachedAt', doc.timeStamp);

        var rates = request.sort.descending
          ? doc.rates.reverse()
          : doc.rates;

        constructResponse.from(
          request.exchangeRates[request.currency], 
          rates,//.slice((page-1)*size, page*size), 
          response);
        next(false);
        return;
      }
      next();
    });
}

var cacheResponse = function (request, response, next) {
  var cache = request.db.collection('Cache');
  var doc = {
    _id: request.cacheKey,
    timeStamp: new Date(), 
    rates: request.rateResponse,
    availableCount: request.rateResponse.length,
    hotelCount: request.ids.length,
  };

  var rates = request.sort.descending
    ? request.rateResponse.reverse()
    : request.rateResponse;

  cache.save({
    _id: request.cacheKey,
    timeStamp: new Date(), 
    rates: rates,
    availableCount: request.rateResponse.length,
    hotelCount: request.ids.length,
  }, function (err) {
    console.log(err);
  });

  next();
}

module.exports.checkForCache = checkForCache;
module.exports.cacheResponse = function(){
  return cacheResponse;
}
