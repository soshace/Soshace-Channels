var deps = new Deps.Dependency(),
  plugin,
  singleBlock, // The content of this block shown in details at this page
  channelData;

Template.channelBlock.events({
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

  'click .channel__return': function(event) {
    event.preventDefault();
    Router.go('channel', {
      _id: channelData._id
    });
  }
});

Template.channelBlock.helpers({
  detailsTemplate: function() {
    return Template[channelData.serviceType + 'DetailsTemplate'];
  },

  selectedBlock: function() {
    deps.depend();
    return singleBlock;
  }
});

Template.channelBlock.onRendered(function() {
  _commentTextArea = document.getElementsByClassName('channel-block__add-comment-area')[0];
});

Template.channelBlock.updateData = function(channelId, blockId, structType) {
  channelData = Channels.findOne({
    _id: channelId
  });

  if (!channelData) {
    return;
  }

  var channelIsGuest = channelData.createdBy !== Meteor.userId(); // Determine if current user is guest on this channel

  var userTokens = Meteor.user().serviceTokens,
    channelToken = userTokens ? _.findWhere(userTokens, {
      serviceName: channelData.serviceType
    }) : '';

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

  plugin.setParameters(channelToken, channelData.serviceResource, channelIsGuest, channelData._id, structType);
  plugin.getSingleBlock(getSingleBlockCallback, blockId);
};

function getSingleBlockCallback(data) {
  singleBlock = data;
  loadComments();
  deps.changed();
};

function loadComments() {
  var messages = channelData.messages;

  singleBlock.messages = [];
  for (var i = messages.length - 1; i >= 0; i--) {
    if (messages[i].resourceBlockId === singleBlock.sha) {
      messages[i].author = Meteor.users.findOne({
        _id: messages[i].author
      }).username;
      singleBlock.messages.push(messages[i]);
    }
  }
};

function addComment(resourceBlockId) {
  var message = _commentTextArea.value;
  if (message) {
    console.log(channelData._id, singleBlock);
    Meteor.call('addComment', message, channelData._id, singleBlock.hash, Meteor.userId());
    _commentTextArea.value = '';
  }
};