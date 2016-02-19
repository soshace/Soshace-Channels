Template.channel.events({
  'click .channel__delete': function(event) {
    event.preventDefault();

    // Get current channel id
    var channelId = this._id;

    var confirm = window.confirm('Delete ' + this.name + ' ?');

    if (confirm) {
      Meteor.call('removeChannel', channelId, function(error, results) {
        if (error) {
          console.log(error.reason);
        } else {
          console.log(results);
          Router.go('channels');
        }
      });
    }
  },

  'click .channel__add-member': function(event, template) {
    event.preventDefault();

    // Get current channel id.
    // Here we can't use 'this._id' for channelId
    // because of data context of contacts helper
    var channelId = template.data._id;

    // Take user id from link data attribute
    var userId = event.target.dataset.userid;

    Meteor.call('addMember', channelId, userId, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        console.log(results);
      }
    });
  }
});

Template.channel.helpers({
  contacts: function() {

    // Get current User contacts array
    var contactsArray = Meteor.user().profile.contacts;

    var selector = {
      _id: { $in: contactsArray }
    };

    var options = {
      fields: { username: 1, _id: 1 }
    };

    return Meteor.users.find(selector, options);
  },

  members: function() {
    // Get current channel id
    var channelId = this._id;

    var selector = {
      _id: channelId
    };

    var options = {
      fields: { members: 1 }
    };

    // Get array of channel members
    var membersArray = Channels.findOne(selector, options).members;

    selector = {
      _id: { $in: membersArray }
    };

    options = {
      fields: { username: 1 }
    };

    // Return channel members logins
    return Meteor.users.find(selector, options);

  }
});

// Template.channel.helpers({
//   resources: function() {
//     var currentUser = Meteor.userId(),
//         channel = Channels.findOne({ _id: this._id }),
//         resourcesIds = channel.resources;
//
//     var selector = {
//       _id: { $in: resourcesIds}
//     };
//
//     return Resources.find(selector);
//   }
// });
