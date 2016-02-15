Meteor.publish('channels', function() {
  var currentUser = this.userId;
  return Channels.find({ createdBy: currentUser });
});

Meteor.publish('resources', function() {
  var currentUser = this.userId;
  return Resources.find({ createdBy: currentUser });
});
