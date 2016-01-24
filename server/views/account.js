var async = require('async');
var github = require('octonode');
var config = require('getconfig');
var octopage = require('github-pagination');
var org = config.organization;
var _ = require('lodash');
var client;

// get all pull requests for a given repo
var getAllPRs = function getAllPRs(client, repoName, pagesCount, cbRepos) {
  async.map(pagesArr,
    function (repoName, pagesCount, cbPulls) {
      // generates array [0, 1,.., pagesCount]
      var pagesArr = Array.apply(null, {length: pagesCount}).map(Number.call, Number);
      client.get(
        '/repos/' + repoName + '/pulls', 
        {state: 'open', page: page + 1, per_page: 100}, 
        function (err, status, body, headers) {
        if (err) { cb(err); }
          cbPulls(null, body);
        }
      );
    },
    function (err, allPages) {
      allPulls = _.flatten(allPages);
      cbRepos(null, allPulls);
    }
  );
};

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
  issues: function (request, reply) {
    client = github.client(request.auth.credentials.token);
    if (request.auth.isAuthenticated) {
      var ghorg = client.org(org);
      return ghorg.member(
        request.auth.credentials.profile.username,
        function (err, isMember, headers) {
          if (err) { throw err; }
          if (isMember) {
            // get requested page of issues
            var requestedPage = request.params.page;
            return client.get(
              '/orgs/'+ org + '/issues',
              {page: requestedPage},
              function (err, status, body, headers) {
                if (err) { throw err; }
                // handle pagination if necessary
                var lastPageIssues;
                var thisPageIssues;
                if (headers.link) {
                  var linkHeader = headers.link;
                  var pagination = octopage.parser(linkHeader);
                  lastPageIssues = pagination.last;
                  thisPageIssues = pagination.next - 1;
                }
                var issues = [];
                _.forEach(body, function(n) {
                  issues.push(_.pick(n, ['id', 'html_url', 'state', 'title', 'body']));
                });

                var context = {
                  profile: request.auth.credentials.profile,
                  issues: issues,
                  lastPageIssues: lastPageIssues,
                  thisPageIssues: thisPageIssues
                };
                return reply.view('issues', context);
              }
            );
          }
        }
      );
    }
  },
  pulls: function (request, reply) {
    client = github.client(request.auth.credentials.token);
    if (request.auth.isAuthenticated) {
      var ghorg = client.org(org);
      return ghorg.member(
        request.auth.credentials.profile.username,
        function (err, isMember, headers) {
          if (err) { throw err; }
          if (isMember) {
            var requestedPage = request.params.page;
            // get requested page of repos
            return ghorg.repos({page: requestedPage},
              function (err, repos, headers) {
                if (err) { throw err; }
                // handle pagination, pass in current and last page to template
                var lastPageRepos;
                var thisPageRepos;
                if (headers.link) {
                  var linkHeader = headers.link;
                  var pagination = octopage.parser(linkHeader);
                  console.log(pagination);
                  if (!pagination.last) {
                    // on last page
                    lastPageRepos = parseInt(pagination.prev) + 1;
                    thisPageRepos = lastPageRepos
                  }
                  else {
                    lastPageRepos = pagination.last;
                    thisPageRepos = pagination.next - 1;
                  }
                }
                // get all pull requests for each repo
                async.map(
                  repos,
                  function (repo, cbRepos) {
                    client.get('/repos/' + repo.full_name + '/pulls', {state: 'open'}, function (err, status, body, headers) {
                      if (err) { cb(err); }
                      var allPulls = body;
                      if (headers.link) {
                        console.log('Retrieving more than one page of PRs');
                        // if link header is returned there is more than one page or PRs for this repo
                        var pagination = octopage.parser(headers.link);
                        var pagesCount = pagination.last; 
                        getAllPRs(client, repo.full_name, pagesCount, cbRepos);
                      } 
                      else {
                        // there is only one page of pull requests
                        cbRepos(null, allPulls);
                      }
                    });
                  },
                  function (err, allPullRequests) {
                    var pullRequests = [];
                    prList = _.flatten(allPullRequests);
                    _.forEach(prList, function (n) {
                      pullRequests.push(_.pick(n, ['id', 'html_url', 'state', 'title', 'body']));
                    });
                    var context = {
                      profile: request.auth.credentials.profile,
                      pulls: pullRequests,
                      lastPageRepos: lastPageRepos,
                      thisPageRepos: thisPageRepos
                    };
                    return reply.view('pulls', context);          
                  }
                );
              }
            );
          }
        }
      );
    }
  }
};
