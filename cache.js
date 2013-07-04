var constructResponse = require('./search-response.js');

var checkForCache = function(request, response, next) {
  
  var page = request.page.number;
  var size = request.page.size;
  var cache = request.db.collection('Cache');
  var start = Date.now();

  cache.findOne({ _id: request.cacheKey },
    {
      timeStamp: 1,
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
        request.emit('stats', {
          cache: 'hit',
          cache_query_time: Date.now() - start
        });
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
          rates, 
          response);
        next(false);
        return;
      }
      request.emit('stats', {
        cache: 'miss',
        cache_query_time: Date.now() - start
      });
      next();
    });
}

var cacheResponse = function (request, response, next) {
  var start = Date.now();
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
    request.emit('stats', { cache_write_time: Date.now() - start });
    next();
  });
}

module.exports.checkForCache = checkForCache;
module.exports.cacheResponse = function(){
  return cacheResponse;
}
