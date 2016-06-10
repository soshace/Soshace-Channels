(function() {
	var commits = [],
		serviceData,
		isGuest,
		channelId, // The id of channel
		loading, // Boolean variable that triggers if loading through server wasn't finished yet
		getUserEmailsCallback,
		self,
		login;

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

	YandexPlugin.prototype.setParameters = function(serviceD, resId, isGst, cnlId) {
		serviceData = serviceD;
		resourceId = resId;
		isGuest = isGst;
		channelId = cnlId;
	};

	YandexPlugin.prototype.getRepoCommits = function(getCommits, getEmails) {
		Meteor.call('getYandexMessages', serviceData.token, function(error, results) {
			_.map(results, function(item) {
				item.channelId = channelId;
			});

			getCommits(results.reverse());
		});
	};

	YandexPlugin.prototype.getSingleBlock = function(getOneEmailCallback, uid) {
		var request;

		if (!isGuest) {
			Meteor.call('getOneMessage', serviceData.token, uid, function(error, results) {
				// _.map(results, function(item){
				// 	item.channelId = channelId;
				// });
				var struct = results.attr.struct;
				if (struct.length === 1) {
					if (struct[0].encoding === 'base64'){
						results.body = b64DecodeUnicode(results.body1);						
					} else{
						results.body = results.body0;
					}
				}

				if (struct.length >=2) {
					if (results.attr.struct[1][0].encoding === 'base64') {
						results.body = b64DecodeUnicode(results.body2);
					} else {
						results.body = results.body2;
					}
				}

				console.log(results);
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

	function b64DecodeUnicode(str) {
		return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
	};

	Template.yandexSettingsTemplate.events({
		'change select[name=resource-id]': function(event) {
			var selectedValue = event.target.value;
			self.resourceId = selectedValue;
			var repoName = selectedValue.split('/')[1];
			setDefaultChannelName('github/' + repoName);
		},
	});
})();