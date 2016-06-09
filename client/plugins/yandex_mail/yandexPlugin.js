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
		Meteor.call('getYandexLogin', serviceData.token, function(error, results) {
			getCommits(results);
		});

		// loading = false;
		// var request;
		// commits = [];

		// if (!isGuest) {
		// 	request = 'https://api.github.com/repos/' + resourceId + '/commits';
		// 	$.getJSON(request, {
		// 		access_token: serviceData.token
		// 	}, function(data) {
		// 		commits = data;
		// 		runTemplating();
		// 		getCommits(commits, channelId);
		// 		getRepoContributors(getEmails); // Only for host users
		// 	});
		// } else {
		// 	loading = true;
		// 	request = 'https://api.github.com/repos/' + resourceId + '/commits?access_token=';
		// 	Meteor.call('getDataForGuest', request, channelId, function(error, results) {
		// 		commits = results.data || [];
		// 		runTemplating();
		// 		if (loading) {
		// 			getCommits(commits, channelId);
		// 		}
		// 	});
		// }
	};

	YandexPlugin.prototype.getSingleBlock = function(getCommitCallback, sha) {
		var request;

		if (!isGuest) {
			request = 'https://api.github.com/repos/' + resourceId + '/commits/' + sha;
			$.getJSON(request, {
				access_token: serviceData.token
			}, function(data) {
				parsePatches(data);
				getCommitCallback(data);
			});
		} else {
			request = 'https://api.github.com/repos/' + resourceId + '/commits/' + sha + '?access_token=';
			Meteor.call('getDataForGuest', request, channelId, function(error, results) {
				parsePatches(results.data);
				getCommitCallback(results ? results.data : {});
			});
		}
	};

	YandexPlugin.prototype.setDefaultChannelName = function(func) {
		setDefaultChannelName = func;
	};

	YandexPlugin.prototype.getSettings = function(func) {
	};

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

	function getEmails() {
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