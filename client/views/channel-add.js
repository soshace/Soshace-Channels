Template.addChannel.events({
  'submit form': function(event) {
    event.preventDefault();
    // get name from input
    var channelName = event.target.channelName.value;
    var currentUser = Meteor.userId();
    Channels.insert({
      name: channelName,
      createdBy: currentUser,
      createdAt: new Date()
    }, function(error, results) {
      Router.go('channel', { _id: results });
    });
    event.target.channelName.value = '';
  }
});
