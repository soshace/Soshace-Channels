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

		// $.getJSON('https://api.github.com/applications/40ca9788c56b7ce7307f/tokens/e70a5408e00713cf9483f7340fecdb3232b12787', {
		$.getJSON('https://api.github.com/repos/soshace/social-sharing-interface/commits', {
		// $.getJSON('https://api.github.com/repos/vitaliizhukov/bookshelf/commits', {
			access_token: localStorage.getItem('githubToken')
		}, function(data) {
			_data = data;
			console.log(_data);
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
		let template = '<span class="pull-left">';
		template += '<img class="media-object" src="{{avatar}}" alt="">';
		template += '</span>';

		template += '<div class="media-body">';
		template += '<h4 class="media-heading">{{commit.message}}</h4>';
		template += '<p>by {{name}}</p>';
		template += '<a href="{{html_url}}" target="_blank">View at github</a>';
		template += '<i class="text-muted pull-right">{{date}}</i>';
		template += '</div>';

		let compiledTemplate = Handlebars.compile(template);
		for (let item of _data) {
			item.name = item.author ? item.author.login : item.commit.author.email;
			item.avatar = item.author ? item.author.avatar_url : 'http://placehold.it/30x30';
			item.date = formatDateTime(item.commit.committer.date);
			item.view = compiledTemplate(item);
		}
	}

	function formatDateTime(dt) {
		let date = new Date(dt);
		return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
	};

})()