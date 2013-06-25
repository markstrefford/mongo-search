var constructResponse = require('./search-response.js');
var checkForCache = function(request, response, next) {
  
  var cache = request.db.collection('Cache');
  cache.findOne({ _id: request.cacheKey }, function(err, doc) {
    if(err) {
      console.log(err);
      next();
      return;
    }
    if(doc) {
      response.setHeader('X-CachedAt', doc.timeStamp);
      constructResponse.from(request, doc.rates, doc.hotelCount, response, next);
      next(false);
      return;
    }
    next();
  });
}

var cacheResponse = function (request, response, next) {
  var cache = request.db.collection('Cache');

  cache.save({
    _id: request.cacheKey,
    timeStamp: new Date(), 
    rates: request.rateResponse,
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
