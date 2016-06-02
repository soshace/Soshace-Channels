Meteor.methods({
	'postCodeToService': function(code, service) {
		var url;
		if (service === 'github') {
			url = 'https://github.com/login/oauth/access_token';
		}
		if (service === 'bitbucket') {
			url = 'https://bitbucket.org/site/oauth2/access_token';
		}

		return Meteor.http.post(url, {
			params: {
				client_id: Meteor.settings.public[service + '_client_id'],
				client_secret: Meteor.settings.private[service + '_client_secret'],
				code: code,
				grant_type: 'authorization_code'
			}
		});
	},

	'refreshBitbucketToken': function(refreshToken) {
		var url = 'https://bitbucket.org/site/oauth2/access_token';
		return Meteor.http.post(url, {
			params: {
				client_id: Meteor.settings.public['bitbucket_client_id'],
				client_secret: Meteor.settings.private['bitbucket_client_secret'],
				refresh_token: refreshToken,
				grant_type: 'refresh_token'
			}
		});
	},

	'refreshBitbucketTokenByGuest': function(channelId) {
		var hostId = Channels.findOne(channelId).createdBy,
			user = Meteor.users.findOne(hostId),
			refreshToken = _.findWhere(user.profile.serviceTokens, {
				serviceName: 'bitbucket'
			}).refreshToken,
			url = 'https://bitbucket.org/site/oauth2/access_token';

		return Meteor.http.post(url, {
				params: {
					client_id: Meteor.settings.public['bitbucket_client_id'],
					client_secret: Meteor.settings.private['bitbucket_client_secret'],
					refresh_token: refreshToken,
					grant_type: 'refresh_token'
				}
			},
			function(error, results) {
				var userTokens = user.profile.serviceTokens,
					newToken = results.data.access_token;

				if (userTokens) {
					var tokenIndex = -1;
					_.map(userTokens, function(data, index) {
						if (data.serviceName === 'bitbucket') {
							tokenIndex = index;
						}
					});
					if (tokenIndex > -1) {
						userTokens[tokenIndex].token = newToken;
					}
				}

				Meteor.users.update({
					_id: hostId
				}, {
					$set: {
						'profile.serviceTokens': userTokens
					}
				}, function(error, results) {
					if (error) {
						console.log(error);
					} else {
						console.log(results);
					}
				});
			});
	},

	'getGithubDataForGuest': function(url, channelId) {
		var hostId = Channels.findOne(channelId).createdBy,
			hostTokens = Meteor.users.findOne(hostId).profile.serviceTokens,
			hostToken = _.findWhere(hostTokens, {
				serviceName: 'github'
			}).token,
			options = {
				headers: {
					'User-Agent': 'node.js'
				}
			};

		if (!hostToken) {
			console.log('Host token is undefined!')
			return {};
		}
		url = url + hostToken;
		return Meteor.http.get(url, options);
	},

	'getBitbucketDataForGuest': function(url, channelId) {
		var hostId = Channels.findOne(channelId).createdBy,
			hostTokens = Meteor.users.findOne(hostId).profile.serviceTokens,
			hostToken = _.findWhere(hostTokens, {
				serviceName: 'bitbucket'
			}).token,
			options = {
				headers: {
					'User-Agent': 'node.js'
				}
			};

		if (!hostToken) {
			console.log('Host token is undefined!')
			return {};
		}
		url = url + hostToken;
		return Meteor.http.get(url, options);
	}

});