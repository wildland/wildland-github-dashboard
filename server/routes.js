var views = require('./views');

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
  },
  {
    method: 'GET',
    path: '/account',
    config: {
      auth: {
        mode: 'optional'
      },
      handler: views.account.main
    }
  },
  {
  	method: 'GET',
  	path: '/account/issues/{page}',
  	config: {
  		auth: {
  			mode: 'optional'
  		},
  		handler: views.account.nextIssuePage
  	}
  },
  {
    method: 'GET',
    path: '/',
    config: {
      auth: {
        mode: 'optional'
      },
      handler: function (request, reply) {
        if(request.auth.isAuthenticated) {
          return reply.redirect('/account');
        }
        reply.view('index');
      }
    }
  },
  {
    method: 'GET',
    path: '/login',
    config: {
      auth: 'github-oauth',
      handler: function (request, reply) {
        if (request.auth.isAuthenticated) {
          // store session info
          request.cookieAuth.set(request.auth.credentials);
          return reply.redirect('/account');
        }
        reply.view('401').code(401);
      }
    }
  },
  {
    method: 'GET',
    path: '/logout',
    config: {
      auth: false,
      handler: function (request, reply) {
        // Clear the session information
        request.cookieAuth.clear();
        reply.redirect('/');
      }
    }
  }
];

module.exports = routes;
