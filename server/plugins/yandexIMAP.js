Meteor.methods({
	'getYandexMessages': function(params) {
		return initImap(params)
			.then(
				imap => getUniqueDialogs(params.page, imap, params.boxName),
				error => console.log(error)
			)
			.then(
				response => response,
				error => error
			);
	},

	'getYandexDialog': function(params) {
		return initImap(params)
			.then(
				imap => getDialogMessageIds(imap, params.boxName, params.from)
				.then(item => item),
			)
			.then(
				result => getMessagesByIds(result.imap, result.ids),
				error => console.log(error)
			)
	},

	'moveMessageToBox': function(params) {
		return initImap(params)
			.then(
				imap => moveMessageToBox(params.uid, imap, params.srcBox, params.destBox),
				error => console.log(error)
			)
			.then(
				response => response,
				error => console.log(error)
			);
	},

	'getImapBoxes': function(params) {
		return initImap(params)
			.then(
				imap => {
					return new Promise(function(resolve, reject) {
						imap.getBoxes(function(err, result) {
							// TODO: Check for nested folders!!! Circular folders can't be passed to client
							var boxes = {};
							for (var key in result) {
								if (result.hasOwnProperty(key)) {
									boxes[key] = {};
									boxes[key]['special_use_attrib'] = result[key]['special_use_attrib'];
								}
							}
							imap.end();
							resolve(boxes);
						});
					});
				},
				error => console.log(error)
			)
	},

	'moveMessageToSent': function(params) {
		return initImap(params)
			.then(
				imap => {
					return new Promise(function(resolve, reject) {
						imap.openBox('INBOX', false, function(err, bx) {
							var uid = bx.uidnext - 1;
							resolve(moveMessageToBox(uid, imap, params.srcBox, params.destBox));
						});
					});
				},
				error => console.log(error)
			)
	}

});

function initImap(params) {
	var s = 'user=' + params.login + '\001auth=Bearer ' + params.token + '\001\001',
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

	return new Promise(function(resolve, reject) {
		var Imap = Npm.require('imap'),
			imap = new Imap(connParams);

		imap.on('error', function(error) {
			reject(error);
		});

		imap.on('ready', function(error) {
			resolve(this);
		});

		imap.connect();
	});
};

function moveMessageToBox(uid, imap, srcBox, destBox) {
	console.log(srcBox, destBox);
	return new Promise(function(resolve, reject) {
		imap.openBox(srcBox, false, function(err, bx) {
			imap.search(['ALL', ['UID', uid]], function(err, results) {

				if (err) {
					reject(err);
				}

				if (results.length > 0) {
					var f1 = imap.move(results, destBox, function(err) {
						if (err) {
							console.log(err);
						}
						resolve(1);
						imap.end();
					});
				}

				imap.closeBox(true, function(err) {
					if (err) {
						console.log(err);
					}
				});
			});
		});
	});
};

function getUniqueDialogs(params, imap, boxName) {
	var messages = [];

	return new Promise(function(resolve, error) {
		imap.openBox(boxName, false, function(err, box) {
			var f,
				dialogsCount = 0,
				total = box.messages.total,
				index = 0;

			function getMessages(messages) {
				if (messages.length > 10 || (total - index === 0)) {
					resolve({
						items: messages.reverse(),
						box: box
					});
					return;
				}

				var messageIndex = total - index;
				f = imap.seq.fetch(messageIndex + ':' + messageIndex, {
					bodies: ['HEADER'],
					struct: true
				});

				return getMessageFromBox(f)
					.then(
						item => {
							var messageIsFromDialog = false;
							for (var mes of messages) {
								if (mes.from === item.from && mes.to === item.to) {
									messageIsFromDialog = true;
								}
							}

							if (!messageIsFromDialog) {
								messages.push(item);
							}

							index++;

							return getMessages(messages);
						},
						error => console.log(error)
					);
			};

			getMessages(messages);
		});
	});
};

