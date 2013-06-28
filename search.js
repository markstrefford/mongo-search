var query = require('./search-query.js'),
    cache = require('./cache.js'),
    hotel = require('./hotel.js'),
    rates = require('./rates.js'),
    response = require('./search-response.js');

var search = function (config) {
  return [
    query.parse(),
    cache.checkForCache,
    hotel.getHotels(),
    rates.getRates(),
    response.constructResponse(),
    cache.cacheResponse()
  ];
}

module.exports.search = search;
