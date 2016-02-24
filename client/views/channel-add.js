Template.addChannel.events({
  'submit form': function(event) {
    event.preventDefault();

    // Get name from input
    var channelName = document.querySelector('[name=name]').value;
    // Get type from select
    var channelType = document.querySelector('[name=type]').value;

    Meteor.call('createNewChannel', channelName, channelType, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        Router.go('channel', { _id: results });
      }
    });
  },

  'change .channel-add__type': function(event) {
    event.preventDefault();

    var githubButton = document.querySelector('.channel-add__github-auth'),
        trelloButton = document.querySelector('.channel-add__trello-auth'),
        channelType = document.querySelector('[name=type]').value;

    if (channelType === 'github') {
      githubButton.classList.remove('hidden');
      trelloButton.classList.add('hidden');
    } else if (channelType ==='trello') {
      trelloButton.classList.remove('hidden');
      githubButton.classList.add('hidden');
    }
  }
});
