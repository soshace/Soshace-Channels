var _deps = new Deps.Dependency(),
  _associatedEmails = [],
  _channelId, // This channel identificator
  _blocks, // Array of loaded blocks (commits, boards etc)
  plugin,
  _channelData,
  _members, // List of this channel members
  _userIsHost,
  _contacts; // Users contacts to determine who is not in channel yet

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
          Router.go('channels');
        }
      });
    }
  },

  'submit .channel__add-member': function(event) {
    event.preventDefault();

    // Find select
    var select = document.querySelector('[name=user-to-channel]');
    // Get id of a selected user
    var userId = select.options[select.selectedIndex].value;

    Meteor.call('addMember', _channelId, userId, function(error, results) {
      if (error) {
        console.log(error.reason);
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

  'click .channel__invite-unregistered': function(event, template) {
    var emailForInvite = this.email,
      channelId = template.data._id,
      channelCreatorId = Meteor.userId(),
      invitation = {
        email: emailForInvite,
        channelId: channelId,
        channelCreatorId: channelCreatorId
      };

    Meteor.call('sendInvitation', invitation, function(error, response) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        if (response === 'Invite already exist.') {
          Bert.alert('Invite to this email is already exist. You can revoke it and try again.', 'info');
        } else {
          // TODO: remove email from associated email list?
          Bert.alert('Invitation send to ' + emailForInvite + '.', 'success');
        }
      }
    });
  },

  'click .channel__invite-registered': function(event, template) {
    var userId = event.target.id,
      channelId = template.data._id,
      selector = {
        _id: userId
      },
      options = {
        fields: {
          username: 1,
        }
      };

    userToAdd = Meteor.users.findOne(selector, options);

    // Request from inviter to user
    Meteor.call('requestContact', userToAdd.username);
    // Add user to channel
    Meteor.call('addMember', channelId, userId);
  },

  'click .channel__add-contact-to-channel': function(event, template) {
    Meteor.call('addMember', _channelId, event.target.id);
  },
});

Template.channel.helpers({
  contacts: function() {

    // Get current User contacts array
    var allContacts = Meteor.user().profile.contacts;
    var acceptedUsers = _.where(allContacts, {
      contactStatus: 'accepted'
    });

    var selector = {
      _id: {
        $in: _.pluck(acceptedUsers, 'contactId')
      }
    };

    _contacts = Meteor.users.find(selector).fetch();
    return _contacts;
  },

  members: function() {
    var membersArray = Channels.find().fetch()[0].members || [];
    _members = Meteor.users.find({
      _id: {
        $in: membersArray
      }
    }).fetch();
    return _members;
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
    switch (_channelData.serviceType) {
      case 'github':
        return Template['githubPreviewTemplate'];
        break;
      case 'bitbucket':
        return Template['bitbucketPreviewTemplate'];
        break;
    }
  },

  userIsChannelCreator: function(parentContext) {
    // check if user is channel creator
    if (!parentContext) {
      return false;
    }
    var currentUser = Meteor.userId(),
      channelId = parentContext._id,
      selector = {
        _id: channelId
      },
      options = {
        fields: {
          createdBy: 1
        }
      },
      createdBy = Channels.findOne(selector, options).createdBy;
    return createdBy === currentUser;
  }
});

Template.channel.onRendered(function() {});

Template.channel.updateData = function(channelId) {
  _channelId = channelId;

  _channelData = Channels.findOne({
    _id: channelId
  });

  if (!_channelData) { // This fix is for avoiding removed channel updating
    return;
  }

  // Determine if current user is guest on this channel
  _userIsHost = _channelData.createdBy === Meteor.userId();

  var userTokens = Meteor.user().profile.serviceTokens,
    serviceData = userTokens ? _.findWhere(userTokens, {
      serviceName: _channelData.serviceType
    }) : '';

  if (!_userIsHost) { // if this channel is guest then we take hosts token for requests
    var hostUser = Meteor.users.findOne({
      _id: _channelData.createdBy
    });
    userTokens = hostUser.profile.serviceTokens;
    serviceData = userTokens ? _.findWhere(userTokens, {
      serviceName: _channelData.serviceType
    }) : '';
  }

  if (!serviceData || !serviceData.token) {
    return;
  }

  if (_channelData.serviceType === 'bitbucket') {
    plugin = new BitbucketPlugin();
  }
  if (_channelData.serviceType === 'github') {
    plugin = new GithubPlugin();
  }


  plugin.setParameters(serviceData, _channelData.serviceResource, !_userIsHost, channelId);
  plugin.getRepoCommits(getBlocksCallback, getEmailsCallback);
};

function getBlocksCallback(data, resourceId) {
  _blocks = data;
  _deps.changed();
}

function getEmailsCallback(data) {
  _associatedEmails = data;

  var allEmails = Meteor.users.find({}, {
    fields: {
      emails: 1,
      _id: 1
    }
  }).fetch();

  for (var i = _associatedEmails.length - 1; i >= 0; i--) {
    // Determine if one of associated emails is hosts
    if (Meteor.user().emails[0].address === _associatedEmails[i].email) {
      _associatedEmails[i].emailType = 'host';
      _associatedEmails[i].outputType = 'This is your email';
      continue;
    }

    // Determine if this email is email of a channel member already
    for (var j = _members.length - 1; j >= 0; j--) {
      if (_associatedEmails[i].email === _members[j].emails[0].address) {
        _associatedEmails[i].emailType = 'member';
        _associatedEmails[i].outputType = 'This user is member of this channel';
        _associatedEmails[i].userId = _members[j]._id;
        break;
      }
    }

    if (_associatedEmails[i].emailType === 'member') continue;

    // Determine if this email is email of users contact who is not in channel yet
    for (var l = _contacts.length - 1; l >= 0; l--) {
      if (_associatedEmails[i].email === _contacts[l].emails[0].address) {
        _associatedEmails[i].emailType = 'contact';
        _associatedEmails[i].outputType = 'This is your contact, not in channel';
        _associatedEmails[i].userId = _contacts[l]._id;
        break;
      }
    }

    if (_associatedEmails[i].emailType === 'contact') continue;

    // Determine if this email is email of a registered user who is not in channel yet
    for (var k = allEmails.length - 1; k >= 0; k--) {
      if (_associatedEmails[i].email === allEmails[k].emails[0].address) {
        _associatedEmails[i].emailType = 'registered';
        _associatedEmails[i].outputType = 'This user is registered at SSI, not in your contacts';
        _associatedEmails[i].userId = allEmails[k]._id;
        break;
      }
    }

    if (_associatedEmails[i].emailType === 'registered') continue;

    _associatedEmails[i].emailType = 'unregistered';
    _associatedEmails[i].outputType = 'This email is not registered in SSI';
    _associatedEmails[i].userId = '';
  }
  _deps.changed();
}

Template.registerHelper('formatDateTime', function(dt) {
  var date = new Date(dt);
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
});

Template.registerHelper('equals', function(a, b) {
  return (a === b);
});