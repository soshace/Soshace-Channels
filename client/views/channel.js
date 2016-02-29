var _channelIsGuest = true,
  _deps = new Deps.Dependency(),
  _associatedEmails = [],
  _self;

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

  'click .channel__add-comment': function(event) {
    event.preventDefault();

    var channelId = _self.data._id,
      resourceBlockId = event.target.id,
      var userId = Meteor.userId(),
      // message = document.querySelector('.' + resourceBlockId).value;
      message = document.getElementsByClassName(resourceBlockId)[0].value;

    Meteor.call('addComment', message, channelId, resourceBlockId, userId, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log('Message added');
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

  associatedEmails: function() {
    _deps.depend();
    return _associatedEmails;
  },

  template: function() {
    return Template['githubTemplate'];
  }
});

Template.channel.onRendered(function() {
  if (!this._rendered) {
    this._rendered = true;
  }
  _self = this;
});

Template.channel.updateData = function(channelId) {
  let channel = Channels.findOne({
    _id: channelId
  });

  let resourceId = channel.serviceResource;
  _channelIsGuest = channel.createdBy !== Meteor.userId(); // Determine if current user is guest on this channel

  let token = Meteor.user().profile.services ? Meteor.user().profile.services.pass : '';
  if (_channelIsGuest) {
    let hostUser = Meteor.users.findOne({
      _id: channel.createdBy
    });
    token = hostUser.profile.services.pass;
  }

  Meteor.github = new GithubPlugin(token, resourceId, _channelIsGuest);
  Meteor.github.getRepoCommits();
  Meteor.github.getRepoContributors();

  window.addEventListener(Meteor.github.loadCompleteEventName, function(event) {
    if (event.detail.emails) { // If there are emails property in detail it menas that emails loaded event was initiated.
      _associatedEmails = event.detail.emails;
      _deps.changed();
    } else {
      var data = event.detail;
      loadComments(data, channelId);
      Session.set('channelFeed', event.detail);
    }
  });
}

var loadComments = function(data, channelId) {
  console.log('load comments');
  var messages = Channels.findOne({_id: channelId}).messages;
  for (var j = data.length - 1; j >= 0; j--) {
    data[j].messages = [];
    for (var i = messages.length - 1; i >= 0; i--) {
      if (messages[i].resourceBlockId === data[j].sha) {
        messages[i].dateTime = formatDateTime(messages[i].dateTime);
        messages[i].author = getAuthor(messages[i].author);
        data[j].messages.push(messages[i]);
      }
    };
  };
  console.log(data);
}

function formatDateTime(dt) {
  let date = new Date(dt);
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
};

function getAuthor(userId){
  return Meteor.user({_id: userId}).username;
}