var _channelIsGuest = true,
  _deps = new Deps.Dependency(),
  _associatedEmails = [],
  _self,
  _selectedIndex = -1, // This is an index of a block that user choose to show detail information with comments 
  _data, // Array of loaded blocks
  _channelView, // Cached DOM elements
  _detailView, // Cached DOM elements
  _commentTextArea; // Cached DOM elements

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

  'click .channel-block__add-comment-button': function(event) {
    event.preventDefault();
    addComment(); 
  },

  'keyup .channel-block__add-comment-area': function(event) {
    event.preventDefault();

    if ((event.keyCode === 13) && (event.ctrlKey)) {
      addComment();
    }
  },

  'click .channel__show-details': function(event) {
    event.preventDefault();
    for (var i = _data.length - 1; i >= 0; i--) {
      if (_data[i].sha === event.target.id) { //Find index of data array element that will be shown detailed
        _selectedIndex = i;
        _deps.changed();
      }
    };
    _channelView.classList.add('hidden');
    _detailsView.classList.remove('hidden');
  },

  'click .channel__return': function(event) {
    event.preventDefault();
    _channelView.classList.remove('hidden');
    _detailsView.classList.add('hidden');
    _selectedIndex = -1;
    _deps.changed();
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
    _deps.depend();
    return _data;
  },

  associatedEmails: function() {
    _deps.depend();
    return _associatedEmails;
  },

  previewTemplate: function() {
    return Template['githubPreviewTemplate'];
  },

  detailsTemplate: function() {
    return Template['githubDetailsTemplate'];
  },

  selectedBlock: function() {
    _deps.depend();
    return _selectedIndex === -1 ? {} : _data[_selectedIndex];
  }
});

Template.channel.onRendered(function() {
  _self = this;
  _channelView = document.getElementsByClassName('channel__wrapper')[0];
  _detailsView = document.getElementsByClassName('channel__block-wrapper')[0];
  _commentTextArea = document.getElementsByClassName('channel-block__add-comment-area')[0];
});

Template.channel.updateData = function(channelId) {
  // _selectedIndex = -1;
  let channel = Channels.findOne({
    _id: channelId
  });

  let resourceId = channel.serviceResource;
  _channelIsGuest = channel.createdBy !== Meteor.userId(); // Determine if current user is guest on this channel

  let token = Meteor.user().profile.services ? Meteor.user().profile.services.pass : '';
  if (_channelIsGuest) { // if this channel is guest then we take hosts token for requests
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
      _data = event.detail;
      loadComments(_data, channelId);
    }
  });
}

function loadComments(data, channelId) {
  var messages = Channels.findOne({
    _id: channelId
  }).messages;

  for (var j = data.length - 1; j >= 0; j--) {
    data[j].messages = [];
    data[j].blockIndex = j;
    for (var i = messages.length - 1; i >= 0; i--) {
      if (messages[i].resourceBlockId === data[j].sha) {
        messages[i].dateTime = formatDateTime(messages[i].dateTime);
        messages[i].author = Meteor.users.findOne({
          _id: messages[i].author
        }).username;
        data[j].messages.push(messages[i]);
      }
    };
  };
  _deps.changed();
}

function formatDateTime(dt) {
  let date = new Date(dt);
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
};

function addComment(resourceBlockId) {
  var channelId = _self.data._id,
    userId = Meteor.userId(),
    message = _commentTextArea.value,
    resourceBlockId = _data[_selectedIndex].sha;

  if (message) {
    Meteor.call('addComment', message, channelId, resourceBlockId, userId, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log('Message added');
        _commentTextArea.value = '';
      }
    });
  }
}