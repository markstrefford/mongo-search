var restify = require('restify');
var search = require('./search.js');
var Mongo = require('./mongo.js').Mongo;
var currency = require('./currency.js');
var hotelDetails = require('./hotel-details.js');
var events = require("./events.js");
var stats = require("./stats.js");
var os = require('os');

var start = function(config) {
  var server = restify.createServer({
    name: os.hostname()
  });
  
  var mongo = new Mongo(config.mongo_url);
  server.pre(mongo.getConnection);
  server.pre(currency.exchangeRates());

  server.use(restify.queryParser());
  server.use(restify.fullResponse());

  server.use(stats(server));

  server.get('/ex/', function(request, response, next) {response.send(request.exchangeRates);next();});
  server.get('/search/', search.search(config));
  server.get('/hotels/', search.hotels(config));
  server.get('/hotels/:id/rates/:year/:month/:date/:nights', mongo.connect, hotelDetails.getAllRates());

  mongo.on('connected', function() {
    server.listen(config.port);
    console.log('service listening on port ' + config.port);
  });
  mongo.on('error', function() { 
    console.log('Failed to connect to Mongo database');
    setTimeout(mongo.connect, 10000);
  });

  mongo.connect();

  events.initialise(config.amqp_opts, server);
}

exports.start = start;

