module.exports = function(done) {
	(function openDatabase() {
		var Db = require('mongodb').Db;
		var Connection = require('mongodb').Connection;
		var Server = require('mongodb').Server;

		var db = new Db('test', new Server('localhost', 27017, {}), {w:-1});
		db.open(function(err, db) {
			db.collection('test', function(err, collection) {
				done(collection);
			});
		});
	})();
};