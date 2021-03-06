(function() {
	var commits = [],
		tokenParams,
		resourceId, // The name of repository
		visibility,
		getUserReposCallback,
		self,
		channelData;

	// Constructor
	this.GithubPlugin = function(data) {
		this.settingsTemplateName = 'githubSettingsTemplate';
		this.previewTemplateName = 'githubPreviewTemplate';
		this.authTemplate = 'githubAuthTemplate';

		visibility = 'all';
		self = this;

		tokenParams = data.tokenParams;
		resourceId = data.serviceResource;
		channelData = data;

		if (!tokenParams) {
			var currentUser = Meteor.user();
			tokenParams = _.findWhere(currentUser.serviceTokens, {
				serviceName: channelData.serviceType
			});
		}
	};

	// Public methods
	GithubPlugin.prototype.getSettings = function(func) {
		if (!getUserReposCallback) {
			getUserReposCallback = func;
		}
		getRepositories();
	};

	GithubPlugin.prototype.getLogin = function() {
		return 'github'; // TODO: Implement getting user login
	};

	GithubPlugin.prototype.getChannelBlocks = function(getCommits) {
		var request;
		commits = [];

		if (channelData.userIsHost) {
			request = 'https://api.github.com/repos/' + resourceId + '/commits';
			$.getJSON(request, {
				access_token: tokenParams.token
			}, function(data) {
				commits = data;
				runTemplating();
				var result = {
					blocks: commits,
					commonParams: ''
				};
				getCommits(result, channelData._id);
			});
		} else {
			request = 'https://api.github.com/repos/' + resourceId + '/commits?access_token=';
			Meteor.call('getDataForGuest', request, channelData._id, function(error, results) {
				if (error) {
					console.log(error);
				}
				commits = results.data || [];
				runTemplating();
				var result = {
					blocks: commits,
					commonParams: ''
				};
				getCommits(result, channelData._id);
			});
		}
	};

	GithubPlugin.prototype.getSingleBlock = function(getCommitCallback, sha) {
		var request;
		if (channelData.userIsHost) {
			request = 'https://api.github.com/repos/' + resourceId + '/commits/' + sha;
			$.getJSON(request, {
				access_token: tokenParams.token
			}, function(data) {
				parsePatches(data);
				getCommitCallback(data);
			});
		} else {
			request = 'https://api.github.com/repos/' + resourceId + '/commits/' + sha + '?access_token=';
			Meteor.call('getDataForGuest', request, channelData._id, function(error, results) {
				parsePatches(results.data);
				getCommitCallback(results ? results.data : {});
			});
		}
	};

	GithubPlugin.prototype.setDefaultChannelName = function(func) {
		setDefaultChannelName = func;
	};

	//Private methods
	function getRepositories() {
		$.getJSON('https://api.github.com/user/repos', {
			access_token: tokenParams.token,
			visibility: visibility,
			per_page: 50
		}, function(data) {
			getUserReposCallback(data);
			var repoName = data[0]['full_name'].split('/')[1];
			self.resourceId = data[0]['full_name'];
			setDefaultChannelName('github/' + repoName);
		});
	};

	function runTemplating() {
		_.map(commits, function(item) {
			item.name = item.author ? item.author.login : item.commit.author.email;
			item.avatar = item.author ? item.author.avatar_url : 'http://placehold.it/30x30';
			item.date = item.commit.committer.date;
			item.channelId = channelData._id;
		})
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
	};

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

	Template.githubAuthTemplate.helpers({
		clientId: function() {
			return Meteor.settings.public.github_client_id;
		},
	});

})();