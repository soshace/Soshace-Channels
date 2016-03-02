(function() {
	let _data = [],
		_token,
		_resourceId, // The name of repository
		_isGuest,
		_channelId, // The id of channel
		_loading;

	// Constructor
	this.GithubPlugin = function() {
		this.settingsTemplateName = 'githubSettingsTemplate';

		let defaults = {};
		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = extendDefaults(defaults, arguments[0]);
		}
		console.log('github created');
	}

	// Public methods
	GithubPlugin.prototype.getUserRepos = function(func) {
		$.getJSON('https://api.github.com/user/repos', {
			access_token: _token,
			visibility: 'private'
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
				if (_loading){
					getCommits(_data, _channelId);					
				}
			});
		}
	}

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
			item.date = formatDateTime(item.commit.committer.date);
		}
	};

	function formatDateTime(dt) {
		let date = new Date(dt);
		return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
	};

})()