(function() {
	var Imap = Npm.require('imap'),
		imap,
		smtp,
		login,
		token;

	this.YandexPlugin = function(channelId) {
		var channel = Channels.findOne(channelId),
			hostId = channel.createdBy,
			host = Meteor.users.findOne(hostId),
			accessParams = _.findWhere(host.serviceTokens, {
				serviceName: 'yandex'
			});

		token = accessParams.token;
		login = accessParams.login;
		initImap();
	};

	YandexPlugin.prototype.getInboxMessages = function(page) {
		var Future = Npm.require('fibers/future'),
			fut = new Future(),
			items = [],
			uids = [];

		if (imap.state === 'authenticated') {
			imap.openBox('INBOX', true, function(err, box) {
				var total = box.messages.total,
					start = total - 9 * page,
					end = total - 9 * (page - 1),
					f = imap.seq.fetch(start + ':' + end, {
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
				f.on('end', function() {
					// imap.end();
					var emails = [];
					_.each(items, function(item, index) {
						emails.push({
							from: item.from ? item.from[0] : '',
							date: item.date ? item.date[0] : '',
							subject: item.subject ? item.subject[0] : 'No subject',
							attr: uids[index]
						});
					});

					fut.return({
						items: emails,
						box: box
					});
				});
			});
		}
		return fut.wait();
	};

	YandexPlugin.prototype.getMessage = function(id, struct) {
		var Future = Npm.require('fibers/future'),
			fut = new Future(),
			item = {};

		imap.openBox('INBOX', false, function(err, box) {
			imap.search(['ALL', ['UID', id]], function(err, results) {
				if (err) throw err;
				var f = imap.fetch(results, {
					bodies: ['HEADER', struct > 1 ? 2 : 1],
					struct: true,
					markSeen: false
				});
				f.on('message', function(msg, seqno) {
					msg.on('attributes', function(attrs) {
						item.attr = attrs;
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
				});
				f.once('error', function(err) {
					console.log('Fetch error: ' + err);
				});
				f.once('end', function() {
					var encoding;

					if (item.attr.struct.length === 1) {
						encoding = item.attr.struct[0].encoding;
					}
					if (item.attr.struct.length === 2) {
						encoding = item.attr.struct[1][0].encoding;
					}
					if (item.attr.struct.length === 3) {
						encoding = item.attr.struct[2][0].encoding;
					}

					if (encoding === 'base64') {
						var b = new Buffer(item.body, 'base64');
						item.body = b.toString();
					}
					if (encoding === 'quoted-printable') {
						var mimeLib = Npm.require('mimelib');
						item.body = mimeLib.decodeQuotedPrintable(item.body);
					}
					fut.return(item);
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
			appendMessageToSentFolder(params);
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

	function appendMessageToSentFolder(params) {
		imap.once('ready', function() {
			imap.getBoxes(function(err, boxes) {});
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