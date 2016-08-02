Meteor.methods({
	'getYandexMessages': function(params) {
		return initImap(params)
			.then(
				imap => getImapMessages(params.page, imap),
				error => console.log(error)
			)
			.then(
				response => response,
				error => console.log(error)
			);
	},

	'getOneMessage': function(params) {
		return initImap(params)
			.then(
				imap => getImapMessage(params, imap),
				error => console.log(error)
			)
			.then(
				response => response,
				error => console.log(error)
			);
	},

	'moveMessageToTrash': function(params) {
		console.log(params);
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
				var f2 = imap.getBoxes(function(err, result) {
					resolve(result);
				});
			});
			imap.connect();
		});

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

function getImapMessages(page, imap) {
	var Imap = Npm.require('imap'),
			currentPage = page;
			messages = [];

	return new Promise(function(resolve, error){
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
				reject(err);
			});
			f.once('end', function() {
				imap.end();
				mailBox = box;
				resolve({
					items: messages,
					box: box
				})
			});
		});			
	})
};

function getImapMessage(params, imap) {
	var MailParser = require('mailparser').MailParser,
		parser = new MailParser(),
		item = {};

	return new Promise(function(resolve, reject) {
		imap.openBox('INBOX', false, function(err, box) {
			imap.search(['ALL', ['UID', params.uid]], function(err, results) {
				if (err) throw err;
				var f = imap.fetch(results, {
					bodies: [''],
					markSeen: params.userIsHost
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

						resolve(item);
					});
				});
				f.once('error', function(err) {
					reject(error);
				});
			});
		});
	});
};

function moveMessageToBox(uid, imap, box) {
	return new Promise(function(resolve, reject){
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




