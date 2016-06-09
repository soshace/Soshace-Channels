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

	'getYandexLogin': function(token) {
		var url = 'https://login.yandex.ru/info?oauth_token=' + token;
		options = {
			headers: {
				'User-Agent': 'node.js'
			}
		};

		var Future = Npm.require('fibers/future');

		var fut = new Future();
		Meteor.http.get(url, options, function(err, results) {
			var login = results.data.login;

			var Imap = Npm.require('imap');
			var s = 'user=' + login + '\001auth=Bearer ' + token + '\001\001';
			var t = new Buffer(s).toString('base64');
			var connParams = {
				id: 13,
				xoauth2: t,
				host: 'imap.yandex.com',
				port: 993,
				tls: 1,
				// debug: console.log
			};

			connParams.tlsOptions = {
				rejectUnauthorized: false
			};

			var items = [];
			imap = new Imap(connParams);
			imap.once('ready', function() {
				imap.openBox('INBOX', true, function(err, box) {
					var f = imap.seq.fetch((box.messages.total - 10) + ':' + box.messages.total, {
						bodies: ['HEADER'],
						struct: true
					});
					f.on('message', function(msg, seqno) {
						var prefix = '(#' + seqno + ') ';
						msg.on('body', function(stream, info) {
							var buffer = '',
								count = 0;
							stream.on('data', function(chunk) {
								count += chunk.length;
								buffer += chunk.toString('utf8');
							});
							stream.once('end', function() {
								if (info.which !== 'TEXT') {
									var item = Imap.parseHeader(buffer);
									items.push(item);
								} else {
									bodies.push(buffer);
								}
							});
						});
					});
					f.once('error', function(err) {
						console.log('Fetch error: ' + err);
					});
					f.once('end', function() {
						imap.end();
						var emails = [];
						_.map(items, function(item, index) {
							emails.push({
								from: item.from[0],
								// body: bodies[index],
								date: item.date[0],
								subject: item.subject[0],
								hash: item['message-id'][0]
							});
						});

						fut.return(emails);
					});
				});
			});
			imap.connect();
		});
		return fut.wait();
	}
});