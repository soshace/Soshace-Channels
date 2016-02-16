Meteor.publish('channels', function() {
  var currentUser = this.userId;
  return Channels.find({ createdBy: currentUser });
});

Meteor.publish('resources', function() {
  var currentUser = this.userId;
  return Resources.find({ createdBy: currentUser });
});

Meteor.publish('Meteor.users.trelloData', function () {
  var currentUser = this.userId;

  var selector = {
    _id: currentUser
  };

  var options = {
    fields: { trelloData: 1}
  };

  return Meteor.users.find(selector, options);
});
