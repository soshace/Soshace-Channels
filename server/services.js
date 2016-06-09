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

	'getYandexInfo': function(token) {
		var url = 'https://login.yandex.ru/info?oauth_token=' + token;

		options = {
			headers: {
				'User-Agent': 'node.js'
			}
		};
		console.log(url);
		return Meteor.http.get(url, options, function(error, result) {
			var Imap = Npm.require('imap');
			var xoauth2 = Npm.require('xoauth2');

			xoauth2gen = xoauth2.createXOAuth2Generator({
				user: result.data.login,
				clientId: Meteor.settings.public['yandex_client_id'],
				clientSecret: Meteor.settings.private['yandex_client_secret'],
				accessToken: token
			});

			xoauth2gen.getToken(function(err, token) {
				if (err) {
					return console.log(123);
				}
				// console.log("AUTH XOAUTH2 " + token);
			});

			// user=<логин>\@yandex.ru\001auth=Bearer <OAuth-токен>\001\001
			var s = 'user=zhukov_vi\@soshace.com\001auth=Bearer '+token+'\001\001';
			var t = new Buffer(s).toString('base64');
			console.log(s);
			var connParams = {
				id: 13,
				xoauth2: 'A01AUTHENTICATEXOAUTH2'+t,
				host: 'imap.yandex.com',
				port: 993,
				tls: 1,
				debug: console.log
			};

			connParams.tlsOptions = {
				rejectUnauthorized: false
			};

			imap = new Imap(connParams);
			console.log(123);
			imap.openBox('INBOX', true, function(result, error){
				console.log(error);
				console.log(result);

			});


		});
	}
});