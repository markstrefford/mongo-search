var MongoClient = require('mongodb').MongoClient,
    util = require('util'),
    events = require('events');

var Mongo = function(url) {

  events.EventEmitter.call(this);
  
  var self = this;
  var db = [];
  var curr = 0;

  this.connect = function() {
//    for( var i=0; i<50; i++) {
      MongoClient.connect(url, function (err, connection) {
        if (err) {
          console.log(JSON.stringify(err));
          self.emit('error');
          return;
        }
//        console.log('connected');
        db.push(connection);
//        if(db.length == 50)
          self.emit('connected');
      });
//    }
  }

  this.getConnection = function(request, response, next) {
    request.db = db[0];
    curr = (curr+1)%50;
    next();
  }
}

util.inherits(Mongo, events.EventEmitter);

module.exports.Mongo = Mongo;
