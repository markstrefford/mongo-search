var server = require('./server.js');

server.start({
  //mongo_url: 'mongodb://10.44.22.224:27017/search',
  mongo_url: 'mongodb://localhost:27017/search',
  currency_url: 'http://currency.services.laterooms.com/service.svc/currencies',
  amqp_opts: {
    url: "amqp://guest:guest@10.44.22.188:5672"
  },
  port: 9091
});
