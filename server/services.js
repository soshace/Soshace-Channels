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
		var Future = Npm.require('fibers/future'),
			fut = new Future(),
			Imap = Npm.require('imap'),
			s = 'user=' + params.login + '@yandex.ru\001auth=Bearer ' + params.token + '\001\001',
			t = new Buffer(s).toString('base64'),
			connParams = {
				xoauth2: t,
				host: 'imap.yandex.com',
				port: 993,
				tls: 1
			};

		connParams.tlsOptions = {
			rejectUnauthorized: false
		};

		var items = [],
			uids = [];
		imap = new Imap(connParams);
		imap.once('ready', function() {
			imap.openBox('INBOX', true, function(err, box) {
				var f = imap.seq.fetch((box.messages.total - 10) + ':' + box.messages.total, {
					bodies: ['HEADER'],
					struct: true
				});
				f.on('message', function(msg, seqno) {
					msg.on('body', function(stream, info) {
						var buffer = '';
						stream.on('data', function(chunk) {
							buffer += chunk.toString('utf8');
						});
						stream.once('end', function() {
							var item = Imap.parseHeader(buffer);
							items.push(item);
						});
					});
					msg.on('attributes', function(attrs) {
						uids.push(attrs);
					});
				});
				f.once('error', function(err) {
					console.log('Fetch error: ' + err);
				});
				f.once('end', function() {
					imap.end();
					var emails = [];
					_.each(items, function(item, index) {
						emails.push({
							from: item.from ? item.from[0] : '',
							date: item.date ? item.date[0] : '',
							subject: item.subject ? item.subject[0] : 'No subject',
							attr: uids[index]
						});
					});

					fut.return(emails);
				});
			});
		});
		imap.connect();
		return fut.wait();
	},

	'getOneMessage': function(params, id, struct) {
		// var url = 'https://login.yandex.ru/info?oauth_token=' + token;
		// var options = {
		// 	headers: {
		// 		'User-Agent': 'node.js'
		// 	}
		// };

		var Future = Npm.require('fibers/future');

		var fut = new Future();
		// fut1 = new Future();
		// Meteor.http.get(url, options, function(err, results) {
		var login = params.login;
		var Imap = Npm.require('imap');
		var s = 'user=' + login + '\001auth=Bearer ' + params.token + '\001\001';
		var t = new Buffer(s).toString('base64');
		var connParams = {
			xoauth2: t,
			host: 'imap.yandex.com',
			port: 993,
			tls: 1
		};

		connParams.tlsOptions = {
			rejectUnauthorized: false
		};

		var item = {};
		imap = new Imap(connParams);
		imap.once('ready', function() {
			imap.openBox('INBOX', true, function(err, box) {
				imap.search(['ALL', ['UID', id]], function(err, results) {
					if (err) throw err;
					var f = imap.fetch(results, {
						// bodies: ['HEADER', struct > 1 ? 2 : 1],
						bodies: ['HEADER', '', '1', '2', 'TEXT'],
						struct: true
					});
					f.on('message', function(msg, seqno) {
						msg.on('attributes', function(attrs) {
							item.attr = attrs;
						});
						msg.on('body', function(stream, info) {
							var buffer = '';
							stream.on('data', function(chunk) {
								buffer += chunk.toString('utf8');
							});
							stream.once('end', function() {
								console.log(info.which);
								switch (info.which) {
									case 'HEADER':
										var i = Imap.parseHeader(buffer);
										item.from = i.from[0];
										item.subject = i.subject[0];
										item.date = i.date[0];
										break;
									case '1':
										item.body1 = buffer;
										break;
									case '2':
										item.body2 = buffer;
										break;
									case 'TEXT':
										item.text = buffer;
										break;
									default:
										item.defaultText = buffer;
								}
							});
						});
					});
					f.once('error', function(err) {
						console.log('Fetch error: ' + err);
					});
					f.once('end', function() {
						imap.end();
						fut.return(item);
					});
				});
			});
		});
		imap.connect();
		return fut.wait();
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
				console.log(results.data.login);
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