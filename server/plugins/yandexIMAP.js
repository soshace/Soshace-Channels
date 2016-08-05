Meteor.methods({
	'getYandexMessages': function(params) {
		return initImap(params)
			.then(
				// imap => getImapMessages(params.page, imap, params.boxName),
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
			// .then(
			// 	result => result
			// );

		// return initImap(params)
		// 	.then(
		// 		imap => getFilteredMessages(imap, params.boxName, 'FROM', params.from),
		// 		error => console.log(error)
		// 	)
		// 	.then(
		// 		response => response,
		// 		error => console.log(error)
		// 	);
	},

	// 'getOneMessage': function(params) {
	// 	return initImap(params)
	// 		.then(
	// 			imap => getImapMessage(params, imap),
	// 			error => console.log(error)
	// 		)
	// 		.then(
	// 			response => response,
	// 			error => console.log(error)
	// 		);
	// },

	'moveMessageToTrash': function(params) {
		return initImap(params)
			.then(
				imap => moveMessageToBox(params.uid, imap, params.box),
				error => console.log(error)
			)
			.then(
				response => response,
				error => console.log(error)
			);
	},

	'moveMessageToSpam': function(params) {
		return initImap(params)
			.then(
				imap => moveMessageToBox(params.uid, imap, params.box),
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
							var res = {};
							for (var key in result) {
								if (result.hasOwnProperty(key)) {
									res[key] = {};
									res[key]['special_use_attrib'] = result[key]['special_use_attrib'];
								}
							}
							resolve(res);
							imap.end();
						})
					});
				},
				error => console.log(error)
			)
	}
});

function initImap(params) {
	var s = 'user=' + params.login + '@yandex.ru\001auth=Bearer ' + params.token + '\001\001',
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
		var Imap = Npm.require('imap');

		var imap = new Imap(connParams);

		imap.on('error', function(error) {
			reject(error);
		});

		imap.on('ready', function(error) {
			resolve(this);
		});

		imap.connect();
	});
};

// function getImapMessages(page, imap, boxName) {
// 	var Imap = Npm.require('imap'),
// 		messages = [];

// 	return new Promise(function(resolve, error) {
// 		imap.openBox(boxName, false, function(err, box) {
// 			var total = box.messages.total,
// 				end = total - 10 * (page - 1) > 0 ? total - 10 * (page - 1) : total - 10 * (page - 1),
// 				start = (total - 10 * page) + 1 > 0 ? (total - 10 * page + 1) : 1,
// 				f = imap.seq.fetch(start + ':' + end, {
// 					bodies: ['HEADER', 'TEXT'],
// 					struct: true
// 				});

// 			f.on('message', function(msg, seqno) {
// 				var buffer = '',
// 					item = {};
// 				msg.on('attributes', function(attrs) {
// 					item.attr = attrs;
// 					item.uid = attrs.uid;
// 				});
// 				msg.on('body', function(stream, info) {
// 					var buffer = '';
// 					stream.on('data', function(chunk) {
// 						buffer += chunk;
// 					});
// 					stream.once('end', function() {
// 						switch (info.which) {
// 							case 'HEADER':
// 								buffer = buffer.toString('utf8');
// 								var i = Imap.parseHeader(buffer);
// 								item.from = i.from ? i.from[0] : '';

// 								if (item.from.indexOf('<') > -1 && item.from.indexOf('>') > -1) {
// 									item.from = item.from.match(/<(.*?)>/i)[1];
// 								}

// 								item.subject = i.subject ? i.subject[0] : 'No subject';
// 								item.date = i.date ? i.date[0] : '';
// 								item.date = Date.parse(item.date) / 1000;
// 								item.to = i.to ? i.to[0] : '';

// 								if (item.to.indexOf('<') > -1 && item.to.indexOf('>') > -1) {
// 									item.to = item.to.match(/<(.*?)>/i)[1];
// 								}

// 								break;
// 							default:
// 								item.body = buffer;
// 								break;
// 						}
// 					});
// 				});
// 				msg.on('end', function() {
// 					messages.push(item);
// 				});
// 			});
// 			f.once('error', function(err) {
// 				reject(err);
// 			});
// 			f.once('end', function() {
// 				imap.end();
// 				mailBox = box;
// 				resolve({
// 					items: messages,
// 					box: box
// 				})
// 			});
// 		});
// 	})
// };

