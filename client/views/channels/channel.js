var deps = new Deps.Dependency(),
  blocks, // Array of loaded blocks (commits, boards etc)
  plugin,
  channelData,
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
  },

  channelCreator: function() {
    var creatorId = channelData.createdBy,
        creator = Meteor.users.findOne({
          _id: creatorId
        });
    Meteor.subscribe('publicUserData', [creatorId]);
    return creator;
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
