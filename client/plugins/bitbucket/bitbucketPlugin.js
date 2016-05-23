(function() {
	var commits = [],
			token,
			resourceId, // The name of repository
			isGuest,
			channelId, // The id of channel
			loading, // Boolean variable that triggers if loading through server wasn't finished yet
			visibility,
			getUserReposCallback,
			self;

	// Constructor
	this.BitbucketPlugin = function() {
		this.settingsTemplateName = 'bitbucketSettingsTemplate';
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

		self = this;
		$('select[name=resource-id]').change(function() {
			var selectedValue = $(this).val();
			self.resourceId = selectedValue;
			var repoName = selectedValue.split('/')[1];
			setDefaultChannelName('bitbucket/' + repoName);
		});
	};

	// Public methods
	BitbucketPlugin.prototype.getUserRepos = function(func) {
		if (!getUserReposCallback) {
			getUserReposCallback = func;
		}

		getRepositories();
	};

	BitbucketPlugin.prototype.setParameters = function(tkn, resId, isGst, cnlId) {
		token = tkn;
		resourceId = resId;
		isGuest = isGst;
		channelId = cnlId;
	};

	BitbucketPlugin.prototype.getRepoCommits = function(getCommits, getEmails) {
		loading = false;
		var request;
		commits = [];

		console.log(resourceId);
		if (!isGuest) {
			// request = 'https://api.github.com/repos/' + resourceId + '/commits';
			request = 'https://api.bitbucket.org/2.0/repositories/' + resourceId + '/commits';
			$.getJSON(request, {
				access_token: token
			}, function(data) {
				commits = data.values;
				runTemplating();
				getCommits(commits, channelId);
				// getRepoContributors(getEmails); // Only for host users
			});
		} else {
			loading = true;
			request = 'https://api.bitbucket.org/2.0/repositories/' + resourceId + '/commits?access_token=' + token;
			Meteor.call('getBitbucket', request, function(error, results) {
				console.log(results);
				commits = results.data.values;
				runTemplating();
				if (loading) {
					getCommits(commits, channelId);
				}
			});
		}
	};

	BitbucketPlugin.prototype.getSingleBlock = function(getCommitCallback, sha) {
		var request;
		if (!isGuest) {
			request = 'https://api.bitbucket.org/2.0/repositories/' + resourceId + '/commit/' + sha;
			$.getJSON(request, {
				access_token: token
			}, function(data) {
				var diffRequest = data.links.diff.href,
						commitData = data;
				$.get(diffRequest, {
					access_token: token
				}, function(data) {
					parseDiff(data, commitData, getCommitCallback);
				});
			});
		} else {
			request = 'https://api.bitbucket.org/2.0/repositories/' + resourceId + '/commit/' + sha + '?access_token=' + token;
			Meteor.call('getBitbucket', request, function(error, results) {
				var diffRequest = results.data.links.diff.href,
						commitData = results.data;
				$.get(diffRequest, {// MAKE THIS REQUEST FROM SERVER!!!
					access_token: token
				}, function(data) {
					parseDiff(data, commitData, getCommitCallback);
				});
			});
		}
	};

	BitbucketPlugin.prototype.setDefaultChannelName = function(func) {
		setDefaultChannelName = func;
	};

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
			item.name = item.author.user.display_name;
			item.avatar = item.author.user.links.avatar.href;
			item.date = item.date;
			item.channelId = channelId;
		}
	}

	function getRepositories() {
		$.getJSON('https://api.bitbucket.org/2.0/repositories', {
			// owner: 'VitaliiZhukov',
			role: 'member',
			access_token: token,
			pagelen: 20
		}, function(data) {
			var repos = data.values;
			getUserReposCallback(repos);
			var repoName = repos[0]['full_name'].split('/')[1];
			self.resourceId = repos[0]['full_name'];
			setDefaultChannelName('bitbucket/' + repoName);
		});
	};

	function parseDiff(data, commitData, getCommitCallback) {
		var lines = data.split('\n'),
				file,
				files = [],
				patchIndexes = [],
				startRegexp = /^(diff --git a\/)(.*|\n)/g,
				endRegexp = /^(\+\+\+ b\/)(.*|\n)/g;

		_.map(lines, function(val, index){
			if (lines[index].match(startRegexp)){
				if (lines[index+3] && lines[index+3].match(endRegexp)){
					files.push({
						filename: /(diff --git a\/)(.*|\n)(?= b)/g.exec(lines[index])[2],
						patch: '',
						index: index
					});
					patchIndexes.push(index+4);
				}
			}
		});

		patchIndexes.push(lines.length + 3);

		_.map(patchIndexes, function(val, index){
			if (index < patchIndexes.length - 1){
				for (var i = val; i < patchIndexes[index + 1] - 4; i++) {
					files[index].patch += lines[i] + '\n';
				};				
			}
		});

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
		commitData.files = files;
		getCommitCallback(commitData);
	}
})();