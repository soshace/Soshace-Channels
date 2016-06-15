(function() {
	var commits = [],
		serviceData,
		isGuest,
		channelId, // The id of channel
		loading, // Boolean variable that triggers if loading through server wasn't finished yet
		getUserEmailsCallback,
		self,
		login,
		messageStruct,
		currentBlock;

	// Constructor
	this.YandexPlugin = function() {
		this.settingsTemplateName = 'yandexSettingsTemplate';
		this.previewTemplateName = 'yandexPreviewTemplate';
		this.authTemplate = 'yandexAuthTemplate';
		this.clientKey = Meteor.settings.public.yandex_client_id;
		this.resourceId = 'yandex';

		self = this;
	};

	// Public methods
	// YandexPlugin.prototype.getUserEmails = function(func) {
	// 	if (!getUserEmailsCallback) {
	// 		getUserEmailsCallback = func;
	// 	}

	// 	getRepositories();
	// };

	YandexPlugin.prototype.setParameters = function(serviceD, resId, isGst, cnlId, structType) {
		serviceD.currentPage = serviceData ? serviceData.currentPage : 1;
		serviceData = serviceD;
		resourceId = resId;
		isGuest = isGst;
		channelId = cnlId;
		messageStruct = structType || 1;
	};

	YandexPlugin.prototype.setNextPage = function() {
		serviceData.currentPage += 1;
	};

	YandexPlugin.prototype.setPreviousPage = function() {
		serviceData.currentPage -= 1;
		serviceData.currentPage = serviceData.currentPage < 0 ? 0 : serviceData.currentPage;
	};

	YandexPlugin.prototype.getRepoCommits = function(getEmailsData, getEmails) {
		if (!serviceData.token && isGuest) {
			serviceData.channelId = channelId;
			serviceData.isGuest = true;
		}
		Meteor.call('getYandexMessages', serviceData, function(error, results) {
			_.map(results.items, function(item) {
				item.channelId = channelId;
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
		if (!serviceData.token && isGuest) {
			serviceData.channelId = channelId;
			serviceData.isGuest = true;
		}
		Meteor.call('getOneMessage', serviceData, uid, messageStruct, function(error, results) {
			currentBlock = results;
			getOneEmailCallback(results);
		});
	};

	YandexPlugin.prototype.setDefaultChannelName = function(func) {
		setDefaultChannelName = func;
	};

	YandexPlugin.prototype.getSettings = function(func) {};

	function getEmails() {};

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
})();