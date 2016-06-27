var plugins = {};

Meteor.methods({
	'postCodeToService': function(code, service) {
		var url;
		if (service === 'github') {
			url = 'https://github.com/login/oauth/access_token';
		}
		if (service === 'bitbucket') {
			url = 'https://bitbucket.org/site/oauth2/access_token';
		}

		if (service === 'yandex') {
			url = 'https://oauth.yandex.ru/token';
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
					}
				});
			});
	},

	'getDataForGuest': function(url, channelId) {
		var channel = Channels.findOne(channelId),
			hostId = channel.createdBy,
			serviceName = channel.serviceType,
			hostTokens = Meteor.users.findOne(hostId).profile.serviceTokens,
			serviceData = _.findWhere(hostTokens, {
				serviceName: serviceName
			}),
			token = serviceData ? serviceData.token : '',
			options = {
				headers: {
					'User-Agent': 'node.js'
				}
			};

		if (!token) {
			console.log('Host is not logged in to service!')
			return {};
		}
		url = url + token;
		return Meteor.http.get(url, options);
	},

	'getYandexMessages': function(channelId, page) {
		if (!plugins[this.userId] || !(channelId === plugins[this.userId].channelId)) {
			plugins[this.userId] = new YandexPlugin(channelId);
		}
		return plugins[this.userId].getInboxMessages(page);
	},

	'getOneMessage': function(channelId, id) {
		if (!plugins[this.userId]) {
			plugins[this.userId] = new YandexPlugin(channelId);
		}
		return plugins[this.userId].getMessage(id);
	},

	'replyEmail': function(message) {
		plugins[this.userId].replyEmail(message);
	},

	'deleteEmail': function(uid) {
		plugins[this.userId].deleteMessage(uid);
	},

	'addToken': function(params) {
		var currentUserId = Meteor.userId(),
			userTokens = Meteor.user().serviceTokens,
			Future = Npm.require('fibers/future'),
			fut = new Future();

		if (params.serviceName === 'yandex') {
			var url = 'https://login.yandex.ru/info?oauth_token=' + params.token;
			options = {
				headers: {
					'User-Agent': 'node.js'
				}
			};

			Meteor.http.get(url, options, function(err, results) {
				if (err) {
					return;
				}
				params.login = results.data.login;
				if (userTokens) {
					var tokenIndex = -1;
					_.each(userTokens, function(data, index) {
						if ((data.serviceName === params.serviceName) && (data.login === params.login)) {
							tokenIndex = index;
						}
					});
					if (tokenIndex > -1) {
						userTokens[tokenIndex] = params;
					} else {
						userTokens.push(params);
					}
				} else {
					userTokens = [params];
				}

				Meteor.users.update({
					_id: currentUserId
				}, {
					$set: {
						'serviceTokens': userTokens
					}
				}, function(error, results) {
					if (error) {
						console.log(error);
					}
					fut.return();
				});
			});
		} else {
			if (userTokens) {
				var tokenIndex = -1;
				_.each(userTokens, function(data, index) {
					if (data.serviceName === params.serviceName) {
						tokenIndex = index;
					}
				});
				if (tokenIndex > -1) {
					userTokens[tokenIndex] = params;
				} else {
					userTokens.push(params);
				}
			} else {
				userTokens = [params];
			}
			Meteor.users.update({
				_id: currentUserId
			}, {
				$set: {
					'serviceTokens': userTokens
				}
			}, function(error, results) {
				if (error) {
					console.log(error);
				}
				fut.return();
			});
		}
		return fut.wait();
	},

	'clearSession': function() {
		delete plugins[this.userId]
	}
});