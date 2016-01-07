var Hapi = require('hapi');
var Bell = require('bell');
var AuthCookie = require('hapi-auth-cookie');
var config = require('getconfig');
var server = new Hapi.Server();
var routes = require('./server/routes');

server.connection({
	host: 'localhost',
	port: 8000});

server.register([Bell, AuthCookie], function (err) {
	if (err) {
		console.error(err);
		return process.exit(1);
	}

	var authCookieOptions = {
		password: 'cookie-encryption-password',
		cookie: 'sitepoint-auth',
		isSecure: false
	};

	server.auth.strategy('site-point-cookie', 'cookie', authCookieOptions);

	var bellAuthOptions = {
		provider: 'github',
		password: 'github-encryption-password',
		clientId: config.githubOAuth.clientId,
		clientSecret: config.githubOAuth.clientSecret,
		isSecure: false
	};

	server.auth.strategy('github-oauth', 'bell', bellAuthOptions);

	server.auth.default('site-point-cookie');

	server.route(routes);

	server.start(function (err) {
		if (err) {
			console.error(err);
			return process.exit(1);
		}

		console.log('Server started at %s', server.info.uri);
	});
});