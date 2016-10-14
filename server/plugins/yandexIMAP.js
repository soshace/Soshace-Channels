Meteor.methods({
	'getYandexMessages': function(params) {
		return initImap(params)
			.then(
				imap => getUniqueDialogs(imap, params),
				error => console.log('Error with getting messages: ' + error)
			)
	},

	'getYandexDialog': function(params) {
		return initImap(params)
			.then(
				imap => getDialogMessageIds(imap, params.boxName, params.from)
				.then(item => item),
			)
			.then(
				result => getMessagesByIds(result.imap, result.ids, params.boxName),
				error => console.log('Error with getting dialog: ' + error)
			)
	},

	'getYandexDialogs': function(params, dialogs) {
		// const fromArr = [];
		// dialogs.forEach((dialog) => {
		// 	fromArr.push(dialog.from);
		// });
		//
		// return initImap(params)
		// 	.then(
		// 		imap => getDialogMessageIds(imap, params.boxName, fromArr)
		// 		.then(item => item),
		// 	)
		// 	.then(
		// 		result => getMessagesByIds(result.imap, result.ids, params.boxName),
		// 		error => console.log('Error with getting dialog: ' + error)
		// 	)
	},

	'loadMoreMessages': function(params) {
		return initImap(params)
			.then(
				imap => getMessagesByIds(imap, params.ids, params.boxName),
				error => console.log(error)
			).then(
				result => result
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
						imap.openBox(params.srcBox, false, function(err, bx) {
							var nextUid = bx.uidnext;

							function getLastMessage(flag) {
								if (flag) {
									return;
								}
								imap.openBox(params.srcBox, false, function(err, bx) {
									imap.search(['UNSEEN', ['UID', nextUid]], function(err, result) {
										if (result.length > 0) {
											imap.addFlags(result, 'Seen', function() {
												imap.move(result, params.destBox, function(err) {
													if (err) {
														console.log(err);
													}
													imap.openBox(params.destBox, false, function(err, bx) {
														var lastUid = bx.messages.total;
														var req1 = imap.seq.fetch(lastUid + ':*', {
															bodies: '',
															struct: true
														});

														return getMessageFromBox(req1)
															.then(
																item => {
																	item.isInbox = false;
																	item.boxName = params.destBox;
																	item.compressed = true;
																	resolve(item);
																	imap.end();
																},
																error => console.log(error)
															);
													});
												});
											});
										}
										return (getLastMessage(result.length > 0));
									});
								});
							}

							getLastMessage(false);
						});
					});
				},
				error => console.log(error)
			)
	},

	'loadMessagesFromBoxToDataBase': function(params) {
		return initImap(params)
			.then(
				imap => getMessagesFromBoxes(imap, params),
				error => console.log('Error with getting messages: ' + error)
			)
			.then(
				result => console.log(result)
			)
	},

	'checkMails': function(params) {
	  var mails = Mails.findOne({channelId: params.channelId});

	  if (!mails) {
	    addChannelMail(params.channelId);
	  	
	  	console.log('mails added');

	    initImap(params)
	    .then(
	      imap => getMessagesFromBox(imap, 'INBOX', params.channelId)
	    )
	    .then(
	      imap => getMessagesFromBox(imap, 'Отправленные', params.channelId)
	    )
	  }


	  return 123;
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

function getUniqueDialogs(imap, params) {
	var messages = [];

	return new Promise(function(resolve, error) {
		imap.openBox(params.boxName, false, function(err, box) {
			var f,
				dialogsCount = 0,
				total = box.messages.total,
				index = params.lastIndex,
				dialogsWith = params.dialogsWith || [];

			function getMessages(messages) {
				if (messages.length > 10 || (total - index === 0)) {
					resolve({
						items: messages.reverse(),
						box: box,
						lastIndex: index
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

							for (var mes of dialogsWith) {
								if (mes === item.from) {
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

function getDialogMessageIds(imap, boxName, key) {
	console.log(boxName, key);
	return new Promise(function(resolve, reject) {

		imap.openBox(boxName, false, function(err, box) {
			imap.seq.search(['ALL', ['FROM', key]], function(err, receivedIds) {
				var received = [];
				receivedIds.forEach(function(item) {
					received.push({
						index: item,
						box: boxName
					})
				});

				imap.openBox('Отправленные', false, function(err, box) {
					imap.seq.search(['ALL', ['TO', key]], function(err, sentIds) {

						var sent = [];

						sentIds.forEach(function(item) {

							sent.push({
								index: item,
								box: 'Отправленные'
							});
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

function getMessagesByIds(imap, ids, boxName) {
	var received = ids.received.reverse().slice(0, 10),
		sent = ids.sent.reverse().slice(0, 10);

	return new Promise(function(resolve, reject) {
		var messages = [];

		imap.openBox(boxName, false, function(err, box) {
			function getMessages(index) {
				if (index > (received.length - 1)) {
					imap.openBox('Отправленные', false, function(err, box) {
						function getSentMessages(index) {
							if (index > (sent.length - 1)) {
								messages = _.sortBy(messages, function(item) {
									return -item.date;
								});
								messages = messages.slice(0, 10);

								ids.received = ids.received.filter(function(id) {
									return !_.findWhere(messages, {
										seqno: id.index,
										box: id.boxName
									});
								});

								ids.sent = ids.sent.filter(function(id) {
									return !_.findWhere(messages, {
										seqno: id.index,
										box: id.boxName
									});
								});

								resolve({
									dialogMessages: messages,
									allMessageIds: ids,
								});
								imap.end();
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
										item.boxName = 'Отправленные';
										item.seqno = seqno;
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
							item.boxName = boxName;
							item.seqno = seqno;
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

			msg.on('body', function(stream, info) {
				stream.on('data', function(chunk) {
					parser.write(chunk.toString('utf8'));
				});

			});

			msg.on('end', function() {
				parser.end();
			});

			parser.on('end', function(result) {
				item.inReplyTo = result.inReplyTo ? result.inReplyTo[0] : '';
				item.messageId = result.messageId;

				item.from = result.from[0].address.toLowerCase();

				item.fromName = result.from[0].name || result.from[0].address;

				item.to = result.to ? result.to[0].address : '';
				item.to = item.to && item.to.toLowerCase();
				item.toName = result.to ? result.to[0].name : '';

				item.subject = result.subject || 'No subject';

				item.date = result.date || 0;

				if (item.date) {
					item.date = moment(item.date, 'ddd MMM DD YYYY hh:mm:ss Z').valueOf();				
				} 

				item.plainText = result.text;

				item.fullHtml = result.html;

				// console.log(result)

				if (result.html) {
					if (item.inReplyTo) {
						item.htmlBody = removeBlockquote(result.html);
						// item.htmlBody = removeQuoteDeclaration(item.htmlBody);
					} else {
						item.htmlBody = result.html;
					}
				}

				item.plainText = result.text;
				item.compressedText = result.text;
				if (item.plainText && item.inReplyTo) {
					item.compressedText = removeQuotesFromText(item.plainText);
				}

				item.compressed = true;

				resolve(item);
			});
		});
	});
};

function removeQuotesFromText(text) {
	var lines = text.split(/\r\n|\r|\n/g);

	var startIndex;
	lines.some(function(item, index) {
		if (item[0] === '>') {
			startIndex = index;
			return true;
		}
		return false;
	});

	if (startIndex) {
		lines.length = startIndex - 1;
	}

	return lines.join('\n');
};

function removeBlockquote(html) {
	var citeOpenTag = '<blockquote';
	var citeCloseTag = '</blockquote>';

	var firstIndex = html.indexOf(citeOpenTag);

	if (firstIndex > -1) {
		var lastIndex = html.lastIndexOf(citeCloseTag);

		var html1 = html.substr(0, firstIndex);
		var html2 = html.substr(lastIndex + citeCloseTag.length, html.length);
		html1 = removeQuoteDeclaration(html1);


		// var clearHtml = html.replace(html.substring(firstIndex, lastIndex + citeCloseTag.length), '');

		return (html1 + html2);
		// return clearHtml
	}


	return html;
};

function removeQuoteDeclaration(html) {
	var openDiv = /\<div/g,
			closeDiv = /\<\/div\>/g,
			clearHtml = html,
			gmailQuote = '<div class="gmail_quote">',
			gmailQuoteIndex = clearHtml.indexOf(gmailQuote),
			replyRemoved = false;

	// if (gmailQuoteIndex > -1) {
	// 	var quotePart = clearHtml.substr(gmailQuoteIndex, clearHtml.length);

	// 	closeDiv.exec(quotePart);
	// 	quotePart = quotePart.substr(closeDiv.lastIndex, quotePart.length);

	// 	clearHtml = clearHtml.substr(0, gmailQuoteIndex);

	// 	clearHtml += quotePart;

	// 	return clearHtml;
	// }

	openDiv = '<div';
	closeDiv = '</div>';

	while (!replyRemoved) {
		var openDivIndex = clearHtml.lastIndexOf(openDiv);
		var closeDivIndex = clearHtml.lastIndexOf(closeDiv);

		if (clearHtml.substring(openDivIndex, closeDivIndex).trim()) {
			replyRemoved = true;
		}

		clearHtml = clearHtml.replace(clearHtml.substring(openDivIndex, closeDivIndex + closeDiv.length), '');
	}

	return clearHtml;
};

// function getMessagesFromBox(imap, boxName) {
// 	return new Promise(function(resolve, reject) {
// 		var messages = [];

// 		imap.openBox(boxName, false, function(err, box) {
// 			var totalCount = box.messages.total

// 			console.log(totalCount)

// 			var f = imap.seq.fetch((totalCount - 10) + ':' + totalCount, {
// 								bodies: '',
// 								struct: true
// 							});

// 			console.log(f)

// 			getMessageFromBox(f)
// 			.then(
// 				item => {
// 					item.boxName = boxName;
// 					item.seqno = seqno;
// 					messages.push(item);
// 					console.log(messages)
// 					resolve(messages)
// 				},
// 				error => console.log(error)
// 			);
// 		});
// 	});
// };

function getMessagesFromBox(imap, boxName, channelId) {
	var messages = [];

	return new Promise(function(resolve, error) {
		imap.openBox(boxName, false, function(err, box) {
			var f,
				total = box.messages.total;

			function getMessages(messages) {
				if (total === 0) {
					// resolve({
					// 	items: messages.reverse(),
					// 	box: box
					// });
					resolve(imap);
					return;
				}

				f = imap.seq.fetch(total + ':' + total, {
					bodies: '',
					struct: true
				});

				return getMessageFromBox(f)
					.then(
						item => {
							messages.push(item);
							total = total - 1;
							saveMessageToDB(channelId, boxName, item);
							return getMessages(messages);
						},
						error => console.log(error)
					);
			};

			getMessages(messages);
		});
	});
}

function saveMessageToDB(channelId, boxName, message) {
  var box = Mails.findOne({channelId: channelId});

  var folders = box.folders;
  var folderCreated = false;
  folders.forEach(item => {
  	if (item.name === boxName) {
  		folderCreated = true;
  	}
  })

  if (!folderCreated) {
  	var newFolder = {
  		name: boxName,
  		messages: []
  	}

  	Mails.update({channelId: channelId}, {$push: {'folders': newFolder}})
  }

  Mails.update({channelId: channelId, 'folders.name': boxName}, {
    $push: {'folders.$.messages': message}
  })
}

function addChannelMail(channelId) {
  var newMailBox = {
    channelId: channelId,
    folders: []
  }

  return Mails.insert(newMailBox);
}


Meteor.startup(function () {
	testParams = {
		channelId: 'fy7BJG5LRZ5j2QWjx',
		createdBy: 'sAfjdSzTdrJLfutFs',
		userIsHost: true,
		login: 'Zhukov-Vit',
		token: 'AQAAAAAAh11IAAM6LPo5rt8Tj03cnKQnUgRl5iY'
	};

	// initImap(testParams)
	// 	.then(
	// 		imap => getMessagesFromBox(imap, 'INBOX'),
	// 		error => console.log('Error with getting messages: ' + error)
	// 	)
	// 	.then(
	// 		result => console.log(result.items.length)
	// 	)
})
