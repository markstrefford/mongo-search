var query = require('./query.js'),
    cache = require('./cache.js'),
    hotel = require('./hotel.js'),
    rates = require('./rates.js'),
    response = require('./response.js');

var search = function (config) {

  cache.connect(config.cache_url);

  return [
    query.parse(),
    cache.checkForCache(),
    hotel.getHotels(),
    rates.getRates(),
    response.constructResponse(),
    cache.cacheResponse()
  ];
}

var hotels = function (config) {
  return [
    query.parse(),
    hotel.getHotels(),
    response.constructHotelResponse()
  ];
}

module.exports.search = search;
module.exports.hotels = hotels;
