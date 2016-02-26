(function() {
	let _data = [],
		_loadCompleteEventName = 'githubLoadComplete',
		_token,
		_resourceId,
		_isGuest;

	// Constructor
	this.GithubPlugin = function(token, resourceId, isGuest) {
		this.showRepos = null;
		this.userName = null;
		this.settingsTemplateName = 'githubSettingsTemplate';
		_token = token;
		_resourceId = resourceId;
		_isGuest = isGuest;

		this.loadCompleteEventName = _loadCompleteEventName;

		let defaults = {
			showRepos: true,
			userName: 'soshace'
		}

		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = extendDefaults(defaults, arguments[0]);
		}
	}

	// Public methods
	GithubPlugin.prototype.getUserRepos = function(func) {
		Session.set('settingsData', []);
		$.getJSON('https://api.github.com/user/repos', {
			access_token: _token,
			visibility: 'private'
		}, func);
	}

	GithubPlugin.prototype.getRepoCommits = function() {
		if (!_isGuest) {
			let request = 'https://api.github.com/repos/' + _resourceId + '/commits';
			$.getJSON(request, {
				access_token: _token
			}, function(data) {
				_data = data;
				runTemplating();
				let loadCompleteEvent = new CustomEvent(_loadCompleteEventName, {
					'detail': _data
				});
				window.dispatchEvent(loadCompleteEvent);
			});
		} else {
			let request = 'https://api.github.com/repos/' + _resourceId + '/commits?access_token=' + _token;
			Meteor.call('getGithub', request, function(error, results) {
				_data = results.data;
				console.log('Loading through server finished');
				runTemplating();
				let loadCompleteEvent = new CustomEvent(_loadCompleteEventName, {
					'detail': _data
				});
				window.dispatchEvent(loadCompleteEvent);
			});
		}
	}

	GithubPlugin.prototype.getRepoContributors = function() {
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
							let loadCompleteEvent = new CustomEvent(_loadCompleteEventName, {
								'detail': {
									emails: contributors
								}
							});
							window.dispatchEvent(loadCompleteEvent);
						}
					});
				})(contributor);
			}
		});
	}

	//Private methods
	function extendDefaults(source, properties) { // Utility method to extend defaults with user options
		let property;
		for (property in properties) {
			if (properties.hasOwnProperty(property)) {
				source[property] = properties[property];
			}
		}
		return source;
	}

	function runTemplating() {
		for (let item of _data) {
			item.name = item.author ? item.author.login : item.commit.author.email;
			item.avatar = item.author ? item.author.avatar_url : 'http://placehold.it/30x30';
			item.date = formatDateTime(item.commit.committer.date);
		}
	}

	function formatDateTime(dt) {
		let date = new Date(dt);
		return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
	};

})()