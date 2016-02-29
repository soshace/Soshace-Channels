var _deps = new Deps.Dependency();
var _settingsTemplate = 'githubSettingsTemplate';

Template.addChannel.helpers({
  settingsData: function() {
    return Session.get('settingsData');
  },

  settingsTemplate: function() {
    _deps.depend();
    return Template[_settingsTemplate];
  }
});

Template.addChannel.events({
  'submit form': function(event) {
    event.preventDefault();
    localStorage.setItem('newChannelName', '');

    // Get name from input
    var channelName = Template.addChannel.newName.value;
    // Get type from select
    var channelType = Template.addChannel.typeSelector.value;
    // Get resource id. TODO: this selector is taken from github plugin. Should make it universal.
    var resourceId = document.querySelector('[name=resource-id]').value;

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

  'change [type=radio][name=service]': function(event) {
    event.preventDefault();

    Template.addChannel.typeSelector = document.querySelector('[name=service]:checked');

    switch (Template.addChannel.typeSelector.value) {
      case 'github':
        selectService('github');
        break;
      case 'trello':
        selectService('trello');
        break;
    }
  },

  'keyup #name-field': function(event) {
    event.preventDefault();
    localStorage.setItem('newChannelName', event.target.value); // Set channel name to session before sending request for further restoring.
  }
});

Template.addChannel.onRendered(function() {
  Template.addChannel.newName = document.querySelector('[name=name]');
  Template.addChannel.authDiv = document.querySelector('.auth-service');
  Template.addChannel.githubButton = document.querySelector('.channel-add__github-auth');
  Template.addChannel.trelloButton = document.querySelector('.channel-add__trello-auth');
  Template.addChannel.typeSelector = document.querySelector('[name=service]:checked');

  Template.addChannel.newName.value = localStorage.getItem('newChannelName') || '';

  // Default service is github
  selectService('github');

  if (Template.addChannel.serviceType === 'github') {
    var code = window.location.search.replace('?code=', '');
    // If we have code parameter in the url it means that github
    // redirected to this page to start authentication process.
    // Then post request sent to github to confirm authorization.
    if (code) {
      Meteor.call('postGithub', code, function(error, results) {
        var success = results.content.split('&')[0].split('=')[0] !== 'error';
        if (success) {
          var token = results.content.split('&')[0].split('=')[1];
          console.log(token);
          Meteor.call('addToken', 'github', token, function(error, results) {
            if (!error) {
              selectService('github');
            }
          });
        }
      });
    }
  }
});

function displayAuthButton(display) {
  if (display) {
    Template.addChannel.authDiv.classList.add('hidden');
  } else {
    Template.addChannel.authDiv.classList.remove('hidden');
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
  var userAuthenticated;

  Template.addChannel.serviceType = service;
  switch (service) {
    case 'github':
      // TODO: to check if user have pair github-token in data base.
      // At the moment token is saved to services field.
      userAuthenticated = Meteor.user().profile.services ? Meteor.user().profile.services.pass : false;
      _settingsTemplate = 'githubSettingsTemplate';
      if (userAuthenticated) {
        Meteor.github = new GithubPlugin(userAuthenticated);
        Meteor.github.getUserRepos(getDataforSettingsCallback);
      }
      else{
        Session.set('settingsData',[]);
      }
      Template.addChannel.githubButton.classList.remove('hidden');
      Template.addChannel.trelloButton.classList.add('hidden');
      break;
    case 'trello':
      userAuthenticated = false;
      _settingsTemplate = 'trelloSettingsTemplate';
      Template.addChannel.trelloButton.classList.remove('hidden');
      Template.addChannel.githubButton.classList.add('hidden');
      break;
  }
  displayAuthButton(userAuthenticated);
  _deps.changed();
}
