var plugin;

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

	'getYandexMessages': function(params) {
		if (!plugin){
			plugin = new YandexPlugin(params.channelId, !params.isGuest);			
		}
		return plugin.getInboxMessages(1);
	},

	'getOneMessage': function(params, id, struct) {
		if (!plugin){
			plugin = new YandexPlugin(params.channelId, !params.isGuest);			
		}
		return plugin.getMessage(id, struct);
	},

	'replyEmail': function(params, message) {
		plugin.replyEmail(message);
		// var login = params.login,
		// 	nodemailer = new Npm.require('nodemailer'),
		// 	xoauth2 = new Npm.require('xoauth2'),
		// 	transporter = nodemailer.createTransport({
		// 		service: 'yandex',
		// 		auth: {
		// 			xoauth2: xoauth2.createXOAuth2Generator({
		// 				user: login,
		// 				clientId: Meteor.settings.public.yandex_client_id,
		// 				clientSecret: Meteor.settings.private.yandex_client_secret,
		// 				// refreshToken: '{refresh-token}',
		// 				accessToken: params.token
		// 			})
		// 		}
		// 	}),
		// 	mailOptions = {
		// 		from: login,
		// 		to: message.receiver,
		// 		subject: message.subject,
		// 		text: message.body,
		// 		html: message.bodyHtml,
		// 		bcc: login
		// 	};

		// transporter.sendMail(mailOptions, function(error, info) {
		// 	if (error) {
		// 		return console.log(error);
		// 	}
		// 	appendMessageToSentFolder(params);
		// });
	},

	'addToken': function(serviceData) {
		var currentUserId = Meteor.userId(),
			userTokens = Meteor.user().serviceTokens;

		if (serviceData.serviceName === 'yandex') {
			var url = 'https://login.yandex.ru/info?oauth_token=' + serviceData.token;
			options = {
				headers: {
					'User-Agent': 'node.js'
				}
			};

			Meteor.http.get(url, options, function(err, results) {
				serviceData.login = results.data.login;
				if (userTokens) {
					var tokenIndex = -1;
					_.each(userTokens, function(data, index) {
						if ((data.serviceName === serviceData.serviceName) && (data.login === serviceData.login)) {
							tokenIndex = index;
						}
					});
					if (tokenIndex > -1) {
						userTokens[tokenIndex] = serviceData;
					} else {
						userTokens.push(serviceData);
					}
				} else {
					userTokens = [serviceData];
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
					} else {
						console.log(results);
					}
				});
			});
			return;
		}

		if (userTokens) {
			var tokenIndex = -1;
			_.each(userTokens, function(data, index) {
				if (data.serviceName === serviceData.serviceName) {
					tokenIndex = index;
				}
			});
			if (tokenIndex > -1) {
				userTokens[tokenIndex] = serviceData;
			} else {
				userTokens.push(serviceData);
			}
		} else {
			userTokens = [serviceData];
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
			} else {
				console.log(results);
			}
		});
	}
});