var deps = new Deps.Dependency(),
  associatedEmails = [],
  blocks, // Array of loaded blocks (commits, boards etc)
  plugin,
  channelData,
  channelMembers, // List of this channel members
  userIsHost,
  contacts; // Users contacts to determine who is not in channel yet

Template.channel.events({
  'click .channel__delete': function(event) {
    event.preventDefault();

    var confirm = window.confirm('Delete ' + this.name + ' ?');

    if (confirm) {
      Meteor.call('removeChannel', channelData._id, function(error, results) {
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

    Meteor.call('addMember', channelData._id, userId, function(error, results) {
      if (error) {
        console.log(error.reason);
      }
    });
  },

  'click .channel__remove-member': function(event, template) {
    event.preventDefault();

    var userId = event.target.dataset.userid;

    Meteor.call('removeMember', channelData._id, userId, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        console.log(results);
      }
    });
  },

  'click .channel__invite-unregistered': function(event, template) {
    var emailForInvite = this.email,
      channelCreatorId = Meteor.userId(),
      invitation = {
        email: emailForInvite,
        channelId: channelData._id,
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
    Meteor.call('addMember', channelData._id, userId);
  },

  'click .channel__add-contact-to-channel': function(event, template) {
    Meteor.call('addMember', channelData._id, event.target.id);
  },

  'click .previous-link': function(event, template) {
    plugin.setPreviousPage();
    plugin.getRepoCommits(getBlocksCallback, getEmailsCallback);
  },

  'click .next-link': function(event, template) {
    plugin.setNextPage();
    plugin.getRepoCommits(getBlocksCallback, getEmailsCallback);
  }
});

Template.channel.helpers({
  contacts: function() {
    var allContacts = Meteor.user().contacts;
    var acceptedUsers = _.where(allContacts, {
      contactStatus: 'accepted'
    });

    var selector = {
      _id: {
        $in: _.pluck(acceptedUsers, 'contactId')
      }
    };

    contacts = Meteor.users.find(selector).fetch();
    return contacts;
  },

  members: function() {
    var membersArray = Channels.findOne(channelData._id).members || [];
    channelMembers = Meteor.users.find({
      _id: {
        $in: membersArray
      }
    }).fetch();
    return channelMembers;
  },

  channelFeed: function() {
    deps.depend();
    return blocks;
  },

  paginationData: function() {
    deps.depend();
    return pagination;
  },

  emails: function() {
    deps.depend();
    return associatedEmails;
  },

  previewTemplate: function() {
    switch (channelData.serviceType) {
      case 'github':
        return Template['githubPreviewTemplate'];
        break;
      case 'bitbucket':
        return Template['bitbucketPreviewTemplate'];
        break;
      case 'yandex':
        return Template['yandexPreviewTemplate'];
        break;
    }
  },

  userIsChannelCreator: function() {
    deps.depend();
    return userIsHost;
  }
});

Template.channel.updateData = function(channelId) {
  if (channelData) {
    if (channelData._id === channelId) {
      return;
    }
  }

  channelData = Channels.findOne({
    _id: channelId
  });

  if (!channelData) { // This fix is for avoiding removed channel updating
    return;
  }

  userIsHost = channelData.createdBy === Meteor.userId();

  var serviceData = userIsHost ? _.findWhere(Meteor.user().serviceTokens, {
    serviceName: channelData.serviceType
  }) : {};

  switch (channelData.serviceType) {
    case 'github':
      plugin = new GithubPlugin();
      break;
    case 'bitbucket':
      plugin = new BitbucketPlugin();
      break;
    case 'yandex':
      plugin = new YandexPlugin();
      break;
  }

  plugin.setParameters(serviceData, channelData.serviceResource, !userIsHost, channelId);
  plugin.getRepoCommits(getBlocksCallback, getEmailsCallback);
};

function getBlocksCallback(data, resourceId) {
  blocks = data.blocks;
  deps.changed();
};

function getEmailsCallback(data) {};