Meteor.methods({
	'postGithub': function(code) {
		return Meteor.http.post('https://github.com/login/oauth/access_token', {
			params: {
				client_id: Meteor.settings.public.github_client_id,
				client_secret: Meteor.settings.private.github_client_secret,
				code: code
			}
		});
	},

	'getGithub': function(url) {
		var options = {
			headers: {
				'User-Agent':'node.js'
			}
		};
		return Meteor.http.get(url, options);
	}
});
