(function() {
	var _data = [],
		_token,
		_resourceId, // The name of repository
		_isGuest,
		_channelId, // The id of channel
		_loading,
		visibility,
		getUserReposCallback;

	// Constructor
	this.GithubPlugin = function() {
		this.settingsTemplateName = 'githubSettingsTemplate';
		visibility = 'all';

		let defaults = {};
		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = extendDefaults(defaults, arguments[0]);
		}

		$('input[name=repoVisibility]:radio').change(function() {
			visibility = $('input[name=repoVisibility]:checked').val();
			if (visibility === 'external'){
				$('.github__external-name').removeClass('hidden');
				$('.github__repo-list').addClass('hidden');
			}else{
				$('.github__external-name').addClass('hidden');
				$('.github__repo-list').removeClass('hidden');
				$.getJSON('https://api.github.com/user/repos', {
					access_token: _token,
					visibility: visibility,
					per_page: 50
				}, getUserReposCallback);
			}
		});

		$('select[name=resource-id]').change(function(){
			console.log($(this).val());
			// TODO: Provide set default name
			setDefaultName($(this).val());
		})
	};

	// Public methods
	GithubPlugin.prototype.getUserRepos = function(func) {
		if (!getUserReposCallback) {
			getUserReposCallback = func;
		}
		$.getJSON('https://api.github.com/user/repos', {
			access_token: _token,
			visibility: visibility,
			per_page: 50
		}, func);
	};

	GithubPlugin.prototype.setParameters = function(token, resourceId, isGuest, channelId) {
		_token = token;
		_resourceId = resourceId;
		_isGuest = isGuest;
		_channelId = channelId;
	};

	GithubPlugin.prototype.getRepoCommits = function(getCommits, getEmails) {
		_loading = false;
		if (!_isGuest) {
			let request = 'https://api.github.com/repos/' + _resourceId + '/commits';
			$.getJSON(request, {
				access_token: _token
			}, function(data) {
				_data = data;
				runTemplating();
				getCommits(_data, _channelId);
				getRepoContributors(getEmails); // Only for host users
			});
		} else {
			_loading = true;
			let request = 'https://api.github.com/repos/' + _resourceId + '/commits?access_token=' + _token;
			Meteor.call('getGithub', request, function(error, results) {
				_data = results.data;
				console.log('Loading through server finished');
				runTemplating();
				if (_loading) {
					getCommits(_data, _channelId);
				}
			});
		}
	};

	GithubPlugin.prototype.getSingleBlock = function(getCommitCallback, sha) {
		if (!_isGuest) {
			var request = 'https://api.github.com/repos/' + _resourceId + '/commits/' + sha;
			$.getJSON(request, {
				access_token: _token
			}, function(data){
				parseCommitPatches(data);
				getCommitCallback(data);
			});
		} else {
			var request = 'https://api.github.com/repos/' + _resourceId + '/commits/' + sha + '?access_token=' + _token;
			Meteor.call('getGithub', request, function(error, results) {
				getCommitCallback(results ? results.data : {});
			});
		}
	};

	//Private methods
	function getRepoContributors(getEmails) {
		$.getJSON('https://api.github.com/repos/' + _resourceId + '/contributors', {
			access_token: _token
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
		let property;
		for (property in properties) {
			if (properties.hasOwnProperty(property)) {
				source[property] = properties[property];
			}
		}
		return source;
	};

	function runTemplating() {
		for (let item of _data) {
			item.name = item.author ? item.author.login : item.commit.author.email;
			item.avatar = item.author ? item.author.avatar_url : 'http://placehold.it/30x30';
			item.date = item.commit.committer.date;
			item.channelId = _channelId;
		}
	};

	function parseCommitPatches(data) {
		_.each(data.files, function(file) {
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

})();
