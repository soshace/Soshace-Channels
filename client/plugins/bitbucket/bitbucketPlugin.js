(function() {
	var serviceData,
		resourceId, // The name of repository
		isGuest,
		channelId, // The id of channel
		loading, // Boolean variable that triggers if loading through server wasn't finished yet
		getUserReposCallback,
		self;

	// Constructor
	this.BitbucketPlugin = function() {
		this.settingsTemplateName = 'bitbucketSettingsTemplate';

		var defaults = {};
		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = extendDefaults(defaults, arguments[0]);
		}

		self = this;
	};

	// Public methods
	BitbucketPlugin.prototype.getUserRepos = function(func) {
		if (!getUserReposCallback) {
			getUserReposCallback = func;
		}
		getRepositories();
	};

	BitbucketPlugin.prototype.setParameters = function(serviceD, resId, isGst, cnlId) {
		serviceData = serviceD;
		resourceId = resId;
		isGuest = isGst;
		channelId = cnlId;
	};

	BitbucketPlugin.prototype.getRepoCommits = function(getCommits, getEmails) {
		loading = false;
		var request;
		commits = [];
		if (!isGuest) {
			request = 'https://api.bitbucket.org/2.0/repositories/' + resourceId + '/commits';
			$.getJSON(request, {
					access_token: serviceData.token
				})
				.done(function(data) {
					commits = data.values;
					runTemplating(commits);
					getCommits(commits, channelId);
				})
				.fail(function(error) {
					if (error.status === 401) {
						Meteor.call('refreshBitbucketToken', serviceData.refreshToken, function(error, results) {
							serviceData.token = results.data.access_token;
							serviceData.refreshToken = results.data.refresh_token;

							$.getJSON(request, {
									access_token: serviceData.token
								})
								.done(function(data) {
									commits = data.values;
									runTemplating(commits);
									getCommits(commits, channelId);
								});
							Meteor.call('addToken', serviceData);
						});
					}
				});
		} else {
			loading = true;
			request = 'https://api.bitbucket.org/2.0/repositories/' + resourceId + '/commits?access_token=';
			Meteor.call('getBitbucketDataForGuest', request, channelId, function(error, results) {
				if (error) {
					Meteor.call('refreshBitbucketTokenByGuest', channelId, function(error, result) {});
					return;
				}
				commits = results.data.values;
				runTemplating(commits);
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
					access_token: serviceData.token
				})
				.done(function(data) {
					var diffRequest = data.links.diff.href,
						commitData = data;
					$.get(diffRequest, {
						access_token: serviceData.token
					}, function(data) {
						parseDiff(data, commitData, getCommitCallback);
					});
				})
				.fail(function(error) {
					console.log(error);
				});
		} else {
			request = 'https://api.bitbucket.org/2.0/repositories/' + resourceId + '/commit/' + sha + '?access_token=';
			Meteor.call('getBitbucketDataForGuest', request, channelId, function(error, results) {
				var diffRequest = results.data.links.diff.href,
					commitData = results.data;
				Meteor.call('getBitbucketDataForGuest', diffRequest + '?access_token=', channelId, function(error, results) {
					parseDiff(results.content, commitData, getCommitCallback);
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
	};

	function runTemplating(commits) {
		for (let item of commits) {
			item.name = item.author.user.display_name;
			item.avatar = item.author.user.links.avatar.href;
			item.date = item.date;
			item.channelId = channelId;
		}
	};

	function getRepositories() {
		$.getJSON('https://api.bitbucket.org/2.0/repositories', {
				role: 'member',
				access_token: serviceData.token,
				pagelen: 20
			})
			.done(function(data) {
				var repos = data.values;
				getUserReposCallback(repos);
				var repoName = repos[0]['full_name'].split('/')[1];
				self.resourceId = repos[0]['full_name'];
				setDefaultChannelName('bitbucket/' + repoName);
			})
			.fail(function(error) {
				if (error.status === 401) {
					Meteor.call('refreshBitbucketToken', serviceData.refreshToken, function(error, results) {
						serviceData.token = results.data.access_token;
						serviceData.refreshToken = results.data.refresh_token;

						Meteor.call('addToken', serviceData);
					});
				}
			});
	};

	function parseDiff(data, commitData, getCommitCallback) {
		var lines = data.split('\n'),
			files = [],
			startRegexp = /^(diff --git a\/)(.*|\n)/g,
			endRegexp = /^(\+\+\+ b\/)(.*|\n)/g,
			linesCount = lines.length;

		commitData.additions = 0;
		commitData.deletions = 0;

		_.map(lines, function(val, index) {
			if (lines[index].match(startRegexp)) {
				files.push({
					filename: /(diff --git a\/)(.*|\n)(?= b)/g.exec(lines[index])[2],
					patch: '',
					extension: lines[index].split('.').splice(-1)[0],
					startInfoIndex: index,
					additions: 0,
					deletions: 0,
					changes: 0
				});
			}
			if (lines[index].match(endRegexp)) {
				files[files.length - 1].startDataIndex = index + 1;
			}
		});

		_.map(files, function(file, index) {
			if (index === files.length - 1) {
				file.linesCount = linesCount - file.startDataIndex;
			} else {
				file.linesCount = files[index + 1].startInfoIndex - file.startDataIndex;
			}
			for (var i = file.startDataIndex; i < file.startDataIndex + file.linesCount; i++) {
				file.patch += lines[i] + '\n';
			};
		});

		_.map(files, function(file) {
			if (!file.patch) {
				return;
			}

			var lineInfos = [],
				patchLines = file.patch.split('\n');

			_.map(patchLines, function(line) {
				var lineInfo = {
					text: line,
					stringForParse: line,
					type: ''
				};

				if (line[0] === '+') {
					lineInfo.stringForParse = line.replace(/\+/, '');
					lineInfo.type = 'addition';
					file.additions++;
				}

				if (line[0] === '-') {
					lineInfo.stringForParse = line.replace(/-/, '');
					lineInfo.type = 'deletion';
					file.deletions++;
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

			file.changes = file.additions + file.deletions;
			commitData.additions += file.additions;
			commitData.deletions += file.deletions;

			var contentToHighlight = _.pluck(lineInfos, 'stringForParse').join('\n'),
				highlightedContent = contentToHighlight;

			if (!['jpg', 'jpeg', 'png'].indexOf(file.extension) > -1) {
				highlightedContent = hljs.highlightAuto(contentToHighlight, [file.extension]).value;
			}
			patchLines = highlightedContent.split('\n');
			_.map(patchLines, function(line, key) {
				switch (lineInfos[key].type) {
					case 'addition':
						lineInfos[key].text = '+' + line;
						break;
					case 'deletion':
						lineInfos[key].text = '-' + line;
						break;
					case 'end':
						break;
					case 'patchinfo':
						break;
					default:
						lineInfos[key].text = ' ' + line;
						break
				}
			});
			file.lines = lineInfos;
		});
		commitData.files = files;
		getCommitCallback(commitData);
	};

	Template.bitbucketSettingsTemplate.events({
		'change select[name=resource-id]': function(event) {
			var selectedValue = event.target.value;
			self.resourceId = selectedValue;
			var repoName = selectedValue.split('/')[1];
			setDefaultChannelName('bitbucket/' + repoName);
		},
	});
})();