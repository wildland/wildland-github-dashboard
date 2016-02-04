var Hapi = require('hapi');
var Bell = require('bell');
var AuthCookie = require('hapi-auth-cookie');
var Vision = require('vision');
var Inert = require('inert');
var jade = require('jade');
var routes = require('./server/routes');
var server = new Hapi.Server();
require('dotenv').config();

server.connection({
  host: '0.0.0.0',
  port: process.env.PORT || 3000
});

server.register([Bell, AuthCookie, Vision, Inert], function(err) {
  if (err) {
    console.error(err);
    return process.exit(1);
  }

  server.views({
    engines: { jade: jade },
    path: __dirname + '/templates',
    compileOptions: {
      pretty: true,
    }
  });

  var authCookieOptions = {
    password: 'cookie-encryption-password',
    cookie: 'sitepoint-auth',
    isSecure: false
  };

  server.auth.strategy('site-point-cookie', 'cookie', authCookieOptions);

  var bellAuthOptions = {
    provider: 'github',
    password: 'github-encryption-password',
    scope: ['user:email', 'repo', 'read:org'],
    clientId: process.env.CLIENTID,
    clientSecret: process.env.CLIENTSECRET,
    isSecure: false
  };

  server.auth.strategy('github-oauth', 'bell', bellAuthOptions);

  server.auth.default('site-point-cookie');

  server.route(routes);

  server.start(function(err) {
    if (err) {
      console.error(err);
      return process.exit(1);
    }

    console.log('Server started at %s', server.info.uri);
  });
});
