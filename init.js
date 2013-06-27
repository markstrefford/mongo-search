var server = require('./server.js');

server.start({
  mongo_url: 'mongodb://10.44.22.224:27017/search',
  currency_url: 'http://currency.services.laterooms.com/service.svc/currencies',
  port: 9090
});