// function getImapMessage(params, imap) {
// 	var MailParser = require('mailparser').MailParser,
// 		parser = new MailParser(),
// 		item = {};

// 	return new Promise(function(resolve, reject) {
// 		imap.openBox('INBOX', false, function(err, box) {
// 			imap.search(['ALL', ['UID', params.uid]], function(err, results) {
// 				if (err) throw err;
// 				var f = imap.fetch(results, {
// 					bodies: [''],
// 					markSeen: params.userIsHost
// 				});
// 				f.on('message', function(msg, seqno) {
// 					msg.on('attributes', function(attrs) {
// 						item.attr = attrs;
// 						item.uid = attrs.uid;
// 					});
// 					msg.on('body', function(stream) {
// 						stream.on('data', function(chunk) {
// 							parser.write(chunk.toString('utf8'));
// 						});
// 					});
// 					msg.once('end', function() {
// 						parser.end();
// 					});
// 					parser.on('headers', function(result) {
// 						item.from = result ? result.from : '';
// 						item.subject = result ? result.subject : '';
// 						item.date = result ? result.date : '';
// 					});
// 					parser.on('end', function(result) {
// 						item.htmlBody = result.html;
// 						item.plainText || result.text;

// 						resolve(item);
// 					});
// 				});
// 				f.once('error', function(err) {
// 					reject(error);
// 				});
// 			});
// 		});
// 	});
// };

function moveMessageToBox(uid, imap, box) {
	return new Promise(function(resolve, reject) {
		imap.openBox('INBOX', false, function(err, bx) {
			imap.search(['ALL', ['UID', uid]], function(err, results) {
				if (err) {
					reject(err);
				}
				if (results.length > 0) {
					var f1 = imap.move(results, box, function(err) {
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
				} else {
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
				}
			};

			getMessages(messages);
		});
	});
};

function getMessageFromBox(request) {
	var Imap = Npm.require('imap');
	var MailParser = require('mailparser').MailParser,
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
				// item.date = Date.parse(item.date) / 1000;
				item.date = moment(item.date, 'ddd MMM DD YYYY hh:mm:ss Z').valueOf();

				item.htmlBody = result.html;
				item.plainText || result.text;

				resolve(item);
			});
		});
	});
};

// function getFilteredMessages(imap, boxName, flag, key) {
// 	var Imap = Npm.require('imap');
// 	var MailParser = require('mailparser').MailParser;
// 	var parser = new MailParser();

// 	return new Promise(function(resolve, reject) {
// 		imap.openBox(boxName, false, function(err, box) {
// 			var filter;
// 			switch (flag) {
// 				case 'FROM':
// 					filter = ['FROM', key];
// 					break;
// 				default:
// 					break;
// 			}

// 			imap.seq.search(['ALL', filter], function(err, results) {

// 				var messages = [];
// 				var lastMessages = results.length > 10 ? results.reverse().slice(0, 10) : results.reverse();

// 				function getMessages(index) {
// 					if (index > 9 || index > (lastMessages.length - 1)) {
// 						resolve({
// 							dialogMessages: messages,
// 							box: box,
// 							partnerAddress: key
// 						})
// 						return;
// 					} else {
// 						var seqno = lastMessages[index];
// 						var req = imap.seq.fetch(seqno + ':' + seqno, {
// 							bodies: ['HEADER', ''],
// 							struct: true
// 						});

// 						return getMessageFromBox(req)
// 							.then(
// 								item => {
// 									messages.push(item);

// 									index++;

// 									return getMessages(index);
// 								},
// 								error => console.log(error)
// 							);
// 					}
// 				};

// 				getMessages(0);
// 			});
// 		});
// 	});
// };

function getDialogMessageIds(imap, boxName, key) {
	return new Promise(function(resolve, reject) {
		console.log(boxName, key);
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
							// ids: received.concat(sent),
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
	var received = ids.received.reverse().slice(0, 10);
	var sent = ids.sent.reverse().slice(0, 10);


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
							} else {
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
							}
						};

						getSentMessages(0);
					});
					return;
				} else {
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
				}
			};
			getMessages(0);

		});
	});
};