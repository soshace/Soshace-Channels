Meteor.methods({
	'postCodeToService': function(code, service) {
		var url;
		if (service === 'github') {
			url = 'https://github.com/login/oauth/access_token';
		}
		if (service === 'bitbucket') {
			url = 'https://bitbucket.org/site/oauth2/access_token';
		}

		return Meteor.http.post(url, {
			params: {
				client_id: Meteor.settings.public[service + '_client_id'],
				client_secret: Meteor.settings.private[service + '_client_secret'],
				code: code,
				grant_type: 'authorization_code'
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
	},

	'getBitbucket': function(url) {
		var options = {
			headers: {
				'User-Agent':'node.js'
			}
		};
		return Meteor.http.get(url, options);
	}

});
