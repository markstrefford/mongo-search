var server = require('./server.js');

server.start({
  mongo_url: 'mongodb://localhost:27017/test',
  port: 9090
});
