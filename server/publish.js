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
	});
});

// Meteor.publish('Meteor.users', function() {
// 	return Meteor.users.find();
// });

Meteor.publish(null, function() {
  return Meteor.users.find({
    _id: this.userId
  }, {
    fields: {
      personalData: 1,
      serviceTokens: 1,
      contacts: 1
    }
  });
});

Meteor.publish('publicUserData', function(userId) {
	return Meteor.users.find({
		_id: this.userId
	}, {
		fields: {
			'username': 1,
			'personalData.firstName': 1,
			'personalData.lastName': 1
		}
	});
});

Meteor.publish('privateUserData', function() {
	return Meteor.users.find({
		_id: this.userId
	});
});

Meteor.publish('userContacts', function() {
	var userContacts = _.pluck(Meteor.users.findOne(this.userId).contacts, 'contactId');
	return Meteor.users.find({
		_id: {
			$in: userContacts
		}
	}, {
		fields: {
			'username': 1,
			'emails': 1,
			'personalData.firstName': 1,
			'personalData.lastName': 1
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

Meteor.publish('guestChannelCreators', function() {
	var userGuestChannels = Channels.find({
		members: this.userId
	}).fetch();
	var guestChannelsCreators = _.pluck(userGuestChannels, 'createdBy');
	return Meteor.users.find({
		_id: {
			$in: guestChannelsCreators
		}
	}, {
		fields: {
			username: 1
		}
	});
});

Meteor.publish('items', function() {
  return Items.find();
});

Meteor.publish('uploads', function() {
  return Uploads.find();
})
