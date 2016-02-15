Template.addChannel.events({
  'submit form': function(event) {
    event.preventDefault();
    // get name from input
    var channelName = event.target.channelName.value;

    Meteor.call('createNewChannel', channelName, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        Router.go('channel', { _id: results });
        event.target.channelName.value = '';
      }
    });
  }
});
