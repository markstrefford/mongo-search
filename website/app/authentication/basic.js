module.exports = function(server, done) {
	
	var passport;
	require('./userstore')(function(store) {
		require('./local-passport')(store, function(pass) {
			passport = pass;
			server.use(passport.initialize());
			registerRoutes();
			done();
		});
	});
	
	function registerRoutes() {
		server.post('/login/basic', attemptLogin);
	}

	function attemptLogin(request, response, next) {
		passport.authenticate('local', function(err, user, info) { 
			if (err || !user) response.send(401);

			request.logIn(user, function(err) {
				response.send(200);
			});
		})(request, response, next);
	}
};
