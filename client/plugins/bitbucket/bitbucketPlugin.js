(function() {
	var tokenParams,
		resourceId, // The name of repository
		getUserReposCallback,
		self,
		channelData;

	// Constructor
	this.BitbucketPlugin = function(data) {
		this.settingsTemplateName = 'bitbucketSettingsTemplate';
		this.previewTemplateName = 'bitbucketPreviewTemplate';
		this.authTemplate = 'bitbucketAuthTemplate';

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
	BitbucketPlugin.prototype.getSettings = function(func) {
		if (!getUserReposCallback) {
			getUserReposCallback = func;
		}
		getRepositories();
	};

	BitbucketPlugin.prototype.getLogin = function() {
		return 'bitbucket'; // TODO: Implement getting user login
	};

	BitbucketPlugin.prototype.getChannelBlocks = function(getCommits) {
		var request;
		commits = [];
		if (channelData.userIsHost) {
			request = 'https://api.bitbucket.org/2.0/repositories/' + resourceId + '/commits';
			$.getJSON(request, {
					access_token: tokenParams.token
				})
				.done(function(data) {
					commits = data.values;
					runTemplating(commits);
					var result = {
						blocks: commits,
						commonParams: ''
					};
					getCommits(result, channelData._id);
				})
				.fail(function(error) {
					if (error.status === 401) {
						Meteor.call('refreshBitbucketToken', tokenParams.refreshToken, function(error, results) {
							tokenParams.token = results.data.access_token;
							tokenParams.refreshToken = results.data.refresh_token;

							$.getJSON(request, {
									access_token: tokenParams.token
								})
								.done(function(data) {
									commits = data.values;
									runTemplating(commits);
									var result = {
										blocks: commits,
										commonParams: ''
									};
									getCommits(commits, channelData._id);
								});
							Meteor.call('addToken', tokenParams);
						});
					}
				});
		} else {
			request = 'https://api.bitbucket.org/2.0/repositories/' + resourceId + '/commits?access_token=';
			Meteor.call('getDataForGuest', request, channelData._id, function(error, results) {
				if (error.status === 401) {
					Meteor.call('refreshBitbucketTokenByGuest', channelData._id, function(error, result) {
					});
					return;
				}
				commits = results.data.values;
				runTemplating(commits);
					getCommits(commits, channelData._id);
			});
		}
	};

	BitbucketPlugin.prototype.getSingleBlock = function(getCommitCallback, sha) {
		var request;
		if (channelData.userIsHost) {
			request = 'https://api.bitbucket.org/2.0/repositories/' + resourceId + '/commit/' + sha;
			$.getJSON(request, {
					access_token: tokenParams.token
				})
				.done(function(data) {
					var diffRequest = data.links.diff.href,
						commitData = data;
					$.get(diffRequest, {
						access_token: tokenParams.token
					}, function(data) {
						parseDiff(data, commitData, getCommitCallback);
					});
				})
				.fail(function(error) {
					console.log(error);
				});
		} else {
			request = 'https://api.bitbucket.org/2.0/repositories/' + resourceId + '/commit/' + sha + '?access_token=';
			Meteor.call('getDataForGuest', request, channelData._id, function(error, results) {
				var diffRequest = results.data.links.diff.href,
					commitData = results.data;
				Meteor.call('getDataForGuest', diffRequest + '?access_token=', channelData._id, function(error, results) {
					parseDiff(results.content, commitData, getCommitCallback);
				});
			});
		}
	};

	BitbucketPlugin.prototype.setDefaultChannelName = function(func) {
		setDefaultChannelName = func;
	};

	// Private methods
	function runTemplating(commits) {
		_.map(commits, function(commit) {
			commit.name = commit.author.user.display_name;
			commit.avatar = commit.author.user.links.avatar.href;
			commit.date = commit.date;
			commit.channelId = channelData._id;
		});
	};

	function getRepositories() {
		$.getJSON('https://api.bitbucket.org/2.0/repositories', {
				role: 'member',
				access_token: tokenParams.token,
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
					Meteor.call('refreshBitbucketToken', tokenParams.refreshToken, function(error, results) {
						tokenParams.token = results.data.access_token;
						tokenParams.refreshToken = results.data.refresh_token;

						Meteor.call('addToken', tokenParams, function(error, results) {
							getRepositories();
						});
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

	Template.bitbucketAuthTemplate.helpers({
		clientId: function() {
			return Meteor.settings.public.bitbucket_client_id;
		},
	});
})();