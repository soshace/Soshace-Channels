(function() {
	let _data = [],
		_loadCompleteEventName = 'githubLoadComplete';

	// Constructor
	this.GithubPlugin = function() {
		this.showRepos = null;
		this.userName = null;

		this.loadCompleteEventName = _loadCompleteEventName;

		let defaults = {
			showRepos: true,
			userName: 'soshace'
		}

		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = extendDefaults(defaults, arguments[0]);
		}

		$.getJSON('https://api.github.com/repos/soshace/social-sharing-interface/commits',{access_token:Session.get('githubToken')},function(data) {
			_data = data;
			console.log(data);
			runTemplating();
			let loadCompleteEvent = new CustomEvent(_loadCompleteEventName, {
				'detail': _data
			});
			window.dispatchEvent(loadCompleteEvent);
		});
	}

	// Public methods
	GithubPlugin.prototype.getData = function() {}

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
		// var bone = '<div>{{type}}</div>';
		// var _template = Handlebars.compile(bone);
		for (let commit of _data) {
			// event = _template(event);
			commit.name = commit.author.login;
			commit.dateLastActivity = formatDateTime(commit.commit.committer.date);
			commit.message = commit.commit.message;
			commit.shortUrl = commit.html_url;
		}
	}

	function formatDateTime(dt) {
		let date = new Date(dt);
		return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
	};

})()