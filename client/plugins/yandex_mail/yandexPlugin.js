(function() {
	var self,
		dialog,
		showForwardBlock,
		replySubject,
		deps = new Deps.Dependency();

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

		Meteor.call('getImapBoxes', self.params, function(error, results) {
			self.boxes = results;

			for (var box in results) {
				var attr = results[box]['special_use_attrib'];

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
		// currentPage += 1;
	};

	YandexPlugin.prototype.setPreviousPage = function() {
		// currentPage -= 1;
		// currentPage = currentPage <= 0 ? 1 : currentPage;
	};

	YandexPlugin.prototype.getChannelBlocks = function(getEmailsData) {
		var params = this.params;

		params.boxName = 'INBOX';

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

			params.boxName = 'Отправленные';

			getEmailsData({
				blocks: [{
					messages: results.items.reverse()
				}],
				commonParams: results.box
			});
		});
	};

	YandexPlugin.prototype.getSingleBlock = function(getDialogCallback, from) {
		var params = self.params;

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
			subject: replySubject,
			login: self.params.login
		};

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
			subject: replySubject,
			login: self.params.login
		};

		sendMessage(message);
	};

	function deleteEmail(uid) {
		var params = self.params;

		params.uid = uid;
		params.box = self.trashBox;

		Meteor.call('moveMessageToTrash', params, function(error, results) {
			if (error) {
				Bert.alert('Error with message deleting', 'error');
				return;
			}
			Bert.alert('Message was successfully deleted!', 'success');
		});
	};

	function toSpam() {
		var params = self.params;

		params.uid = uid;
		params.box = self.spamBox;

		Meteor.call('moveMessageToSpam', params, function(error, results) {
			if (error) {
				Bert.alert('Error with moving message to spam', 'error');
				return;
			}
			Bert.alert('Message was moved to spam', 'success');
		});
	};

	function selectMessage(uid) {
		var selectedMessage = _.findWhere(dialog.dialogMessages, {
				uid: +uid
			}),
			separator = '<br/><div class="email__separator">',
			date = moment.unix(selectedMessage.date / 1000),
			body = '<div class="email__current-body">' + selectedMessage.htmlBody || selectedMessage.plainText + '</div>';

		separator += date.format('MMMM Do YYYY, hh:mm,');
		separator += selectedMessage.from + ':</div>';

		$('.summernote').summernote('code', separator + body);
		$('.summernote').summernote({focus: true});

		replySubject = selectedMessage.subject;

		deps.changed();
	};

	function sendMessage(message) {
		if (!message.bodyHtml) {
			return;
		}

		Meteor.call('replyEmail', self.params, message, function(error, results) {
			if (error) {
				Bert.alert(error.reason, 'error');
				return;
			}

			Bert.alert('Message was successfully sent!', 'success');

			showForwardBlock = false;

			$('.summernote').summernote('code', '');

			replySubject = '';

			deps.changed();
		});
	};

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
		}
	});

	Template.replyBlock.events({
		'click .email__show-reply': function(event) {
			event.preventDefault();
			// showReplyBlock = !showReplyBlock;
			deps.changed();
		},
	});

	Template.replyBlock.onRendered(function() {
		$('.summernote').summernote({
			height: 200,
			focus: true
		});
	});

	Template.yandexDetailsTemplate.helpers({
		showForwardBlock: function() {
			deps.depend();
			return showForwardBlock;
		},

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

})();