(function() {
	var Imap = Npm.require('imap'),
		MailParser = require('mailparser').MailParser,
		Future = Npm.require('fibers/future'),
		// utf7 = Npm.require('utf7').imap,

		imap,
		smtp,
		login,
		token,
		messages,
		mailBox,
		userIsHost = false,
		currentPage,
		boxes,
		trashBox,
		sentBox,
		spamBox;

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
		return getImapMessages(page);
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
					msg.on('attributes', function(attrs) {
						item.attr = attrs;
						item.uid = attrs.uid;
					});
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
						item.htmlBody = result.html;
						item.plainText || result.text;
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
			appendMessageToSentFolder();
		});
	};

	YandexPlugin.prototype.deleteMessage = function(uid) {
		messages = _.without(messages, _.findWhere(messages, {
			uid: uid
		}));
		imap.openBox('INBOX', false, function(err, box) {
			imap.search(['ALL', ['UID', uid]], function(err, results) {
				if (err) {
					console.log(err);
					return;
				}
				if (results.length > 0) {
					// console.log(utf7.decode(sentBox));
					// var f2 = imap.addFlags(results, 'Deleted');
					var f1 = imap.move(results, trashBox.toUnicode(), function(err) {
						if (err) {
							console.log(err);
						}
					});
				}
				imap.closeBox(true, function(err) {
					if (err) {
						console.log(err);
					}
				});
			});
		});
	};

	YandexPlugin.prototype.toSpam = function(uid) {
		messages = _.without(messages, _.findWhere(messages, {
			uid: uid
		}));
		imap.openBox('INBOX', false, function(err, box) {
			imap.search(['ALL', ['UID', uid]], function(err, results) {
				if (err) {
					console.log(err);
					return;
				}
				if (results.length > 0) {
					var f1 = imap.move(results, spamBox, function(err) {
						if (err) {
							console.log(err);
						}
					});
				}
				imap.closeBox(true, function(err) {
					if (err) {
						console.log(err);
					}
				});
			});
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
			var f2 = imap.getBoxes(function(err, result) {
				// console.log(result);
				boxes = result;
				for (var box in boxes) {
					// console.log(box);
					// console.log(typeof(box));
					if (boxes[box]['special_use_attrib'] === '\\Trash') {
						// console.log(box.toString());
						trashBox = box;
					}
					if (boxes[box]['special_use_attrib'] === '\\Sent') {
						sentBox = box;
					}
					if (boxes[box]['special_use_attrib'] === '\\Spam') {
						spamBox = box;
					}
				}
			})

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

	function getImapMessages(page) {
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

	function appendMessageToSentFolder() {
		var attemptsCount = 0;
		console.log(login);
		var repeat = setInterval(function() {
			attemptsCount++;
			imap.openBox('INBOX', false, function(err, box) {
				// imap.search(['UNSEEN', ['HEADER', 'FROM', login]], function(err, results) {
				imap.search(['UNSEEN', ['UID', box.uidnext - 1]], function(err, results) {
					if (err) {
						console.log(err);
						return;
					}
					if (results.length > 0) {
						attemptsCount = 60;

						var f2 = imap.addFlags(results, 'Seen', function() {
							// console.log(sentBox);
							// console.log(sentBox.toUnicode());
							var f1 = imap.move(results, sentBox, function(err) {
								if (err) {
									console.log(err);
								}
							});
						});
					}
				});
			});
			if (attemptsCount >= 60) {
				clearInterval(repeat);
			}
		}, 2000);
	};
})();

String.prototype.toUnicode = function() {
	var result = "";
	for (var i = 0; i < this.length; i++) {
		result += "\\u" + ("000" + this[i].charCodeAt(0).toString(16)).substr(-4);
	}
	return result;
};