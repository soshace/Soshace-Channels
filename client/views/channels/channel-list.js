Template.channelList.helpers({
	channels: function() {
		var currentUser = Meteor.userId();

		return Channels.find({
			createdBy: currentUser
		}, {
			sort: {
				createdAt: -1
			}
		});
	},

	guestchannels: function() {
		var currentUser = Meteor.userId();

		return Channels.find({
			members: currentUser
		}, {
			sort: {
				createdAt: -1
			}
		});
	},

	channelHost: function(userId) {
		return Meteor.users.findOne(userId).username;
	}
});
