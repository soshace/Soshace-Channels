Template.addChannel.events({
  'submit form': function(event) {
    event.preventDefault();
    
    // get name from input
    var channelName = $('[name=name]').val();

    Meteor.call('createNewChannel', channelName, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        Router.go('channel', { _id: results });
        $('[name=name]').val('');
      }
    });
  }
});
