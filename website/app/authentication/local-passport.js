module.exports = function(userStore, done) {

	(function bootstrap() { 
		var passport = require('passport');
		var LocalStrategy = require("passport-local").Strategy;
		passport.use(new LocalStrategy(validateUser));
		passport.serializeUser(function(user, done) {
			done(null, user.id);
		});
		done(passport);
	})();

	function validateUser(username, password, callback) {
		userStore.findOne({username:username}, function(err, user) {
			if (err) { 
				return callback(err); 
			}
			if (!user || user.password !== password) {
				return callback(null, false, {message: "invalid credentials"})
			}

			return callback(null, {id:user._id});
		});
	}
};