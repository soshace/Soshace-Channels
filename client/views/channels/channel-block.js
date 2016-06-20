var deps = new Deps.Dependency(),
  plugin,
  singleBlock = {}, // The content of this block shown in details at this page
  channelData,
  userIsHost,
  loading;

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
    singleBlock.userIsChannelCreator = userIsHost;
    return singleBlock;
  },

  contentLoaded: function() {
    deps.depend();
    return !loading;
  }
});

Template.channelBlock.onRendered(function() {
  _commentTextArea = document.getElementsByClassName('channel-block__add-comment-area')[0];
});

Template.channelBlock.updateData = function(channelId, blockId) {
  loading = true;
  channelData = Channels.findOne({
    _id: channelId
  });

  if (!channelData) {
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

  plugin.setParameters(serviceData, channelData.serviceResource, !userIsHost, channelData._id);
  plugin.getSingleBlock(getSingleBlockCallback, blockId);
};

function getSingleBlockCallback(data) {
  singleBlock = data;
  loadComments();
  loading = false;
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