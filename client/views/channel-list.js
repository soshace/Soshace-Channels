Template.channelList.helpers({
  channels: function() {
    var currentUser = Meteor.userId();

    return Channels.find({ createdBy: currentUser }, {sort: {createdAt: -1}});
  }
});

Template.channelList.helpers({
  guestchannels: function() {
    var currentUser = Meteor.userId();

    return Channels.find ({ members: currentUser }, {sort: {createdAt: -1}});
  }
});
