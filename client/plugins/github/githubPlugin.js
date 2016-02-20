(function() {
	var _events = [],
		_loadCompleteEventName = 'githubLoadComplete';

	// Constructor
	this.GithubPlugin = function() {
		this.showRepos = null;
		this.userName = null;

		this.loadCompleteEventName = _loadCompleteEventName;

		var defaults = {
			showRepos: true,
			userName: 'soshace'
		}

		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = extendDefaults(defaults, arguments[0]);
		}

		$.getJSON('https://api.github.com/users/soshace/events', function(data) {
			// console.log(data);
			_events = data;
			runTemplating();
			var loadCompleteEvent = new CustomEvent(_loadCompleteEventName, {
				'detail': _events
			});
			window.dispatchEvent(loadCompleteEvent);						
		});
	}

	// Public methods
	GithubPlugin.prototype.getData = function() {}

	//Private methods
	function extendDefaults(source, properties) { // Utility method to extend defaults with user options
		var property;
		for (property in properties) {
			if (properties.hasOwnProperty(property)) {
				source[property] = properties[property];
			}
		}
		return source;
	}

	function runTemplating() {
		var bone = '<div>{{type}}</div>';
		// var _template = Handlebars.compile(bone);
		for (let event of _events){
			// event = _template(event);
			event.name = `EventID: ${event.id}; Type: ${event.type}; repo: ${event.repo.name}; author: ${event.actor.login}`;
			event.dateLastActivity = event.created_at;
		}
	}
})()