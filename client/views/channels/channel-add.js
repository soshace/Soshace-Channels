var deps = new Deps.Dependency(),
  settingsData,
  newChannelName,
  authDiv,
  settingsDiv,
  selectedService = '',
  defaultChannelName = true,
  plugin;

Template.addChannel.helpers({
  settingsData: function() {
    deps.depend();
    return {
      settingsData: settingsData
    };
  },

  settingsTemplate: function() {
    deps.depend();
    if (plugin) {
      return Template[plugin.settingsTemplateName];
    }
    return null;
  },

  authTemplate: function() {
    deps.depend();
    if (plugin) {
      return Template[plugin.authTemplate];
    }
    return null;
  },

  selectedService: function() {
    deps.depend();
    return selectedService;
  },

  clientkey: function() {
    deps.depend();
    if (plugin) {
      return plugin.clientKey;
    }
    return null;
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

  'click .yandex': function(event) {
    event.preventDefault();
    selectService('yandex');
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
      var params = {};
      params.serviceName = selectedService;

      if (selectedService === 'github') {
        var success = results.statusCode === 200;
        if (!success) return;
        params.token = results.content.split('&')[0].split('=')[1];
      }

      if (selectedService === 'bitbucket' && !error) {
        if (results.statusCode !== 200) {
          return;
        }
        params.token = results.data.access_token;
        params.refreshToken = results.data.refresh_token;
      }

      if (selectedService === 'yandex' && !error) {
        if (results.statusCode !== 200) {
          return;
        }
        params.token = results.data.access_token;
      }

      Meteor.call('addToken', params, function(error, results) {
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
}

// This function is passed as ajax request callback to plugin
function getDataforSettingsCallback(data) {
  settingsData = data;
  deps.changed();
}

function selectService(service) {
  var currentUser = Meteor.user(),
    serviceData = _.findWhere(currentUser.serviceTokens, {
      serviceName: service
    });

  selectedService = service;
  localStorage.setItem('selectedService', service);
  newChannelName.val(service);
  switch (service) {
    case 'github':
      plugin = new GithubPlugin();
      break;
    case 'bitbucket':
      plugin = new BitbucketPlugin();
      break;
    case 'yandex':
      plugin = new YandexPlugin();
      break;
    case 'trello':
      break;
  }

  if (serviceData && serviceData.token) {
    plugin.setParameters(serviceData);
    plugin.getSettings(getDataforSettingsCallback);
    plugin.setDefaultChannelName(setDefaultName);
  }

  displayAuthButton(serviceData ? serviceData.token : false);
  $('.channel-add__step-1').addClass('hidden');
  $('.channel-add__step-2').removeClass('hidden');
  deps.changed();
}

function setDefaultName(val) {
  if (defaultChannelName) {
    newChannelName.val(val);
  }
}
