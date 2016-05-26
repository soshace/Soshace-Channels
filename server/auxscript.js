Meteor.startup(function(){
	var users = Meteor.users.find().fetch();
	_.map(users, function(user){
		if (!user.profile.serviceTokens && user.profile.services){
			Meteor.users.update({_id: user._id}, {
				$set: {
					'profile.serviceTokens': [{
						serviceName: 'github',
						token: user.profile.services.token
					}]
				}
			});
			console.log('user tokens updated');
		}
	})
});