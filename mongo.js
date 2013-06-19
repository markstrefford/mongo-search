var MongoClient = require('mongodb').MongoClient;

var Mongo = function(url) {
  this.connect = function(request, response, next) {
    MongoClient.connect(url, function (err, db) {
      if (err) {
        next(err);
        return;
      }
      request.db = db;
      next();
    });
  }
}

module.exports.Mongo = Mongo;
