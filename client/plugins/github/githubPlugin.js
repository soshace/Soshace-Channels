(function() {
	let _data = [],
		_loadCompleteEventName = 'githubLoadComplete',
		_token,
		_resourceId;

	// Constructor
	this.GithubPlugin = function(token,resourceId) {
		this.showRepos = null;
		this.userName = null;
		this.settingsTemplateName = 'githubSettingsTemplate';
		_token = token;
		_resourceId = resourceId;

		this.loadCompleteEventName = _loadCompleteEventName;

		let defaults = {
			showRepos: true,
			userName: 'soshace'
		}

		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = extendDefaults(defaults, arguments[0]);
		}

		let request = 'https://api.github.com/repos/soshace/'+_resourceId+'/commits'
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
	}

	// Public methods
	GithubPlugin.prototype.getUserRepos = function(func) {
		$.getJSON('https://api.github.com/user/repos', {
			access_token: _token,
			visibility: 'private'
		},func);
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