(function() {
	var commits = [],
		serviceData,
		isGuest,
		channelId, // The id of channel
		loading, // Boolean variable that triggers if loading through server wasn't finished yet
		getUserEmailsCallback,
		self,
		login,
		messageStruct;

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
		Meteor.call('getYandexMessages', serviceData, function(error, results) {
			_.map(results.items, function(item) {
				item.channelId = channelId;
				if (item.attr.flags.indexOf('\\Seen') === -1) {
					item.class=' message__unseen';
				}
			});

			getEmailsData({
				blocks: results.items.reverse(),
				commonParams: results.box
			});
		});
	};

	YandexPlugin.prototype.getSingleBlock = function(getOneEmailCallback, uid) {
		var request;
		if (!isGuest) {
			Meteor.call('getOneMessage', serviceData, uid, messageStruct, function(error, results) {
				getOneEmailCallback(results);
			});
		}
	};

	YandexPlugin.prototype.setDefaultChannelName = function(func) {
		setDefaultChannelName = func;
	};

	YandexPlugin.prototype.getSettings = function(func) {};

	//Private methods
	function getRepoContributors(getEmails) {
		$.getJSON('https://api.github.com/repos/' + resourceId + '/contributors', {
			access_token: serviceData.token
		}, function(data) {
			var contributors = data;
			var counter = contributors.length;
			for (var contributor of contributors) {
				(function(contributor) {
					$.getJSON('https://api.github.com/users/' + contributor.login, function(data) {
						counter--; // This counter is used to determine if we took checked contributors for email.
						contributor.email = data.email || 'private';
						if (counter === 0) {
							getEmails(contributors);
						}
					});
				})(contributor);
			}
		});
	};

	function getEmails() {};

	Template.yandexDetailsTemplate.events({
		'click .channel-block__send-email': function(event) {
			console.log(123);
			var body = '';
			Meteor.call('replyEmail', serviceData, body, function(error, results) {

			});
		}
	});
})();