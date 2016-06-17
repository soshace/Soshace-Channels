(function() {
	var Imap = Npm.require('imap'),
		MailParser = require('mailparser').MailParser,
		Future = Npm.require('fibers/future'),

		imap,
		smtp,
		login,
		token,
		messages,
		userIsHost = false;

	this.YandexPlugin = function(channelId) {
		var channel = Channels.findOne(channelId),
			hostId = channel.createdBy,
			host = Meteor.users.findOne(hostId),
			accessParams = _.findWhere(host.serviceTokens, {
				serviceName: 'yandex'
			});

		userIsHost = Meteor.userId() === channel.createdBy;
		token = accessParams.token;
		login = accessParams.login;
		initImap();
	};

	YandexPlugin.prototype.getInboxMessages = function(page) {
		var Future = Npm.require('fibers/future'),
			fut = new Future();

		messages = [];
		imap.openBox('INBOX', true, function(err, box) {
			var total = box.messages.total,
				start = total - 9 * page,
				end = total - 9 * (page - 1),
				f = imap.seq.fetch(start + ':' + end, {
					bodies: ['HEADER'],
					struct: true
				});

			f.on('message', function(msg, seqno) {
				var buffer = '';
				var item = {};
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
								item.from = i.from[0];
								item.subject = i.subject[0];
								item.date = i.date[0];
								break;
							default:
								item.body = buffer;
								break;
						}
					});
				});
				msg.on('end', function() {
					if (item.attr) {}
					messages.push(item);
				});
			});
			f.once('error', function(err) {
				console.log('Fetch error: ' + err);
			});
			f.once('end', function() {
				// imap.end();
				fut.return({
					items: messages,
					box: box
				});
			});
		});
		return fut.wait();
	};

	YandexPlugin.prototype.getMessage = function(uid) {
		var fut = new Future(),
			item,
			parser = new MailParser(),
			bodies = [''];

		_.each(messages, function(i, index) {
			if (i.uid === Number(uid)) {
				item = i;
				messages[index].attr.flags.push('\\Seen');
			}
		});

		if (!item) {
			bodies.push('HEADER');
			item = {};
		}

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
						item.body = result.html;
						fut.return(item);
					});
				});
				f.once('error', function(err) {
					console.log('Fetch error: ' + err);
				});
				f.once('end', function() {});
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
					// refreshToken: '{refresh-token}',
					accessToken: token
				})
			}
		});
	};

	function appendMessageToSentFolder() {
		imap.once('ready', function() {
			// imap.getBoxes(function(err, boxes) {});
			imap.openBox('INBOX', false, function(err, box) {
				imap.search(['ALL', ['FROM', login]], function(err, results) {
					if (err) throw err;
					var f = imap.move(results, 'Отправленные', function(error) {
						console.log(error);
					});
					imap.end();
				});
			});
		});
	};
})();