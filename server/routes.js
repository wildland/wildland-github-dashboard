var views = require('./views');

var routes = [
	{
		method: 'GET',
		path: '/login',
		config: {
			auth: 'github-oauth',
			handler: function (request, reply) {

				if (request.auth.isAuthenticaed) {
					request.auth.session.set(request.auth.credentials);
					return reply('Hello ' + request.auth.credentials.profile.displayName);
				}
				reply('Not logged in...').code(401);
			}
		}
	},{
		method: 'GET',
		path: '/account',
		config: {
			handler: function (request, reply) {
				// Show the account information if the have logged in already
                // otherwise, send a 401
				reply(request.auth.credentials.profile);
			}
		}
	},{
		method: 'GET',
		path: '/',
		config: {
			auth: {
				mode: 'optional'
			},
			handler: function (request, reply) {

				if(request.auth.isAuthenticaed) {
					return reply('welcome back ' + request.auth.credentials.profile.displayName);
				}
				reply('hello stranger!');
			}
		}
	},{
		method: 'GET',
		path: '/logout',
		config: {
			handler: function (request, reply) {
				// Clear the session information
				reply.redirect();
			}
		}
	}];

module.exports = routes;