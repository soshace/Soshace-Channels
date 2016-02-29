Meteor.methods({
	'postGithub': function(code) {
		return Meteor.http.post('https://github.com/login/oauth/access_token', {
			params: {
				client_id: '09d1958439dfc04d8aa1',
				client_secret: 'cd0e760229429deab5f6298bf82006c18019a681',
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
