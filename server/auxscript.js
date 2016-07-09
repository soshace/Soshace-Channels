Meteor.startup(function(){
	console.log('------------RESTARTED-------------------')
	// var users = Meteor.users.find().fetch();
	// _.map(users, function(user){
	// 	var tokens = user.profile.serviceTokens;
	// 	if (!_.findWhere(tokens, {serviceName: 'github'}).token)
	// 	if (!user.profile.serviceTokens && user.profile.services){
	// 		Meteor.users.update({_id: user._id}, {
	// 			$set: {
	// 				'profile.serviceTokens': []
	// 			}
	// 		});
	// 		console.log('user tokens updated');
	// 	}
	// })
});