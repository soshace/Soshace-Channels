Meteor.publish('hostChannels', function() {
	return Channels.find({
		createdBy: this.userId
	});
});

Meteor.publish('guestChannels', function() {
	return Channels.find({
		members: this.userId
	});
});

Meteor.publish('selectedChannel', function(channelId) {
	return Channels.find({
		_id: channelId
	})
})

// Meteor.publish('Meteor.users', function() {
// 	return Meteor.users.find();
// });

Meteor.publish('publicUserData', function(userId) {
	return Meteor.users.find({
		_id: userId
	}, {
		fields: {
			'username': 1,
		}
	});
});

Meteor.publish('privateUserData', function() {
	return Meteor.users.find({
		_id: this.userId
	});
});

Meteor.publish('userContacts', function() {
	var userContacts = _.pluck(Meteor.users.findOne(this.userId).profile.contacts, 'contactId');
	return Meteor.users.find({
		_id: {
			$in: userContacts
		}
	}, {
		fields: {
			'username': 1,
			'emails': 1,
			'profile.firstName': 1,
			'profile.lastName': 1
		}
	});
});

// Meteor.publish('allUsers', function() {
// 	return Meteor.users.find({}, {
// 		fields: {
// 			'username': 1
// 		}
// 	});
// });

Meteor.publish('userByEmail', function(emails) {
	return Meteor.users.find({
		$in: {
			'emails.0.address': emails
		}
	}, {
		fields: {
			'username': 1,
		}
	});
});

Meteor.publish('invites', function() {
	var currentUser = this.userId;
	return Invitations.find({
		channelCreatorId: currentUser
	});
});

Meteor.publish('invite', function(token) {
	check(token, String);
	return Invitations.find({
		'token': token
	});
});