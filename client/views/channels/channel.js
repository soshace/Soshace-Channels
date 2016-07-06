var deps = new Deps.Dependency(),
  // associatedEmails = [],
  blocks, // Array of loaded blocks (commits, boards etc)
  plugin,
  channelData,
  // channelMembers, // List of this channel members
  // contacts, // Users contacts to determine who is not in channel yet
  loading = true;

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
    var parameter = $('.channel__member-input').val();

    // var select = document.querySelector('[name=user-to-channel]');
    // var userId = select.options[select.selectedIndex].value;
    Meteor.call('addMemberByParam', channelData._id, parameter, function(error, results) {
      if (error) {
        if (error.reason === ERRORS.userNotFound) {
          Bert.alert(ERRORS.userNotFound, 'warning');
        }
      }
    });
  },

  'click .channel__remove-member': function(event, template) {
    event.preventDefault();

    var userId = event.target.dataset.userid;

    Meteor.call('removeMember', channelData._id, userId, function(error, results) {
      if (error) {
        console.log(error);
      }
    });
  },

  // 'click .channel__invite-unregistered': function(event, template) {
  //   var emailForInvite = this.email,
  //     channelCreatorId = Meteor.userId(),
  //     invitation = {
  //       email: emailForInvite,
  //       channelId: channelData._id,
  //       channelCreatorId: channelCreatorId
  //     };

  //   Meteor.call('sendInvitation', invitation, function(error, response) {
  //     if (error) {
  //       Bert.alert(error.reason, 'warning');
  //     } else {
  //       if (response === 'Invite already exist.') {
  //         Bert.alert('Invite to this email is already exist. You can revoke it and try again.', 'info');
  //       } else {
  //         // TODO: remove email from associated email list?
  //         Bert.alert('Invitation send to ' + emailForInvite + '.', 'success');
  //       }
  //     }
  //   });
  // },

  // 'click .channel__invite-registered': function(event, template) {
  //   var userId = event.target.id,
  //     selector = {
  //       _id: userId
  //     },
  //     options = {
  //       fields: {
  //         username: 1,
  //       }
  //     };

  //   userToAdd = Meteor.users.findOne(selector, options);

  //   // Request from inviter to user
  //   Meteor.call('requestContact', userToAdd.username);
  //   // Add user to channel
  //   Meteor.call('addMember', channelData._id, userId);
  // },

  // 'click .channel__add-contact-to-channel': function(event, template) {
  //   Meteor.call('addMember', channelData._id, event.target.id);
  // },

  'click .previous-link': function(event, template) {
    loading = true;
    deps.changed();
    plugin.setPreviousPage();
    plugin.getChannelBlocks(getBlocksCallback);
  },

  'click .next-link': function(event, template) {
    loading = true;
    deps.changed();
    plugin.setNextPage();
    plugin.getChannelBlocks(getBlocksCallback);
  }
});

Template.channel.helpers({
  // contacts: function() {
  //   var allContacts = Meteor.user().contacts;
  //   var acceptedUsers = _.where(allContacts, {
  //     contactStatus: 'accepted'
  //   });

  //   var selector = {
  //     _id: {
  //       $in: _.pluck(acceptedUsers, 'contactId')
  //     }
  //   };

  //   contacts = Meteor.users.find(selector).fetch();
  //   return contacts;
  // },

  members: function() {
    var memberIds = Channels.findOne(channelData._id).members || [];
    Meteor.subscribe('publicUserData', memberIds);

    var channelMembers = Meteor.users.find({
      _id: {
        $in: memberIds
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
    loading = true;
    return pagination;
  },

  // emails: function() {
  //   deps.depend();
  //   return associatedEmails;
  // },

  previewTemplate: function() {
    deps.depend();
    return Template[plugin.previewTemplateName];
  },

  userIsChannelCreator: function() {
    deps.depend();
    return channelData.userIsHost;
  },

  contentLoaded: function() {
    deps.depend();
    return !loading;
  }
});

Template.channel.updateData = function(channelId) {
  loading = true;

  channelData = Channels.findOne({
    _id: channelId
  });

  if (!channelData) {
    return;
  }

  channelData.userIsHost = channelData.createdBy === Meteor.userId();

  if (!plugin || (channelData._id !== plugin.channelId)) {
    switch (channelData.serviceType) {
      case 'github':
        plugin = new GithubPlugin(channelData);
        break;
      case 'bitbucket':
        plugin = new BitbucketPlugin(channelData);
        break;
      case 'yandex':
        plugin = new YandexPlugin(channelData);
        break;
    }
  }
  plugin.getChannelBlocks(getBlocksCallback);
};

function getBlocksCallback(data, resourceId) {
  blocks = data.blocks;
  loading = false;
  deps.changed();
};

// function getEmailsCallback(data) {};