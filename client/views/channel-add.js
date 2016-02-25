Template.addChannel.helpers({
  settingsData: function() {
    return Session.get('settingsData');
  }
});

Template.addChannel.events({
  'submit form': function(event) {
    event.preventDefault();

    // Get name from input
    var channelName = document.querySelector('[name=name]').value;
    // Get type from select
    var channelType = document.querySelector('[name=type]').value;
    // Get resource id
    let resourceId = document.querySelector('[name=resource-id]').value;

    Meteor.call('createNewChannel', channelName, channelType, resourceId, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        Router.go('channel', {
          _id: results
        });
      }
    });
  },

  'change .channel-add__type': function(event) {
    event.preventDefault();

    var githubButton = document.querySelector('.channel-add__github-auth'),
      trelloButton = document.querySelector('.channel-add__trello-auth');

    switch (document.querySelector('[name=type]').value) {
      case 'github':
        selectService('github');
        githubButton.classList.remove('hidden');
        trelloButton.classList.add('hidden');
        break
      case 'trello':
        selectService('trello');
        trelloButton.classList.remove('hidden');
        githubButton.classList.add('hidden');
        break
    }
  }
});

Template.addChannel.onRendered(function() {
  // Default service is github
  selectService('github');

  if (Template.addChannel.serviceType === 'github') {
    let code = window.location.search.replace('?code=', '');
    // If we have code parameter in the url it means that github redirected to this page to start authentication process. Then post request sent to github to confirm authorization.
    if (code) {
      Meteor.call('postGithub', code, function(error, results) {
        let success = results.content.split('&')[0].split('=')[0] !== 'error';
        if (success) {
          let token = results.content.split('&')[0].split('=')[1];
          console.log(token);
          Meteor.call('addToken', 'github', token);
        }
      })
    }
  }
});

function displayAuthButton(display) {
  if (display) {
    document.querySelector('.auth-message').innerHtml = 'You have been successfully authorized on selected service.';
    document.querySelector('.auth-service').classList.add('hidden');
  } else {
    document.querySelector('.auth-service').classList.remove('hidden');
    document.querySelector('.auth-message').innerHtml = 'You need to login service:';
  }
}

// This function is passed as ajax request callback to plugin 
function getDataforSettingsCallback(data) {
  Session.set('settingsData', {
    settingsData: data
  });
  console.log(data);
}

function selectService(service) {
  let userAuthenticated;
  Template.addChannel.serviceType = service;
  switch (service) {
    case 'github':
      // TODO: to check if user have pair github-token in data base. At the moment token is saved to services field.
      userAuthenticated = Meteor.user().profile.services ? Meteor.user().profile.services.pass : false;
      if (userAuthenticated) {
        Meteor.github = new GithubPlugin(userAuthenticated);
        Meteor.github.getUserRepos(getDataforSettingsCallback);
      }
      break
    case 'trello':
      userAuthenticated = true;
      break
  }
  displayAuthButton(userAuthenticated);
}