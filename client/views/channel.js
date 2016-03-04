var _deps = new Deps.Dependency(),
  _associatedEmails = [],
  _channelId, // This channel identificator
  _blocks, // Array of loaded blocks (commits, boards etc)
  _github,
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
          console.log(results);
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

  'click .channel__invite-unregistered': function(event, template) {
    var emailForInvite = this.email,
        channelId = template.data._id,
        channelCreatorId = Meteor.userId();

    // TODO: check with different function response
    // Meteor.call('sendInvitation', invitation, function(error, response) {
    //   if (error) {
    //     Bert.alert(error.reason, 'warning');
    //   } else {
    //     if (response === 'User already registered.') {
    //       Bert.alert('User with this email is already registered. He will recieve request for adding to your contacts and invite for current channel.', 'success');
    //     } else if (response === 'Invite already exist.') {
    //       Bert.alert('Invite to this email is already exist. You can revoke it and try again.', 'info');
    //     } else {
    //       // TODO: remove email from associated email list?
    //       Bert.alert('Invitation send to ' + emailForInvite + '.', 'success');
    //     }
    //   }
    // });
  },

  'click .channel__invite-registered': function(event, template) {
    // TODO: Handle inviting of registered user to channel
    console.log(event.target.id);
  },

  'click .channel__add-contact-to-channel': function(event, template) {
    Meteor.call('addMember', _channelId, event.target.id);
  },
});

Template.channel.helpers({
  contacts: function() {

    // Get current User contacts array
    var allContacts = Meteor.user().profile.contacts;
    var acceptedUsers = _.where(allContacts,{contactStatus:'accepted'});

    var selector = {
      _id: { $in: _.pluck(acceptedUsers, 'contactId')}
    };

    var options = {
      fields: {
        username: 1,
        _id: 1,
        emails: 1,
        'profile.firstName': 1,
        'profile.lastName': 1
      }
    };

    _contacts = Meteor.users.find(selector, options).fetch();
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
        emails: 1,
        'profile.firstName': 1,
        'profile.lastName': 1
      }
    };

    // Return channel members list
    _members = Meteor.users.find(selector, options).fetch();
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

  showEmails: function() {
    _deps.depend;
    return _userIsHost;
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

  _userIsHost = _channelData.createdBy === Meteor.userId(); // Determine if current user is guest on this channel

  var token = Meteor.user().profile.services ? Meteor.user().profile.services.pass : '';
  if (!_userIsHost) { // if this channel is guest then we take hosts token for requests
    var hostUser = Meteor.users.findOne({
      _id: _channelData.createdBy
    });
    token = hostUser.profile.services.pass;
  };

  if (!_github) {
    _github = new GithubPlugin();
  }
  _github.setParameters(token, _channelData.serviceResource, !_userIsHost, channelId);
  _github.getRepoCommits(getBlocksCallback, getEmailsCallback);
};

function getBlocksCallback(data, resourceId) {
  _blocks = data;
  _deps.changed();
};

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
    };
    if (_associatedEmails[i].emailType === 'member') continue;

    // Determine if this email is email of users contact who is not in channel yet
    for (var l = _contacts.length - 1; l >= 0; l--) {
      if (_associatedEmails[i].email === _contacts[l].emails[0].address) {
        _associatedEmails[i].emailType = 'contact';
        _associatedEmails[i].outputType = 'This is your contact, not in channel';
        _associatedEmails[i].userId = _contacts[l]._id;
        break;
      }
    };
    if (_associatedEmails[i].emailType === 'contact') continue;

    // Determine if this email is email of a registered user who is not in channel yet
    for (var k = allEmails.length - 1; k >= 0; k--) {
      if (_associatedEmails[i].email === allEmails[k].emails[0].address) {
        _associatedEmails[i].emailType = 'registered';
        _associatedEmails[i].outputType = 'This user is registered at SSI, not in your contacts';
        _associatedEmails[i].userId = allEmails[k]._id;
        break;
      }
    };
    if (_associatedEmails[i].emailType === 'registered') continue;

    _associatedEmails[i].emailType = 'unregistered';
    _associatedEmails[i].outputType = 'This email is not registered in SSI';
    _associatedEmails[i].userId = '';
  };
  _deps.changed();
};

Template.registerHelper('formatDateTime', function(dt) {
  let date = new Date(dt);
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
});

Template.registerHelper('equals', function(a, b) {
  return (a === b);
});
