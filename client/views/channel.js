var _deps = new Deps.Dependency(),
  _associatedEmails = [],
  _channelId, // This channel identificator
  _blocks, // Array of loaded blocks (commits, boards etc)
  _channelView, // Cached DOM elements
  _detailView, // Cached DOM elements
  _commentTextArea, // Cached DOM elements
  _github,
  _singleBlock = null; // This object contains data about resource unit (commit, board etc)

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
    for (var i = _blocks.length - 1; i >= 0; i--) {
      if (_blocks[i].sha === event.target.id) { //Find index of data array element that will be shown detailed
        _github.getSingleCommit(getSingleBlockCallback, _blocks[i].sha);
      }
    };
    _channelView.classList.add('hidden');
    _detailsView.classList.remove('hidden');
  },

  'click .channel__return': function(event) {
    event.preventDefault();
    _channelView.classList.remove('hidden');
    _detailsView.classList.add('hidden');
    _singleBlock = null;
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
    return _blocks;
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
    return _singleBlock;
  }
});

Template.channel.onRendered(function() {
  _channelView = document.getElementsByClassName('channel__wrapper')[0];
  _detailsView = document.getElementsByClassName('channel__block-wrapper')[0];
  _commentTextArea = document.getElementsByClassName('channel-block__add-comment-area')[0];
});

Template.channel.updateData = function(channelId, reset) {
  if (reset) { // This if block used to reset channel view to initial if user had changed channel manually. Have to use it cause Meteor.call method changes router.
    _singleBlock = null;
    if (_channelView && _detailsView) {
      _channelView.classList.remove('hidden');
      _detailsView.classList.add('hidden');
    }
  };

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

  if (_singleBlock){
    _github.getSingleCommit(getSingleBlockCallback, _singleBlock.sha);
  }
};

function getBlocksCallback(data, resourceId) {
  _blocks = data;
  _deps.changed();
};

function getEmailsCallback(data) {
  _associatedEmails = data;
  _deps.changed();
};

function getSingleBlockCallback(data) {
  _singleBlock = data;
  loadComments();
  _deps.changed();
};

function loadComments() {
  var messages = Channels.findOne({
    _id: _channelId
  }).messages;

  _singleBlock.messages = [];
  for (var i = messages.length - 1; i >= 0; i--) {
    if (messages[i].resourceBlockId === _singleBlock.sha) {
      messages[i].author = Meteor.users.findOne({
        _id: messages[i].author
      }).username;
      _singleBlock.messages.push(messages[i]);
    }
  };
};

function addComment(resourceBlockId) {
  var message = _commentTextArea.value;

  if (message) {
    Meteor.call('addComment', message, _channelId, _singleBlock.sha, Meteor.userId());
    _commentTextArea.value = '';
  }
};

Template.registerHelper('formatDateTime', function(dt) {
  let date = new Date(dt);
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
});