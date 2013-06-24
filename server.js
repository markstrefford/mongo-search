var restify = require('restify');
var Mongo = require('./mongo.js').Mongo;
var hotel = require('./hotel.js');
var rates = require('./rates.js');
var currency = require('./currency.js');
var hotelDetails = require('./hotel-details.js');
var searchQuery = require('./search-query.js');
var searchResponse = require('./search-response.js');

var start = function(config) {
  var server = restify.createServer();
  
  server.pre(currency.exchangeRates());

  server.use(restify.queryParser());
  server.use(restify.gzipResponse());

  var mongo = new Mongo(config.mongo_url);

  server.get('/query/', searchQuery.normaliseQueryString(), function(request, response, next) {response.send(request.search);next();});
  server.get('/ex/', function(request, response, next) {response.send(request.exchangeRates);next();});
  server.get('/hotels/', mongo.connect, searchQuery.normaliseQueryString(), hotel.getHotels(), rates.getRates(), searchResponse.constructResponse());
  server.get('/hotels/:id/rates/:year/:month/:date/:nights', mongo.connect, hotelDetails.getAllRates());

  server.listen(config.port);
}

exports.start = start;

