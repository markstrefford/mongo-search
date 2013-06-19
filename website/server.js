var restify = require("restify");

var server = restify.createServer({
	name: "Authentication"
});
server.use(restify.bodyParser());

require('./app/bootstrapper')(server, function() {
	server.listen(8880, function() {
		console.log('%s listening at %s', server.name, server.url);
	});
});