function getMessageFromBox(request) {
	var Imap = Npm.require('imap'),
		MailParser = require('mailparser').MailParser,
		parser = new MailParser();

	return new Promise(function(resolve, reject) {
		request.on('message', function(msg, seqno) {
			var buffer = '',
				item = {};

			msg.on('attributes', function(attrs) {
				item.attr = attrs;
				item.uid = attrs.uid;
			});

			msg.on('body', function(stream) {
				stream.on('data', function(chunk) {
					parser.write(chunk.toString('utf8'));
				});
			});

			msg.on('end', function() {
				parser.end();
			});

			parser.on('end', function(result) {
				item.from = result.from[0].address.toLowerCase();
				item.fromName = result.from[0].name || result.from[0].address;

				item.to = result.to ? result.to[0].address.toLowerCase() : '';
				item.toName = result.to ? result.to[0].name : '';

				item.subject = result.subject || 'No subject';

				item.date = result.date || '';
				item.date = moment(item.date, 'ddd MMM DD YYYY hh:mm:ss Z').valueOf();

				item.htmlBody = result.html;
				item.plainText || result.text;

				resolve(item);
			});
		});
	});
};

function getDialogMessageIds(imap, boxName, key) {
	return new Promise(function(resolve, reject) {

		imap.openBox(boxName, false, function(err, box) {

			imap.seq.search(['ALL', ['FROM', key]], function(err, receivedIds) {

				var received = [];

				receivedIds.forEach(function(item) {
					received.push({
						index: item,
						box: 'INBOX'
					})
				});
				imap.openBox('Отправленные', false, function(err, box) {
					imap.seq.search(['ALL', ['TO', key]], function(err, sentIds) {

						var sent = [];

						sentIds.forEach(function(item) {

							sent.push({
								index: item,
								box: 'Отправленные'
							})
						});

						resolve({
							ids: {
								sent: sent,
								received: received
							},
							imap: imap
						});
					});
				});
			});
		});
	});
};

function getMessagesByIds(imap, ids) {
	var received = ids.received.reverse().slice(0, 10),
		sent = ids.sent.reverse().slice(0, 10);

	return new Promise(function(resolve, reject) {
		var messages = [];

		imap.openBox('INBOX', false, function(err, box) {
			function getMessages(index) {
				if (index > (received.length - 1)) {
					imap.openBox('Отправленные', false, function(err, box) {
						function getSentMessages(index) {
							if (index > (sent.length - 1)) {
								messages = _.sortBy(messages, function(item) {
									return -item.date;
								});
								messages = messages.slice(0, 10);
								resolve({
									dialogMessages: messages,
								})
								return;
							}

							var seqno = sent[index].index;
							var req1 = imap.seq.fetch(seqno + ':' + seqno, {
								bodies: '',
								struct: true
							});

							return getMessageFromBox(req1)
								.then(
									item => {
										item.isInbox = false;
										messages.push(item);

										return getSentMessages(++index);
									},
									error => console.log(error)
								);
						};

						getSentMessages(0);
					});
					return;
				}

				var seqno = received[index].index;
				var req = imap.seq.fetch(seqno + ':' + seqno, {
					bodies: '',
					struct: true
				});

				return getMessageFromBox(req)
					.then(
						item => {
							item.isInbox = true;
							messages.push(item);

							return getMessages(++index);
						},
						error => console.log(error)
					);
			};

			getMessages(0);
		});
	});
};

function moveMessageToFolder(imap, sourceBox, destBox) {
	// var attemptsCount = 0;
	// var repeat = setInterval(function() {
	// 	attemptsCount++;
		imap.openBox(sourceBox, false, function(err, box) {
			imap.search(['UNSEEN', ['UID', box.uidnext - 1]], function(err, results) {
				if (err) {
					console.log(err);
					return;
				}
				if (results.length > 0) {
					attemptsCount = 60;

					var f2 = imap.addFlags(results, 'Seen', function() {
						var f1 = imap.move(results, destBox, function(err) {
							if (err) {
								console.log(err);
							}
							return true;
						});
					});
				}
			});
		});
	// 	if (attemptsCount >= 60) {
	// 		clearInterval(repeat);
	// 	}
	// }, 2000);
};
