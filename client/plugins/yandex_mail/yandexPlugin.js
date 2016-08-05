(function() {
	var self,
		login,
		token,
		currentBlock,
		currentPage,
		showReplyBlock,
		showForwardBlock,
		replySubject,
		deps = new Deps.Dependency();

	this.YandexPlugin = function(channelData) {
		this.settingsTemplateName = 'yandexSettingsTemplate';
		this.previewTemplateName = 'yandexPreviewTemplate';
		this.authTemplate = 'yandexAuthTemplate';
		this.resourceId = 'INBOX';

		currentPage = 1;
		self = this;
		this.channelId = channelData._id;
		this.createdBy = channelData.createdBy;
		this.login = channelData.login;
		this.userIsHost = this.createdBy === Meteor.user()._id;

		if (this.userIsHost) {
			var tokens = Meteor.user().serviceTokens;
			this.token = _.findWhere(tokens, {serviceName: 'yandex', login: this.login}).token;
		} else {
			console.log('Guest preview is in progress!');
			return;
		}

		this.params = {
			channelId: this.channelId,
			createdBy: this.createdBy,
			userIsHost: this.userIsHost,
			login: this.login,
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
		currentPage += 1;
	};

	YandexPlugin.prototype.setPreviousPage = function() {
		currentPage -= 1;
		currentPage = currentPage <= 0 ? 1 : currentPage;
	};

	YandexPlugin.prototype.getChannelBlocks = function(getEmailsData) {
		var params = this.params;

		params.page = currentPage;
		params.boxName = 'INBOX';

		var messages = [];

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

			messages = results.items.reverse();

			console.log(messages);

			params.boxName = 'Отправленные';

			getEmailsData({
				blocks: [{messages: messages}],
				commonParams: results.box
			});

			// Meteor.call('getYandexMessages', params, function(error, results) {
			// 	if (error) {
			// 		console.log(error);
			// 		return;
			// 	}

			// 	messages = messages.concat(results.items.reverse());

			// 	console.log(messages);

			// 	getEmailsData({
			// 		blocks: messages,
			// 		commonParams: results.box
			// 	});
			// });
		});
	};

	YandexPlugin.prototype.getSingleBlock = function(getOneEmailCallback, from) {
		var params = self.params;

		params.from = from;
		params.boxName = 'INBOX';

		showReplyBlock = false;
		Meteor.call('getYandexDialog', params, function(error, result) {
			console.log(result);
			result.dialogMessages.forEach(function(item, index) {
				if (!item.isInbox) {
					result.dialogMessages[index].inboxClass = 'item-sent pull-right';					
				}
			});

			result.dialogMessages = _.sortBy(result.dialogMessages, function(item) {
				return item.date;
			});

			result.dialogMessages = result.dialogMessages.reverse();

			currentBlock = result;
			currentBlock.partnerAddress = from;
			getOneEmailCallback(result);
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

	function replyEmail(params) {
		var message = {
			bodyHtml: $('.summernote').summernote('code'),
			receiver: currentBlock.from,
			subject: replySubject
		};

		var params = self.params;

		if (!message.bodyHtml) {
			return;
		}

		Meteor.call('replyEmail', params, message, function(error, results) {
			if (error) {
				console.log(error);
				return;
			}
			Router.go('channel', {
				_id: self.channelId
			});
		});
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
			subject: replySubject
		};

		if (!message.bodyHtml) {
			return;
		}

		Meteor.call('replyEmail', message, function(error, results) {
			if (error) {
				console.log(error);
				return;
			}
			Router.go('channel', {
				_id: self.channelId
			});
		});
	};

	function deleteEmail() {
		var params = self.params;

		params.uid = currentBlock.uid;
		params.box = self.trashBox;

		Meteor.call('moveMessageToTrash', params, function(error, results) {
			if (error) {
				console.log(error);
				return;
			}
			Router.go('channel', {
				_id: self.channelId
			});
		});
	};

	function toSpam() {
		var params = self.params;

		params.uid = currentBlock.uid;
		params.box = self.spamBox;

		Meteor.call('moveMessageToSpam', params, function(error, results) {
			if (error) {
				console.log(error);
				return;
			}
			Router.go('channel', {
				_id: self.channelId
			});
		});
	};

	Template.yandexDetailsTemplate.events({
		'click .channel-block__send-email': function(event) {
			event.preventDefault();

			if (showForwardBlock) {
				forwardEmail();
			}
			else{
				replyEmail();				
			}
		},

		'click .email__show-reply': function(event) {
			event.preventDefault();
			showReplyBlock = !showReplyBlock;
			if (!showReplyBlock) {
				showForwardBlock = false;
			}
			deps.changed();
		},

		'click .email__show-forward': function(event) {
			event.preventDefault();
			showForwardBlock = !showForwardBlock;
			showReplyBlock = showForwardBlock;
			deps.changed();
		},

		'click .email__delete': function(event) {
			event.preventDefault();
			deleteEmail();
		},

		'click .email__spam': function(event) {
			event.preventDefault();
			toSpam();
		}
	});

	Template.replyBlock.events({
		'click .email__show-reply': function(event) {
			event.preventDefault();
			showReplyBlock = !showReplyBlock;
			deps.changed();
		},
	});

	Template.replyBlock.onRendered(function() {
		$('.summernote').summernote({
			height: 200,
			focus: true
		});

		var separator = '<br/><div class="email__separator">',
			date = moment(Date.parse(currentBlock.date)),
			body = '<div class="email__current-body">' + currentBlock.htmlBody || currentBlock.plainText + '</div>';

		separator += date.format('MMMM Do YYYY, hh:mm,');
		separator += currentBlock.from + ':</div>';

		$('.summernote').summernote('code', separator + body);
	});

	Template.yandexDetailsTemplate.helpers({
		showReplyBlock: function() {
			deps.depend();
			return showReplyBlock;
		},
	
		showForwardBlock: function() {
			deps.depend();
			return showForwardBlock;
		},

		replySubject: function() {
			deps.depend();
			replySubject = currentBlock.subject;
			if (showForwardBlock) {
				if (replySubject.indexOf('Fwd:') === -1) {
					replySubject = 'Fwd: ' + replySubject;
				}
				return replySubject;
			}
			if (showReplyBlock) {
				if (replySubject.indexOf('Re:') === -1) {
					replySubject = 'Re: ' + replySubject;
				}
				return replySubject;
			}
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