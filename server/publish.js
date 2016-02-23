Meteor.publish('channels', function() {
  var currentUser = this.userId;

  //return Channels.find({ createdBy: currentUser });
  return Channels.find({});
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

Meteor.publish('Meteor.users', function () {
  // var currentUser = this.userId;
  //
  // var selector = {
  //   _id: currentUser
  // };
  //
  // var options = {
  //   fields: { contacts: 1}
  // };
  return Meteor.users.find();
  //return Meteor.users.find(selector, options);
});
