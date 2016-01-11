var Promise = require('bluebird');
var github = require('octonode');
var config = require('getconfig');
var org = config.organization;
var _ = require('lodash');

module.exports = {
	main: function (request, reply) {
		if (request.auth.isAuthenticated) {
			var client = Promise.promisifyAll(github.client(request.auth.credentials.token));
			var ghorg = client.orgAsync(org);
		    return ghorg.member(request.auth.credentials.profile.username)
		    .then(function (err, isMember, headers) {
		    	if (err) { throw err; }
				if (isMember) {
					return client.getAsync('/orgs/'+ org + '/issues', {})
					.then(function (err, status, body, headers) {
						if (err) { throw err; }
						// only send necessary data to the client
						var issues = [];
						_.forEach(body, function(n) {
							issues.push(_.pick(n, ['id', 'html_url', 'state', 'title', 'body']));
						});
						var pullRequests = [];
						return ghorg.repos()
						.then(function (err, repos) {
							if (err) { throw err; }
							repos.forEach(function (repo) {
								var ghrepo = client.repoAsync(repo.full_name);
								pullRequests.push(ghrepo.prs({state: 'open'}));
							});
							return Promise.all(pullRequests)
							.then(function () {
								console.log('my prs', pullRequests);
								var context = { 
									profile: request.auth.credentials.profile,
									issues: issues,
									pullRequests: pullRequests
								};
								return reply.view('account', context);
							});
						});
					});
				} else {
					// error, user not on team
				}
			});
		}
		reply.view('401').code(401);
	}
};