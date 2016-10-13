(function() {
	var self,
		dialog,
		dialogsWith,
		showForwardBlock,
		replySubject,
		deps = new Deps.Dependency(),
		updateDialog,
		updateDialogs,
		lastDialogsIndex,
		repliedMessageId;

	this.YandexPlugin = function(channelData) {
		this.settingsTemplateName = 'yandexSettingsTemplate';
		this.previewTemplateName = 'yandexPreviewTemplate';
		this.authTemplate = 'yandexAuthTemplate';
		this.resourceId = 'INBOX';

		self = this;
		this.channelId = channelData._id;
		this.createdBy = channelData.createdBy;

		this.userIsHost = this.createdBy === Meteor.user()._id;

		if (this.userIsHost) {
			var tokens = Meteor.user().serviceTokens;
			this.token = _.findWhere(tokens, {
				serviceName: 'yandex',
				login: channelData.login
			}).token;
		} else {
			console.log('Guest preview is in progress!');
			return;
		}

		this.params = {
			channelId: this.channelId,
			createdBy: this.createdBy,
			userIsHost: this.userIsHost,
			login: channelData.login,
			token: this.token
		};

		Meteor.call('getImapBoxes', self.params, function(error, result) {
			self.boxes = result;

			for (var box in result) {
				var attr = result[box]['special_use_attrib'];

				if (attr === '\\Trash') {
					self.trashBox = box;
				}
				if (attr === '\\Sent') {
					self.sentBox = box;
				}
				if (attr === '\\Spam' || attr === '\\Junk') {
					self.spamBox = box;
				}
			}
		});
	};

	YandexPlugin.prototype.setNextPage = function() {
	};

	YandexPlugin.prototype.setPreviousPage = function() {
	};

	YandexPlugin.prototype.getChannelBlocks = function(getEmailsData) {
		var params = this.params;

		Meteor.call('checkMailboxesDB', params.channelId, function(error, result) {
			if (error) {
				console.log(error);
				return;
			}

			if (result) {

				getEmailsData({
					blocks: [{
						messages: result.dialogs
					}],
					commonParams: result.commonParams
				});

			} else {

				params.boxName = 'INBOX';
				params.lastIndex = 0;

				Meteor.call('getYandexMessages', params, function(error, result) {
					if (error) {
						console.log(error);
						return;
					}

					_.map(result.items, function(item) {
						item.channelId = self.channelId;
						if (item.attr.flags.indexOf('\\Seen') === -1) {
							item.class = ' message__unseen';
						}
					});

					lastDialogsIndex = result.lastIndex;

					dialogsWith = result.items.reverse();

					getEmailsData({
						blocks: [{
							messages: dialogsWith
						}],
						commonParams: result.box
					});

					updateDialogs = getEmailsData;

					Meteor.call('saveMailboxesToDB', params.channelId, dialogsWith, result.box, function(error, result) {
						if (error) {
							console.log(error);
							return;
						}

						// get all mail messages for loaded dialogs and save it to db
						console.log('---- params :');
						console.log(params);
						console.log('***************');
						console.log('---- dialogs :');
						console.log(dialogsWith);
						console.log('***************');
						Meteor.call('getYandexDialogs', params, dialogsWith, function(error, result) {
							if (error) {
								console.log(error);
								return;
							}

							// TODO: need to save result to db Maildialogs
						});

						// dialogsWith.forEach(function(dialog) {
						// 	var paramsForDialog = self.params;
						// 	paramsForDialog.from = dialog.from;
						// 	paramsForDialog.boxName = 'INBOX';
						// 	delete paramsForDialog.lastIndex;
						//
						// 	Meteor.call('getYandexDialog', paramsForDialog, function(error, result) {
						// 		if (error) {
						// 			console.log(error);
						// 			return;
						// 		}
						//
						// 		// same handle part as in getSingleBlock()
						// 		result.dialogMessages.forEach(function(item, index) {
						// 			if (!item.isInbox) {
						// 				result.dialogMessages[index].inboxClass = 'item-sent';
						// 			}
						// 		});
						//
						// 		result.dialogMessages = _.sortBy(result.dialogMessages, function(item) {
						// 			return item.date;
						// 		});
						//
						// 		result.dialogMessages = result.dialogMessages.reverse();
						// 		result.partnerAddress = dialog.from;
						// 		//
						//
						// 		console.log('dialog RESULT:');
						// 		console.log(result);
						// 		console.log('___________________');
						//
						// 		// TODO: need to save dialogResult to db Maildialogs
						// 		Meteor.call('saveDialogMessagesToDB', paramsForDialog.channelId, result, paramsForDialog.from, function(error, result) {
						// 			if (error) {
						// 				console.log(error);
						// 				return;
						// 			}
						// 		});
						//
						// 	});
						// });

					});
				});
			}
		});
	};

	YandexPlugin.prototype.getSingleBlock = function(getDialogCallback, from) {
		var params = self.params;

		Meteor.call('checkMaildialogsDB', params.channelId, from, function(error, result) {
			if (error) {
				console.log(error);
				return;
			}

			if (result) {

				getDialogCallback(result);

			} else {

				params.from = from;
				params.boxName = 'INBOX';

				Meteor.call('getYandexDialog', params, function(error, result) {
					result.dialogMessages.forEach(function(item, index) {
						if (!item.isInbox) {
							result.dialogMessages[index].inboxClass = 'item-sent';
						}
					});

					result.dialogMessages = _.sortBy(result.dialogMessages, function(item) {
						return item.date;
					});

					result.dialogMessages = result.dialogMessages.reverse();

					dialog = result;
					dialog.partnerAddress = from;

					getDialogCallback(result);
					updateDialog = getDialogCallback;
				});

			}
		});
	};

	YandexPlugin.prototype.setDefaultChannelName = function(func) {
		setDefaultChannelName = func;
	};

	YandexPlugin.prototype.getSettings = function(func) {
		var tokens = Meteor.user().serviceTokens,
			logins = [];

		if (tokens) {
			_.each(tokens, function(item) {
				if (item.serviceName === 'yandex') {
					logins.push(item.login);
				}
			});
		}
		if (logins.length > 0) {
			login = logins[0];
		}
		func(logins);
	};

	YandexPlugin.prototype.getLogin = function() {
		return login;
	};

	function replyEmail() {
		var message = {
			bodyHtml: $('.summernote').summernote('code'),
			receiver: dialog.partnerAddress,
			subject: $('.email__reply-subject').val() || 'No subject',
			login: self.params.login,
			inReplyTo: repliedMessageId || ''
		};

		console.log(message);

		sendMessage(message);
	};

	function forwardEmail() {
		var message,
			receiver,
			re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

		receiver = $('.email__forward-address').val();
		if (!re.test(receiver)) {
			return;
		}

		message = {
			bodyHtml: $('.summernote').summernote('code'),
			receiver: receiver,
			subject: $('.email__reply-subject').val() || 'No subject',
			login: self.params.login
		};

		sendMessage(message, true);
	};

	function deleteEmail(uid) {
		var params = self.params,
			selectedMessage = _.findWhere(dialog.dialogMessages, {
				uid: +uid
			});

		params.uid = uid;
		params.destBox = self.trashBox;
		params.srcBox = selectedMessage.boxName;

		Meteor.call('moveMessageToBox', params, function(error, results) {
			if (error) {
				Bert.alert('Error with message deleting', 'error');
				return;
			}
			removeMessage(uid);
			Bert.alert('Message was successfully deleted!', 'success');
		});
	};

	function toSpam(uid) {
		var params = self.params,
			selectedMessage = _.findWhere(dialog.dialogMessages, {
				uid: +uid
			});

		params.uid = uid;
		params.destBox = self.spamBox;
		params.srcBox = selectedMessage.boxName;

		Meteor.call('moveMessageToBox', params, function(error, results) {
			if (error) {
				Bert.alert('Error with moving message to spam', 'error');
				return;
			}
			removeMessage(uid);
			Bert.alert('Message was moved to spam', 'success');
		});
	};

	function showFullEmail(uid) {
		var selectedMessage = _.findWhere(dialog.dialogMessages, {
				uid: +uid
			});

		selectedMessage.compressed = !selectedMessage.compressed;
		updateDialog(dialog);
	};

	function selectMessage(uid) {
		var selectedMessage = _.findWhere(dialog.dialogMessages, {
				uid: +uid
			}),
			separator = '<br/><div class="quote">',
			date = moment.unix(selectedMessage.date / 1000),
			body = '<blockquote>' + selectedMessage.fullHtml || selectedMessage.plainText + '<blockquote>';

		separator += date.format('MMMM Do YYYY, hh:mm,');
		separator += selectedMessage.from + ' wrote:</div>';

		$('.summernote').summernote('code', separator + body);
		$('.summernote').summernote({focus: true});

		replySubject = selectedMessage.subject;

		repliedMessageId = selectedMessage.messageId;

		deps.changed();
	};

	function removeMessage(uid) {
		dialog.dialogMessages = dialog.dialogMessages.filter(function(item) {
			return item.uid !== uid;
		});

		updateDialog(dialog);
	};

	function sendMessage(message, isForwarded = false) {
		if (!message.bodyHtml) {
			return;
		}

		Meteor.call('replyEmail', self.params, message, function(error, results) {
			if (error) {
				Bert.alert(error.reason, 'error');
				return;
			}

			var params = self.params;
			params.destBox = self.sentBox;
			params.srcBox = 'INBOX';
			Meteor.call('moveMessageToSent', params, function(error, result) {
				result.inboxClass = 'item-sent';

				if (!isForwarded) {
					dialog.dialogMessages.unshift(result);
					updateDialog(dialog);
				}
			});

			Bert.alert('Message was successfully sent!', 'success');

			showForwardBlock = false;

			$('.summernote').summernote('code', '');

			replySubject = '';

			deps.changed();
		});
	};

	function getInboxText(text) {
		var lines = text.split(/\r\n|\r|\n/g);

		return lines.filter(function(item) {
			return (item.trim().length > 0) && (item[0] !== '>')
		}).join('\n');
	};

	function parseHtml(html) {
		var openDiv = /\<div/g,
				closeDiv = /\<\/div\>/g,
				clearHtml = html,
				gmailQuote = '<div class="gmail_quote">',
				gmailQuoteIndex = clearHtml.indexOf(gmailQuote);

		if (gmailQuoteIndex > -1) {
			var quotePart = clearHtml.substr(gmailQuoteIndex, clearHtml.length);

			closeDiv.exec(quotePart);
			quotePart = quotePart.substr(closeDiv.lastIndex, quotePart.length);

			clearHtml = clearHtml.substr(0, gmailQuoteIndex);

			clearHtml += quotePart;

			return clearHtml;
		}

		return html;
	}

	Template.yandexDetailsTemplate.events({
		'click .channel-block__send-email': function(event) {
			event.preventDefault();

			if (showForwardBlock) {
				forwardEmail();
			} else {
				replyEmail();
			}
		},

		'click .js-email__clear': function(event) {
			event.preventDefault();

			showForwardBlock = false;

			replySubject = '';

			$('.summernote').summernote('code', '');

			deps.changed();
		},

		'click .js-item__reply': function(event) {
			event.preventDefault();

			showForwardBlock = false;

			selectMessage(event.target.id);
		},

		'click .js-item__forward': function(event) {
			event.preventDefault();

			showForwardBlock = true;

			selectMessage(event.target.id);
		},

		'click .js-item__delete': function(event) {
			event.preventDefault();
			deleteEmail(+event.target.id);
		},

		'click .js-item__spam': function(event) {
			event.preventDefault();
			toSpam(+event.target.id);
		},

		'click .js-item__show-full': function(event) {
			event.preventDefault();
			showFullEmail(+event.target.id);
		},

		'click .js-email__load': function(event) {
			event.preventDefault();

			if (dialog.allMessageIds.sent.length + dialog.allMessageIds.received.length === 0) {
				return;
			}

			var params = self.params;

			params.boxName = 'INBOX';
			params.ids = dialog.allMessageIds;

			Meteor.call('loadMoreMessages', params, function(error, result) {
				result.dialogMessages.forEach(function(item, index) {
					if (!item.isInbox) {
						result.dialogMessages[index].inboxClass = 'item-sent';
					}
				});

				result.dialogMessages = _.sortBy(result.dialogMessages, function(item) {
					return item.date;
				});

				result.dialogMessages = result.dialogMessages.reverse();

				dialog.dialogMessages = dialog.dialogMessages.concat(result.dialogMessages);
				dialog.allMessageIds = result.allMessageIds;

				updateDialog(dialog);
			});
		}
	});

	Template.replyBlock.onRendered(function() {
		$('.summernote').summernote({
			height: 200,
			focus: true
		});
	});

	Template.replyBlock.helpers({
		replySubject: function() {
			deps.depend();
			if (showForwardBlock) {
				if (replySubject.indexOf('Fwd:') === -1) {
					replySubject = 'Fwd: ' + replySubject;
				}
			}

			if (replySubject && replySubject.indexOf('Re:') === -1) {
				replySubject = 'Re: ' + replySubject;
			}

			return replySubject;
		}
	});

	Template.yandexDetailsTemplate.helpers({
		showForwardBlock: function() {
			deps.depend();
			return showForwardBlock;
		},
	});

	Template.yandexSettingsTemplate.events({
		'change .yandex__accounts-list': function(event) {
			login = event.target.value;
			if (login === 'new') {
				$('.yandex__new-account-container').removeClass('hidden');
			} else {
				$('.yandex__new-account-container').addClass('hidden');
			}
		}
	});

	Template.yandexAuthTemplate.helpers({
		clientId: function() {
			return Meteor.settings.public.yandex_client_id;
		},
	});

	Template.yandexPreviewTemplate.events({
		'click .js-yandex__load-more': function(event) {
			event.preventDefault();

			var params = self.params;

			params.boxName = 'INBOX';
			params.lastIndex = lastDialogsIndex;
			params.dialogsWith = _.pluck(dialogsWith, 'from');

			Meteor.call('getYandexMessages', params, function(error, results) {
				if (error) {
					console.log(error);
					return;
				}

				_.map(results.items, function(item) {
					item.channelId = self.channelId;
					if (item.attr.flags.indexOf('\\Seen') === -1) {
						item.class = ' message__unseen';
					}
				});

				dialogsWith = dialogsWith.concat(results.items.reverse());

				updateDialogs({
					blocks: [{
						messages: dialogsWith
					}],
					commonParams: results.box
				});
			});
		}
	});

})();
