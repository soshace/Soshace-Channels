(function() {
	var commits = [],
		serviceData,
		resourceId, // The name of repository
		isGuest,
		channelId, // The id of channel
		loading, // Boolean variable that triggers if loading through server wasn't finished yet
		visibility,
		getUserReposCallback,
		self;

	// Constructor
	this.GithubPlugin = function() {
		this.settingsTemplateName = 'githubSettingsTemplate';
		visibility = 'all';

		var defaults = {};
		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = extendDefaults(defaults, arguments[0]);
		}

		self = this;
	};

	// Public methods
	GithubPlugin.prototype.getUserRepos = function(func) {
		if (!getUserReposCallback) {
			getUserReposCallback = func;
		}

		getRepositories();
	};

	GithubPlugin.prototype.setParameters = function(serviceD, resId, isGst, cnlId) {
		serviceData = serviceD;
		resourceId = resId;
		isGuest = isGst;
		channelId = cnlId;
	};

	GithubPlugin.prototype.getRepoCommits = function(getCommits, getEmails) {
		loading = false;
		var request;
		commits = [];

		if (!isGuest) {
			request = 'https://api.github.com/repos/' + resourceId + '/commits';
			$.getJSON(request, {
				access_token: serviceData.token
			}, function(data) {
				commits = data;
				runTemplating();
				getCommits(commits, channelId);
				getRepoContributors(getEmails); // Only for host users
			});
		} else {
			loading = true;
			request = 'https://api.github.com/repos/' + resourceId + '/commits?access_token=';
			Meteor.call('getDataForGuest', request, channelId, function(error, results) {
				commits = results.data || [];
				runTemplating();
				if (loading) {
					getCommits(commits, channelId);
				}
			});
		}
	};

	GithubPlugin.prototype.getSingleBlock = function(getCommitCallback, sha) {
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

	GithubPlugin.prototype.setDefaultChannelName = function(func) {
		setDefaultChannelName = func;
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
	}

	function extendDefaults(source, properties) { // Utility method to extend defaults with user options
		for (let property in properties) {
			if (properties.hasOwnProperty(property)) {
				source[property] = properties[property];
			}
		}
		return source;
	}

	function runTemplating() {
		for (let item of commits) {
			item.name = item.author ? item.author.login : item.commit.author.email;
			item.avatar = item.author ? item.author.avatar_url : 'http://placehold.it/30x30';
			item.date = item.commit.committer.date;
			item.channelId = channelId;
		}
	}

	function getRepositories() {
		$.getJSON('https://api.github.com/user/repos', {
			access_token: serviceData.token,
			visibility: visibility,
			per_page: 50
		}, function(data) {
			getUserReposCallback(data);
			var repoName = data[0]['full_name'].split('/')[1];
			self.resourceId = data[0]['full_name'];
			setDefaultChannelName('github/' + repoName);
		});
	};

	function parsePatches(data) {
		var files = data.files;

		_.map(files, function(file) {
			if (!file.patch) {
				return;
			}

			var extension = file.filename.split('.')[1],
				lineInfos = [],
				patchLines = file.patch.split('\n');

			extension = extension === 'js' ? 'javascript' : extension;

			_.map(patchLines, function(line) {
				var lineInfo = {
					text: line,
					stringForParse: line,
					type: ''
				};

				if (line[0] === '+') {
					lineInfo.stringForParse = line.replace(/\+/, '');
					lineInfo.type = 'addition';
				}

				if (line[0] === '-') {
					lineInfo.stringForParse = line.replace(/-/, '');
					lineInfo.type = 'deletion';
				}
				if (line.match(/@@.+@@/) && (line[0] === '@')) {
					lineInfo.type = 'patchinfo';
					lineInfo.stringForParse = '';
				}
				if (line === '\\ No newline at end of file') {
					lineInfo.type = 'end';
					lineInfo.stringForParse = '';
				}

				lineInfos.push(lineInfo);
			});

			var contentToHighlight = _.pluck(lineInfos, 'stringForParse').join('\n');
			var highlightedContent = hljs.highlightAuto(contentToHighlight, [extension]).value;
			patchLines = highlightedContent.split('\n');

			_.map(patchLines, function(line, key) {
				switch (lineInfos[key].type) {
					case 'addition':
						lineInfos[key].text = '+' + line;
						break
					case 'deletion':
						lineInfos[key].text = '-' + line;
						break
					case 'end':
						break
					case 'patchinfo':
						break
					default:
						lineInfos[key].text = ' ' + line;
						break
				}
			});

			file.lines = lineInfos;
		});

		data.hash = data.sha;
	}

	Template.githubSettingsTemplate.events({
		'change select[name=resource-id]': function(event) {
			var selectedValue = event.target.value;
			self.resourceId = selectedValue;
			var repoName = selectedValue.split('/')[1];
			setDefaultChannelName('github/' + repoName);
		},

		'change select[name=repoVisibility]': function(event) {
			visibility = event.target.value;

			if (visibility === 'external') {
				$('.github__external-name').removeClass('hidden');
				$('.github__repo-list').addClass('hidden');
			} else {
				$('.github__external-name').addClass('hidden');
				$('.github__repo-list').removeClass('hidden');
				getRepositories();
			}
		}
	});

})();