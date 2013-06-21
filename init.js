var server = require('./server.js');

server.start({
  mongo_url: 'mongodb://localhost:27017/search',
  currency_url: 'http://currency.services.laterooms.com/service.svc/currencies',
  port: 9090
});
