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

  'submit .channel__add-member': function(event) {
    event.preventDefault();

    // Get channel id
    var channelId = this._id;

    // Find select
    var select = document.querySelector('[name=user-to-channel]');
    // Get id of a selected user
    var userId = select.options[select.selectedIndex].value;

    Meteor.call('addMember', channelId, userId, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        console.log(results);
      }
    });
  },

  'click .channel__remove-member': function(event, template) {
    event.preventDefault();

    var channelId = template.data._id,
      userId = event.target.dataset.userid;

    Meteor.call('removeMember', channelId, userId, function(error, results) {
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
      _id: {
        $in: contactsArray
      }
    };

    var options = {
      fields: {
        username: 1,
        _id: 1,
        'profile.firstName': 1,
        'profile.lastName': 1
      }
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
      fields: {
        members: 1
      }
    };

    // Get array of channel members
    var membersArray = Channels.findOne(selector, options).members;

    selector = {
      _id: {
        $in: membersArray
      }
    };

    options = {
      fields: {
        username: 1,
        _id: 1,
        'profile.firstName': 1,
        'profile.lastName': 1
      }
    };

    // Return channel members logins
    return Meteor.users.find(selector, options);
  },

  channelFeed: function() {
    return Session.get('channelFeed');
  },

  template: function() {
    return Template['githubTemplate'];
  }
});

Template.channel.onCreated(function() {
  if (!this._rendered) {
    this._rendered = true;
  }
});

Template.channel.updateData = function(channelId){
  // Session.set('channelFeed', []);

  let resourceId = Channels.findOne({
    _id: channelId
  }).serviceResource;

  console.log(resourceId);
  Meteor.github = new GithubPlugin(Meteor.user().profile.services.pass, resourceId);
  Meteor.github.getRepoCommits();

  window.addEventListener(Meteor.github.loadCompleteEventName, function(event) {
    updateChannel(event.detail);
  });
}

function updateChannel(data) {
  let currentFeed = Session.get('channelFeed');
  currentFeed = (currentFeed) ? currentFeed.concat(data) : data;
  Session.set('channelFeed', currentFeed);
}

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