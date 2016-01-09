// var views = require('./views');

var routes = [
	{
	    method: 'GET',
	    path: '/css/{path*}',
	    config: {
	    	auth: {
				mode: 'optional'
			},
	        handler: { 
	        	directory: { 
	        		path: './public/css/',
	        		listing: false
        		}
	        }
	    }
	},{
		method: 'GET',
		path: '/account',
		config: {
			auth: {
				mode: 'optional'
			},
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

				if(request.auth.isAuthenticated) {
					return reply('welcome back ' + request.auth.credentials.profile.displayName);
				}
				reply.view('index');
			}
		}
	},{
		method: 'GET',
		path: '/login',
		config: {
			auth: 'github-oauth',
			handler: function (request, reply) {

				if (request.auth.isAuthenticated) {
					request.cookieAuth.set(request.auth.credentials);
					return reply('Hello ' + request.auth.credentials.profile.displayName);
				}
				reply('Not logged in...').code(401);
			}
		}
	},{
		method: 'GET',
		path: '/logout',
		config: {
			auth: false,
			handler: function (request, reply) {
				// Clear the session information
				request.cookieAuth.clear();
				reply.redirect();
			}
		}
	}];

module.exports = routes;