var async = require('async');
var github = require('octonode');
var config = require('getconfig');
var octopage = require('github-pagination');
var org = config.organization;
var _ = require('lodash');
var client;

// Client to access Github API

module.exports = {
  main: function (request, reply) {
  	client = github.client(request.auth.credentials.token);
    if (request.auth.isAuthenticated) {
      var ghorg = client.org(org);
      return ghorg.member(
        request.auth.credentials.profile.username,
        function (err, isMember, headers) {
          if (err) { throw err; }
          if (isMember) {
            return client.get(
              '/orgs/'+ org + '/issues',
              {page: 1},
              function (err, status, body, headers) {
                if (err) { throw err; }
                // only send necessary data to the client
                var lastPageIssues;
                var thisPageIssues;
                if (headers.link) {
                  var linkHeader = header.link;
                  var pagination = octopage.parser(linkHeader);
                  lastPageIssues = pagination.last;
                  thisPageIssues = pagination.next - 1;
                }
                var issues = [];
                _.forEach(body, function(n) {
                  issues.push(_.pick(n, ['id', 'html_url', 'state', 'title', 'body']));
                });
                return ghorg.repos(function (err, repos) {
                  if (err) { throw err; }
                  async.map(
                    repos,
                    function (repo, cb) {
                      client.get('/repos/' + repo.full_name + '/pulls', {state: 'open'}, function (err, status, body, headers) {
                        if (err) { cb(err); }
                        cb(null, body);
                      });
                    },
                    function (err, results) {
                      var pullRequests = [];
                      prList = _.flatten(results);
                      _.forEach(prList, function (n) {
                        pullRequests.push(_.pick(n, ['id', 'html_url', 'state', 'title', 'body']));
                      });
                      var context = {
                        profile: request.auth.credentials.profile,
                        issues: issues,
                        lastPageIssues: lastPageIssues,
                        thisPageIssues: thisPageIssues,
                        pullRequests: pullRequests
                      };
                      return reply.view('account', context);
                    }
                  );
                });
              }
            );
          } else {
            // error, user not on team
          }
        }
      );
    }
    reply.view('401').code(401);
  },
  nextIssuePage: function (request, reply) {
  	client = github.client(request.auth.credentials.token);
  	if (request.auth.isAuthenticated) {
  	  var ghorg = client.org(org);
	  return ghorg.member(
	    request.auth.credentials.profile.username,
	    function (err, isMember, headers) {
	      if (err) { throw err; }
	      if (isMember) {
	      	/********* GET NEXT PAGE OF ISSUES *****/
	      	var requestedPage = request.params.page;
	        return client.get(
	          '/orgs/'+ org + '/issues',
	          {page: requestedPage},
	          function (err, status, body, headers) {
	            if (err) { throw err; }
	            var lastPageIssues;
	            var thisPageIssues;
	            if (headers.link) {
	              var linkHeader = header.link;
	              var pagination = octopage.parser(linkHeader);
	              lastPageIssues = pagination.last;
	              thisPageIssues = pagination.next - 1;
	            }
	            /******** END CHANGES IN HANDLER ****/
	            var issues = [];
	            _.forEach(body, function(n) {
	              issues.push(_.pick(n, ['id', 'html_url', 'state', 'title', 'body']));
	            });
	            // get all the pulls
	            // TODO: decide whether to break this into separate pages to prevent
	            // having to get make all the same requests
	            return ghorg.repos(function (err, repos) {
                  if (err) { throw err; }
                  async.map(
                    repos,
                    function (repo, cb) {
                      client.get('/repos/' + repo.full_name + '/pulls', {state: 'open'}, function (err, status, body, headers) {
                        if (err) { cb(err); }
                        cb(null, body);
                      });
                    },
                    function (err, results) {
                      var pullRequests = [];
                      prList = _.flatten(results);
                      _.forEach(prList, function (n) {
                        pullRequests.push(_.pick(n, ['id', 'html_url', 'state', 'title', 'body']));
                      });
                      var context = {
                        profile: request.auth.credentials.profile,
                        issues: issues,
                        lastPageIssues: lastPageIssues,
                        thisPageIssues: thisPageIssues,
                        pullRequests: pullRequests
                      };
                      return reply.view('account', context);
                    }
                  );
                });
			  }
			);
          }
	    }
	  );
    }
  }
};
