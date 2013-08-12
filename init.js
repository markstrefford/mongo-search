var server = require('./server.js');

var config = {
  cache_url: 'mongodb://localhost:27017/search?maxPoolSize=50',
  mongo_url: 'mongodb://localhost:27017/search?maxPoolSize=50',
  //mongo_url: 'mongodb://localhost:9000/search',
  currency_url: 'http://currency.services.laterooms.com/service.svc/currencies',
  amqp_opts: {
    url: "amqp://guest:guest@10.44.22.188:5672"
  },
  port: 9090
}

if (process.argv.length>2) {
  config.port = parseInt(process.argv[2]);
}

server.start(config);
