var _deps = new Deps.Dependency(),
  _plugin,
  _singleBlock, // The content of this block shown in details at this page
  _channelId,
  _blockId,
  channel;

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
      _id: _channelId
    });
  }
});

Template.channelBlock.helpers({
  detailsTemplate: function() {
    switch (channel.serviceType) {
      case 'github':
        return Template['githubDetailsTemplate'];
        break;
      case 'bitbucket':
        return Template['bitbucketDetailsTemplate'];
        break;
    }
  },

  selectedBlock: function() {
    _deps.depend();
    return _singleBlock;
  }
});

Template.channelBlock.onRendered(function() {
  _commentTextArea = document.getElementsByClassName('channel-block__add-comment-area')[0];

});

Template.channelBlock.updateData = function(channelId, blockId) {
  _channelId = channelId;
  _blockId = blockId;

  channel = Channels.findOne({
    _id: channelId
  });

  if (!channel) {
    return;
  }

  var channelIsGuest = channel.createdBy !== Meteor.userId(); // Determine if current user is guest on this channel

  var userTokens = Meteor.user().profile.serviceTokens,
      channelToken = userTokens ? _.findWhere(userTokens, {serviceName: channel.serviceType}) : '';

  if (channelIsGuest) { // if this channel is guest then we take hosts token for requests
    var hostUser = Meteor.users.findOne({
      _id: channel.createdBy
    });
    userTokens =  hostUser.profile.serviceTokens;
    channelToken = userTokens ? _.findWhere(userTokens, {serviceName: channel.serviceType}) : '';
  }

  switch (channel.serviceType) {
    case 'github':
      _plugin = new GithubPlugin();
      break;
    case 'bitbucket':
      _plugin = new BitbucketPlugin();
      break;
  }


  _plugin.setParameters(channelToken, channel.serviceResource, channelIsGuest, channelId);

  _plugin.getSingleBlock(getSingleBlockCallback, blockId);
};

function getSingleBlockCallback(data) {
  _singleBlock = data;
  loadComments();
  _deps.changed();
}

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
  }
}

function addComment(resourceBlockId) {
  var message = _commentTextArea.value;
  if (message) {
    Meteor.call('addComment', message, _channelId, _singleBlock.hash, Meteor.userId());
    _commentTextArea.value = '';
  }
}

Template.registerHelper('formatDateTime', function(dt) {
  let date = new Date(dt);
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
});
