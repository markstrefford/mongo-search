module.exports = function(server, done) {
	require('./authentication/basic')(server, done);
};