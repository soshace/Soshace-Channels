Meteor.subscribe('channels');

Template.header.events({
  'click .logout': function(event) {
    event.preventDefault();
    Meteor.logout();
    Router.go('login');
  }
});

Template.header.helpers({
  channels: function() {
    var currentUser = Meteor.userId();

    return Channels.find({ createdBy: currentUser }, {sort: {createdAt: -1}});
  },
  guestchannels: function() {
    var currentUser = Meteor.userId();

    return Channels.find ({ members: currentUser }, {sort: {createdAt: -1}});
  }
});
