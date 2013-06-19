var restify = require('restify');
var Mongo = require('./mongo.js').Mongo;
var hotel = require('./hotel.js');
var rates = require('./rates.js');
var hotelDetails = require('./hotel-details.js');

var start = function(config) {
  var server = restify.createServer();
  server.use(restify.queryParser());
  server.use(restify.gzipResponse());

  var mongo = new Mongo(config.mongo_url);

  server.get('/hotels/', mongo.connect, hotel.getHotels(), rates.getRates());
  server.get('/hotels/:id/rates/:year/:month/:date/:nights', mongo.connect, hotelDetails.getAllRates());

  server.listen(config.port);
}

exports.start = start;

