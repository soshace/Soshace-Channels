(function() {
	var self,
		login,
		currentBlock,
		currentPage;

	this.YandexPlugin = function(channelData) {
		this.settingsTemplateName = 'yandexSettingsTemplate';
		this.previewTemplateName = 'yandexPreviewTemplate';
		this.authTemplate = 'yandexAuthTemplate';
		this.resourceId = 'INBOX';

		currentPage = 1;
		self = this;
		this.channelId = channelData._id;
	};

	YandexPlugin.prototype.setNextPage = function() {
		currentPage += 1;
	};

	YandexPlugin.prototype.setPreviousPage = function() {
		currentPage -= 1;
		currentPage = currentPage <= 0 ? 1 : currentPage;
	};

	YandexPlugin.prototype.getChannelBlocks = function(getEmailsData, getEmails) {
		Meteor.call('getYandexMessages', self.channelId, currentPage, function(error, results) {
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

			getEmailsData({
				blocks: results.items.reverse(),
				commonParams: results.box
			});
		});
	};

	YandexPlugin.prototype.getSingleBlock = function(getOneEmailCallback, uid) {
		Meteor.call('getOneMessage', self.channelId, uid, function(error, results) {
			currentBlock = results;
			getOneEmailCallback(results);
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
			body: $('.email__reply-textarea').val(),
			receiver: currentBlock.from,
			subject: currentBlock.subject
		};
		Meteor.call('replyEmail', serviceData, message);
	};

	Template.yandexDetailsTemplate.events({
		'click .channel-block__send-email': function(event) {
			event.preventDefault();
			replyEmail();
		},

		'keyup .email__reply-textarea': function(event) {
			event.preventDefault();
			if ((event.keyCode === 13) && (event.ctrlKey)) {
				replyEmail();
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