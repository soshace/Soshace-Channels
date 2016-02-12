Template.channelList.helpers({
  channels: function() {
    var currentUser = Meteor.userId();
    return Channels.find({ createdBy: currentUser }, {sort: {createdAt: -1}});
  }
});
