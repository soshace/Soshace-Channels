var deps = new Deps.Dependency(),
  settingsTemplate = 'githubSettingsTemplate',
  authTemplate = 'githubAuthTemplate',
  clientKey = Meteor.settings.public.github_client_id,
  settingsData,
  newChannelName,
  authDiv,
  settingsDiv,
  selectedService = '',
  defaultChannelName = true,
  plugin,
  serviceData;

Template.addChannel.helpers({
  settingsData: function() {
    deps.depend();
    return {
      settingsData: settingsData
    };
  },

  settingsTemplate: function() {
    deps.depend();
    return Template[settingsTemplate];
  },

  authTemplate: function() {
    deps.depend();
    return Template[authTemplate];
  },

  selectedService: function() {
    deps.depend();
    return selectedService;
  },

  clientkey: function() {
    deps.depend();
    return clientKey;
  }
});

Template.addChannel.events({
  'click .github': function(event) {
    event.preventDefault();
    selectService('github');
  },

  'click .trello': function(event) {
    event.preventDefault();
    selectService('trello');
  },

  'click .bitbucket': function(event) {
    event.preventDefault();
    selectService('bitbucket');
  },

  'keyup .channel-add__name-field': function(event) {
    event.preventDefault();
    defaultChannelName = false;
    if (event.target.value === '') {
      defaultChannelName = true;
    }
    document.getElementsByClassName('channel-add__button-create')[0].disabled = (event.target.value === '');
  },

  'click .channel-add__button-back': function(event) {
    document.getElementsByClassName('channel-add__step-1')[0].classList.remove('hidden');
    document.getElementsByClassName('channel-add__step-2')[0].classList.add('hidden');
  },

  'click .channel-add__button-create': function(event) {
    event.preventDefault();

    var channelName = newChannelName.val(),
      resourceId = plugin.resourceId;

    Meteor.call('createNewChannel', channelName, selectedService, resourceId, function(error, results) {
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
  newChannelName = $('.channel-add__name-field');
  authDiv = $('.channel-add__auth-service');
  settingsDiv = $('.channel-add__settings');

  var code = window.location.search.replace('?code=', '');
  // If we have code parameter in the url it means that github or bitbucket
  // redirected to this page to start authentication process.
  // Then post request sent to github to confirm authorization.
  // TODO: Bring authorization to separate page!
  if (code) {
    selectedService = localStorage.getItem('selectedService');
    Meteor.call('postCodeToService', code, selectedService, function(error, results) {
      var token,
        refreshToken,
        serviceData;

      if (selectedService === 'github') {
        var success = results.content.split('&')[0].split('=')[0] !== 'error';
        if (!success) return;
        token = results.content.split('&')[0].split('=')[1];
      }

      if (selectedService === 'bitbucket' && !error) {
        var success = results.statusCode === 200;
        if (!success) return;
        token = results.data.access_token;
        refreshToken = results.data.refresh_token;
      }

      var serviceData = {
        serviceName: selectedService,
        token: token,
        refreshToken: refreshToken
      }

      Meteor.call('addToken', serviceData, function(error, results) {
        if (!error) {
          selectService(selectedService);
        }
      });
    });
  }
});

function displayAuthButton(display) {
  if (display) {
    authDiv.addClass('hidden');
    settingsDiv.removeClass('hidden');
  } else {
    authDiv.removeClass('hidden');
    settingsDiv.addClass('hidden');
  }
};

// This function is passed as ajax request callback to plugin
function getDataforSettingsCallback(data) {
  settingsData = data;
  deps.changed();
};

function selectService(service) {
  var currentUser = Meteor.user();

  serviceData = _.findWhere(currentUser.profile.serviceTokens, {
    serviceName: service
  });

  selectedService = service;
  localStorage.setItem('selectedService', service);

  newChannelName.val(service);
  switch (service) {
    case 'github':
      settingsTemplate = 'githubSettingsTemplate';
      authTemplate = 'githubAuthTemplate';
      clientKey = Meteor.settings.public.github_client_id;
      plugin = new GithubPlugin();

      if (serviceData.token) {
        plugin.setParameters(serviceData);
        plugin.getUserRepos(getDataforSettingsCallback);
        plugin.setDefaultChannelName(setDefaultName);
      }
      break;
    case 'bitbucket':
      settingsTemplate = 'bitbucketSettingsTemplate';
      authTemplate = 'bitbucketAuthTemplate';
      clientKey = Meteor.settings.public.bitbucket_client_id;
      plugin = new BitbucketPlugin();

      if (serviceData) {
        plugin.setParameters(serviceData);
        plugin.getUserRepos(getDataforSettingsCallback);
        plugin.setDefaultChannelName(setDefaultName);
      }
      break;
    case 'trello':
      userAuthenticated = false;
      settingsTemplate = 'trelloSettingsTemplate';
      authTemplate = 'trelloAuthTemplate';
      break;
  };
  displayAuthButton(serviceData.token);
  $('.channel-add__step-1').addClass('hidden');
  $('.channel-add__step-2').removeClass('hidden');
  deps.changed();
};

function setDefaultName(val) {
  if (defaultChannelName) {
    newChannelName.val(val);
  }
};