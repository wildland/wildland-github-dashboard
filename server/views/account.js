var async = require('async');
var github = require('octonode');
var config = require('getconfig');
var org = config.organization;
var _ = require('lodash');

module.exports = {
  main: function (request, reply) {
    if (request.auth.isAuthenticated) {
      var client = github.client(request.auth.credentials.token);
      var ghorg = client.org(org);
      return ghorg.member(
        request.auth.credentials.profile.username,
        function (err, isMember, headers) {
          if (err) { throw err; }
          if (isMember) {
            return client.get(
              '/orgs/'+ org + '/issues',
              {},
              function (err, status, body, headers) {
                if (err) { throw err; }
                // only send necessary data to the client
                var issues = [];
                _.forEach(body, function(n) {
                  issues.push(_.pick(n, ['id', 'html_url', 'state', 'title', 'body']));
                });
                return ghorg.repos(function (err, repos) {
                  if (err) { throw err; }
                  async.map(
                    repos,
                    function (repo, cb) {
                      var ghrepo = client.repo(repo.full_name);
                      ghrepo.prs({state: 'open'}, function (err, prs) {
                        if (err) { cb(err); }
                        cb(null, prs);
                      });
                    },
                    function (err, results) {
                      var pullRequests = [];
                      prList = _.flatten(results);
                      _.forEach(prList, function (n) {
                        pullRequests.push(_.pick(n, ['id', 'html_url', 'state', 'title', 'body']));
                      });
                      // console.log('prs', pullRequests);
                      var context = {
                        profile: request.auth.credentials.profile,
                        issues: issues,
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
  }
};
