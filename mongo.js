var MongoClient = require('mongodb').MongoClient,
    util = require('util'),
    events = require('events');

var Mongo = function(url) {

  events.EventEmitter.call(this);
  
  var self = this;
  var db;

  this.connect = function() {
    MongoClient.connect(url, function (err, connection) {
      if (err) {
        console.log(JSON.stringify(err));
        self.emit('error');
        return;
      }
      db = connection;
      self.emit('connected');
    });
  }

  this.getConnection = function(request, response, next) {
    request.db = db;
    next();
  }
}

util.inherits(Mongo, events.EventEmitter);

module.exports.Mongo = Mongo;
