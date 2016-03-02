Meteor.publish('channels', function() {
  var currentUser = this.userId;
  return Channels.find({});
  //return Channels.find({ createdBy: currentUser });
});

Meteor.publish('Meteor.users', function () {
  return Meteor.users.find();
});

Meteor.publish('invites', function () {
  var currentUser = this.userId;
  return Invitations.find({ channelCreatorId: currentUser});
});

Meteor.publish('invite', function(token) {
  check(token, String);
  return Invitations.find( { 'token': token } );
});

// Meteor.publish('Meteor.users.trelloData', function () {
//   var currentUser = this.userId;
//
//   var selector = {
//     _id: currentUser
//   };
//
//   var options = {
//     fields: { trelloData: 1}
//   };
//
//   return Meteor.users.find(selector, options);
// });
