var _deps = new Deps.Dependency(),
  _settingsTemplate = 'githubSettingsTemplate',
  _authTemplate = 'githubAuthTemplate',
  _settingsData,
  _newName,
  _authDiv,
  _settingsDiv,
  _selectedService = '';

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
  },

  authTemplate: function() {
    _deps.depend();
    return Template[_authTemplate];
  },

  selectedService: function() {
    _deps.depend();
    return _selectedService;
  },

  clientkey: function(){
    return Meteor.settings.public.github_client_id;
  }
});

Template.addChannel.events({
  'click .github': function(event){
    event.preventDefault();
    selectService('github');
  },

  'click .trello': function(event){
    event.preventDefault();
    selectService('trello');
  },

  'keyup .channel-add__name-field': function(event) {
    event.preventDefault();
    document.getElementsByClassName('channel-add__button-create')[0].disabled = (event.target.value === '');
  },

  'click .channel-add__button-back': function(event) {
    document.getElementsByClassName('channel-add__step-1')[0].classList.remove('hidden');
    document.getElementsByClassName('channel-add__step-2')[0].classList.add('hidden');
  },

  'click .channel-add__button-create': function(event) {
    event.preventDefault();

    var channelName = _newName.value,
      resourceId = document.querySelector('[name=resource-id]').value; // Get resource id. TODO: this selector is taken from github plugin. Should make it universal.

    Meteor.call('createNewChannel', channelName, _selectedService, resourceId, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        Router.go('channel', {
          _id: results
        });
      }
    });
  }
});

Template.addChannel.onRendered(function() {
  _newName = $('.channel-add__name-field');
  _authDiv = $('.channel-add__auth-service');
  _settingsDiv = $('.channel-add__settings');

  var code = window.location.search.replace('?code=', '');
  // If we have code parameter in the url it means that github
  // redirected to this page to start authentication process.
  // Then post request sent to github to confirm authorization.
  // TODO: Bring authorization to separate page!
  if (code) {
    Meteor.call('postGithub', code, function(error, results) {
      var success = results.content.split('&')[0].split('=')[0] !== 'error';
      if (success) {
        var token = results.content.split('&')[0].split('=')[1];
        Meteor.call('addToken', 'github', token, function(error, results) {
          if (!error) {
            selectService('github');
          }
        });
      }
    });
  }
});

function displayAuthButton(display) {
  if (display) {
    _authDiv.addClass('hidden');
    _settingsDiv.removeClass('hidden');
  } else {
    _authDiv.removeClass('hidden');
    _settingsDiv.addClass('hidden');
  }
};

// This function is passed as ajax request callback to plugin
function getDataforSettingsCallback(data) {
  _settingsData = data;
  _deps.changed();
};

function selectService(service) {
  var userAuthenticated;

  _selectedService = service;
  switch (service) {
    case 'github':
      // TODO: to check if user have pair github-token in data base.
      // At the moment token is saved to services field.
      userAuthenticated = Meteor.user().profile.services ? Meteor.user().profile.services.pass : false;
      _settingsTemplate = 'githubSettingsTemplate';
      _authTemplate = 'githubAuthTemplate';
      if (userAuthenticated) {
        var github = new GithubPlugin();
        github.setParameters(userAuthenticated);
        github.getUserRepos(getDataforSettingsCallback);
      }
      break;
    case 'trello':
      userAuthenticated = false;
      _settingsTemplate = 'trelloSettingsTemplate';
      _authTemplate = 'trelloAuthTemplate';
      break;
  }
  displayAuthButton(userAuthenticated);
  $('.channel-add__step-1').addClass('hidden');
  $('.channel-add__step-2').removeClass('hidden');
  _deps.changed();
};
