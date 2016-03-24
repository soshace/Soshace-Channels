(function() {
	var commits = [],
		token,
		resourceId, // The name of repository
		isGuest,
		channelId, // The id of channel
		loading, // Boolean variable that triggers if loading through server wasn't finished yet
		visibility,
		getUserReposCallback;

	// Constructor
	this.GithubPlugin = function() {
		this.settingsTemplateName = 'githubSettingsTemplate';
		visibility = 'all';

		var defaults = {};
		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = extendDefaults(defaults, arguments[0]);
		}

		$('[name=repoVisibility]').change(function() {
			visibility = $('[name=repoVisibility]').val();
			if (visibility === 'external') {
				$('.github__external-name').removeClass('hidden');
				$('.github__repo-list').addClass('hidden');
			} else {
				$('.github__external-name').addClass('hidden');
				$('.github__repo-list').removeClass('hidden');

				getRepositories();
			}
		});

		var self = this;
		$('select[name=resource-id]').change(function() {
			var selectedValue = $(this).val();
			self.resourceId = selectedValue;
			var repoName = selectedValue.split('/')[1];
			setDefaultChannelName('github/'+repoName);
		})
	};

	// Public methods
	GithubPlugin.prototype.getUserRepos = function(func) {
		if (!getUserReposCallback) {
			getUserReposCallback = func;
		}
		getRepositories();
	};

	GithubPlugin.prototype.setParameters = function(tkn, resId, isGst, cnlId) {
		token = tkn;
		resourceId = resId;
		isGuest = isGst;
		channelId = cnlId;
	};

	GithubPlugin.prototype.getRepoCommits = function(getCommits, getEmails) {
		loading = false;
		if (!isGuest) {
			var request = 'https://api.github.com/repos/' + resourceId + '/commits';
			$.getJSON(request, {
				access_token: token
			}, function(data) {
				commits = data;
				runTemplating();
				getCommits(commits, channelId);
				getRepoContributors(getEmails); // Only for host users
			});
		} else {
			loading = true;
			var request = 'https://api.github.com/repos/' + resourceId + '/commits?access_token=' + token;
			Meteor.call('getGithub', request, function(error, results) {
				commits = results.data;
				runTemplating();
				if (loading) {
					getCommits(commits, channelId);
				}
			});
		}
	};

	GithubPlugin.prototype.getSingleBlock = function(getCommitCallback, sha) {
		if (!isGuest) {
			var request = 'https://api.github.com/repos/' + resourceId + '/commits/' + sha;
			$.getJSON(request, {
				access_token: token
			}, function(data) {
				parseCommitPatches(data);
				getCommitCallback(data);
			});
		} else {
			var request = 'https://api.github.com/repos/' + resourceId + '/commits/' + sha + '?access_token=' + token;
			Meteor.call('getGithub', request, function(error, results) {
				parseCommitPatches(results ? results.data : {});
				getCommitCallback(results ? results.data : {});
			});
		}
	};

	GithubPlugin.prototype.setDefaultChannelName = function(func) {
		setDefaultChannelName = func;
	};

	//Private methods
	function getRepoContributors(getEmails) {
		$.getJSON('https://api.github.com/repos/' + resourceId + '/contributors', {
			access_token: token
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

	function extendDefaults(source, properties) { // Utility method to extend defaults with user options
		for (let property in properties) {
			if (properties.hasOwnProperty(property)) {
				source[property] = properties[property];
			}
		}
		return source;
	};

	function runTemplating() {
		for (let item of commits) {
			item.name = item.author ? item.author.login : item.commit.author.email;
			item.avatar = item.author ? item.author.avatar_url : 'http://placehold.it/30x30';
			item.date = item.commit.committer.date;
			item.channelId = channelId;
		}
	};

	function parseCommitPatches(data) {
		_.each(data.files, function(file) {
			if (!file.patch){
				return;
			}
			file.patch = file.patch.split('\n');
			file.lines = _.map(file.patch, function(line) {
				var bgStyle = '';
				if (line[0] === '+') {
					bgStyle = 'commit__green-line';
				}
				if (line[0] === '-') {
					bgStyle = 'commit__red-line';
				};
				return {
					value: line,
					bgStyle: bgStyle
				}
			});
		});
	};

	function getRepositories(){
		$.getJSON('https://api.github.com/user/repos', {
			access_token: token,
			visibility: visibility,
			per_page: 50
		}, function(data){
			getUserReposCallback(data);
			resourceId = data[0]['full_name'];
			var repoName = resourceId.split('/')[1];
			setDefaultChannelName('github/'+repoName);
		});
	};

})();
