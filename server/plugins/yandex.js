(function() {
	var Imap = Npm.require('imap'),
		MailParser = require('mailparser').MailParser,
		Future = Npm.require('fibers/future'),

		imap,
		smtp,
		login,
		token,
		messages,
		mailBox,
		userIsHost = false,
		currentPage;

	this.YandexPlugin = function(channelId) {
		var channel = Channels.findOne(channelId),
			hostId = channel.createdBy,
			host = Meteor.users.findOne(hostId),
			accessParams = _.findWhere(host.serviceTokens, {
				serviceName: 'yandex',
				login: channel.login
			});

		this.channelId = channelId;
		currentPage = 0;

		userIsHost = Meteor.userId() === channel.createdBy;
		token = accessParams.token;
		login = accessParams.login + '@yandex.ru';
		initImap();
	};

	YandexPlugin.prototype.getInboxMessages = function(page) {
		if (!imap) {
			return;
		}
		if (currentPage === page) {
			return {
				items: messages,
				box: mailBox
			};
		}
		currentPage = page;

		var fut = new Future();

		messages = [];
		if (imap.state !== 'authenticated') {
			imap.connect();
		};

		imap.openBox('INBOX', false, function(err, box) {
			var total = box.messages.total,
				end = total - 10 * (page - 1) > 0 ? total - 10 * (page - 1) : total - 10 * (page - 1),
				start = (total - 10 * page) + 1 > 0 ? (total - 10 * page + 1) : 1,
				f = imap.seq.fetch(start + ':' + end, {
					bodies: ['HEADER'],
					struct: true
				});

			f.on('message', function(msg, seqno) {
				var buffer = '',
					item = {};
				msg.on('attributes', function(attrs) {
					item.attr = attrs;
					item.uid = attrs.uid;
				});
				msg.on('body', function(stream, info) {
					var buffer = '';
					stream.on('data', function(chunk) {
						buffer += chunk;
					});
					stream.once('end', function() {
						switch (info.which) {
							case 'HEADER':
								buffer = buffer.toString('utf8');
								var i = Imap.parseHeader(buffer);
								item.from = i.from ? i.from[0] : '';
								item.subject = i.subject ? i.subject[0] : 'No subject';
								item.date = i.date ? i.date[0] : '';
								break;
							default:
								item.body = buffer;
								break;
						}
					});
				});
				msg.on('end', function() {
					messages.push(item);
				});
			});
			f.once('error', function(err) {
				console.log('Fetch error: ' + err);
			});
			f.once('end', function() {
				// imap.end();
				mailBox = box;
				fut.return({
					items: messages,
					box: box
				});
			});
		});
		return fut.wait();
	};

	YandexPlugin.prototype.getMessage = function(uid) {
		if (!imap) {
			return;
		}
		var fut = new Future(),
			item,
			parser = new MailParser(),
			bodies = [''];

		_.each(messages, function(i, index) {
			if (i.uid === Number(uid)) {
				item = i;
				if (messages[index].attr.flags.indexOf('\\Seen') === -1) {
					messages[index].attr.flags.push('\\Seen');
				}
			}
		});

		if (!item) {
			bodies.push('HEADER');
			item = {};
		}

		if (imap.state !== 'authenticated') {
			imap.connect();
		};

		imap.openBox('INBOX', false, function(err, box) {
			imap.search(['ALL', ['UID', uid]], function(err, results) {
				if (err) throw err;
				var f = imap.fetch(results, {
					bodies: bodies,
					markSeen: userIsHost
				});
				f.on('message', function(msg, seqno) {
					msg.on('body', function(stream) {
						stream.on('data', function(chunk) {
							parser.write(chunk.toString('utf8'));
						});
					});
					msg.once('end', function() {
						parser.end();
					});
					parser.on('headers', function(result) {
						item.from = result ? result.from : '';
						item.subject = result ? result.subject : '';
						item.date = result ? result.date : '';
					});
					parser.on('end', function(result) {
						item.body = result.html || result.text;
						// item.text = result.text;
						// imap.end();

						fut.return(item);
					});
				});
				f.once('error', function(err) {
					console.log('Fetch error: ' + err);
				});
			});
		});
		return fut.wait();
	};

	YandexPlugin.prototype.replyEmail = function(message) {
		if (!smtp) {
			initSmtp();
		}
		var mailOptions = {
			from: login,
			to: message.receiver,
			subject: message.subject,
			text: message.body,
			html: message.bodyHtml,
			bcc: login
		};

		smtp.sendMail(mailOptions, function(error, info) {
			if (error) {
				return console.log(error);
			}
			// setTimeout(appendMessageToSentFolder, 5000);
			appendMessageToSentFolder();
		});
	};

	function initImap() {
		var s = 'user=' + login + '@yandex.ru\001auth=Bearer ' + token + '\001\001',
			t = new Buffer(s).toString('base64'),
			connParams = {
				xoauth2: t,
				host: 'imap.yandex.com',
				port: 993,
				tls: 1,
				tlsOptions: {
					rejectUnauthorized: false
				}
			};

		var Future = Npm.require('fibers/future'),
			fut = new Future();
		imap = new Imap(connParams);
		imap.on('error', function(error) {
			console.log(error);
		});
		imap.on('ready', function(error) {
			fut.return();
		});
		imap.connect();
		return fut.wait();
	};

	function initSmtp() {
		var nodemailer = new Npm.require('nodemailer'),
			xoauth2 = new Npm.require('xoauth2');

		smtp = nodemailer.createTransport({
			service: 'yandex',
			auth: {
				xoauth2: xoauth2.createXOAuth2Generator({
					user: login,
					clientId: Meteor.settings.public.yandex_client_id,
					clientSecret: Meteor.settings.private.yandex_client_secret,
					accessToken: token
				})
			}
		});
	};

	function appendMessageToSentFolder() {
		imap.openBox('INBOX', false, function(err, box) {
			var attemptsCount = 0;
			var repeat = setInterval(function() {
				attemptsCount++;
				imap.search(['UNSEEN', ['HEADER', 'FROM', login]], function(err, results) {
					if (err) {
						console.log(err);
						return;
					}
					if (results.length > 0) {
						attemptsCount = 60;

						var f2 = imap.addFlags(results, 'Seen');
						var f1 = imap.move(results, 'Отправленные', function(err) {
							if (err) {
								console.log(err);
							}
						});
					}
					if (attemptsCount >= 60) {
						clearInterval(repeat);
					}
				});
			}, 1000);
		});
	};
})();