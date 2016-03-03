var _deps = new Deps.Dependency(),
  _associatedEmails = [],
  _channelId, // This channel identificator
  _blocks, // Array of loaded blocks (commits, boards etc)
  _github;

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
  },
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
    _deps.depend();
    return _blocks;
  },

  associatedEmails: function() {
    _deps.depend();
    return _associatedEmails;
  },

  previewTemplate: function() {
    return Template['githubPreviewTemplate'];
  }
});

Template.channel.onRendered(function() {});

Template.channel.updateData = function(channelId, reset) {
  _channelId = channelId;

  var channel = Channels.findOne({
    _id: channelId
  });

  if (!channel) { // This fix is for avoiding removed channel updating
    return;
  }

  var channelIsGuest = channel.createdBy !== Meteor.userId(); // Determine if current user is guest on this channel

  var token = Meteor.user().profile.services ? Meteor.user().profile.services.pass : '';
  if (channelIsGuest) { // if this channel is guest then we take hosts token for requests
    var hostUser = Meteor.users.findOne({
      _id: channel.createdBy
    });
    token = hostUser.profile.services.pass;
  };

  if (!_github) {
    _github = new GithubPlugin();
  }
  _github.setParameters(token, channel.serviceResource, channelIsGuest, channelId);
  _github.getRepoCommits(getBlocksCallback, getEmailsCallback);
};

function getBlocksCallback(data, resourceId) {
  _blocks = data;
  _deps.changed();
};

function getEmailsCallback(data) {
  _associatedEmails = data;
  _deps.changed();
};

Template.registerHelper('formatDateTime', function(dt) {
  let date = new Date(dt);
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
});
