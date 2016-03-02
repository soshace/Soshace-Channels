var _deps = new Deps.Dependency(),
  _settingsTemplate = 'githubSettingsTemplate',
  _settingsData,
  _newName,
  _authDiv,
  _githubButton,
  _trelloButton,
  _typeSelector;


Template.addChannel.helpers({
  settingsData: function() {
    _deps.depend();
    return {
      settingsData: _settingsData
    };
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
    var channelName = _newName.value;
    // Get type from select
    var channelType = _typeSelector.value;
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
    localStorage.setItem('newChannelName', event.target.value); // Set channel name to local storage before sending request for further restoring.
  }
});

Template.addChannel.onRendered(function() {
  _newName = document.querySelector('[name=name]');
  _authDiv = document.querySelector('.auth-service');
  _githubButton = document.querySelector('.channel-add__github-auth');
  _trelloButton = document.querySelector('.channel-add__trello-auth');
  _typeSelector = document.querySelector('[name=service]:checked');

  _newName.value = localStorage.getItem('newChannelName') || '';

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
    _authDiv.classList.add('hidden');
  } else {
    _authDiv.classList.remove('hidden');
  }
}

// This function is passed as ajax request callback to plugin
function getDataforSettingsCallback(data) {
  _settingsData = data;
  _deps.changed();
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
        var github = new GithubPlugin();
        github.setParameters(userAuthenticated);
        github.getUserRepos(getDataforSettingsCallback);
      }
      _githubButton.classList.remove('hidden');
      _trelloButton.classList.add('hidden');
      break;
    case 'trello':
      userAuthenticated = false;
      _settingsTemplate = 'trelloSettingsTemplate';
      _trelloButton.classList.remove('hidden');
      _githubButton.classList.add('hidden');
      break;
  }
  displayAuthButton(userAuthenticated);
  _deps.changed();
}