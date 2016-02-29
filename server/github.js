Meteor.methods({
	'postGithub': function(code) {
		return Meteor.http.post('https://github.com/login/oauth/access_token', {
			params: {
				client_id: '40ca9788c56b7ce7307f',
				client_secret: '937c9c19662d1f162f1ea5f199ce987ae3271475',
				// for service-selector
				// client_id: '09d1958439dfc04d8aa1',
				// client_secret: 'cd0e760229429deab5f6298bf82006c18019a681',
				code: code
			}
		});
	},

	'getGithub': function(url) {
		let options = {
			headers: {
				'User-Agent':'node.js'
			}
		}
		return Meteor.http.get(url, options);
	}
});
