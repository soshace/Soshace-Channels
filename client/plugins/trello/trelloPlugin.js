(function() {
	let _boards = [],
		_loadCompleteEventName = 'trelloLoadComplete',
		_template = null;

	// Constructor
	this.TrelloPlugin = function() {
		// Next properties determin which trello features are to be displayed in our application
		// this.showBoards = null;
		// this.showLists = null;
		// this.showCards = null;
		// this.Trello = null;

		this.loadCompleteEventName = _loadCompleteEventName; // Name of the event which external SSI will listen to.

		var defaults = {
			// showBoards: true,
			// showLists: true,
			// showCards: true,
			// Trello: {}
		}

		if (arguments[0] && typeof arguments[0] === 'object') {
			this.options = extendDefaults(defaults, arguments[0]);
		}

		Trello.authorize({
			type: 'popup',
			name: 'Trello dashboard',
			scope: {
				read: true,
				write: false
			},
			expiration: 'never',
			success: function() {
				loadBoards();
			},
			error: function() {
				console.log('Failed auth');
			}
		});
	}

	// Public methods
	TrelloPlugin.prototype.getData = function() {
		console.log(_boards);
		return _boards;
	}

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

	function loadBoards() { //Load boards and then start loading lists for each board.
		Trello.get(
			'/members/me/boards/',
			function(result) {
				_boards = result;
				for (var i = _boards.length - 1; i >= 0; i--) {
					_boards[i].dateLastActivity = formatDateTime(_boards[i].dateLastActivity);
					loadLists(i);
				};
			},
			function() {
				console.log('Failed to load boards');
			}
		);
	}

	function loadLists(index) { // Load list and then start loading cards for each list.
		Trello.get(
			'/boards/' + _boards[index].id + '/lists',
			function(result) {
				_boards[index].lists = result;

				for (var i = result.length - 1; i >= 0; i--) {
					loadCards(index, i);
				};
			},
			function() {
				console.log('Failed to load list!');
			}
		);
	};

	function loadCards(boardIndex, listIndex) {
		Trello.get(
			'/lists/' + _boards[boardIndex].lists[listIndex].id + '/cards',
			function(result) {
				_boards[boardIndex].lists[listIndex].cards = result;
				_boards[boardIndex].lists[listIndex].filled = true;

				if (allListsAreFilled()) {
					runTemplating();
					var loadCompleteEvent = new CustomEvent(_loadCompleteEventName, {
						'detail': _boards
					});
					window.dispatchEvent(loadCompleteEvent);
				}
			},
			function() {
				console.log('Failed to load card!');
			}
		);
	};

	function allListsAreFilled() { // Temporary function to checkout if all the lists were filled with cards. Should try to find more propriate way.
		let res = true;
		for (let board of _boards) {
			for (let list of board.lists) {
				res = list.filled && res;
			}
		}
		return res;
	}

	function formatDateTime(dt) {
		let date = new Date(dt);
		return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
	};

	function includeTrelloScript() {
		var script = document.createElement('script');
		script.src = 'https://api.trello.com/1/client.js?key=8da4cfe50e2a4fad086ac03499cb1f8b';
		document.getElementsByTagName('head')[0].appendChild(script);
	}

	function runTemplating() {
		// $.get('/trelloItem.hbs', function(data) {
		// 	console.log(data);
		// 	if (Handlebars.templates === undefined) {
		// 		Handlebars.templates = {};
		// 	}
		// 	_template = Handlebars.compile(data);
		// 	for (let i = _boards.length - 1; i >= 0; i--) {
		// 		// _boards[i] = _template(_boards[i]);
		// 	};
		// });
		// var bone = '<li class="media media-sm"><span class="pull-left"><img class="media-object" src="http://placehold.it/30x30" alt=""></span><div class="media-body"><h4 class="media-heading">{{name}}</h4><a href="{{shortUrl}}">link</a>{{#each lists}}<div><p class="m-b-5">{{name}}</p><ul>{{#each cards}}<li>{{name}}</li>{{/each}}</ul></div>{{/each}}<i class="text-muted pull-right">{{dateLastActivity}}</i></div></li>';
		var bone = '<li>{{name}}</li>';
		// var _template = Handlebars.compile(bone);
		for (let i = _boards.length - 1; i >= 0; i--) {
			// _boards[i] = _template(_boards[i]);
		};
	}

})()