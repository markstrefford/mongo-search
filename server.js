var restify = require('restify');
var Mongo = require('./mongo.js').Mongo;
var hotel = require('./hotel.js');
var rates = require('./rates.js');
var currency = require('./currency.js');
var hotelDetails = require('./hotel-details.js');
var events = require("./events.js");
var stats = require("./stats.js");
var searchQuery = require('./search-query.js');
var searchResponse = require('./search-response.js');
var cache = require('./cache.js');

var start = function(config) {
  var server = restify.createServer();

  server.pre(currency.exchangeRates());

  server.use(restify.queryParser());
  server.use(restify.gzipResponse());

  var mongo = new Mongo(config.mongo_url);

  server.use(stats(server));

  server.get('/query/', searchQuery.parse(), function(request, response, next) {response.send(request.headers.host);next();});
  server.get('/ex/', function(request, response, next) {response.send(request.exchangeRates);next();});
  server.get('/hotels/', mongo.connect, searchQuery.parse(), cache.checkForCache, hotel.getHotels(), rates.getRates(), searchResponse.constructResponse(), cache.cacheResponse());
  server.get('/hotels/:id/rates/:year/:month/:date/:nights', mongo.connect, hotelDetails.getAllRates());

  server.listen(config.port);

  events.initialise(config.amqp_opts, server);
}

exports.start = start;

