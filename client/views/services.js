Template.services.events({
  'submit form': function(event) {
    event.preventDefault();

    // get data from inputs
    var form = $('form'),
        trelloKey = $('[name=trello-key]').val(),
        trelloLogin = $('[name=trello-login]').val(),
        trelloPassword = $('[name=trello-password]').val(),
        trelloData = {
          apikey: trelloKey,
          login: trelloLogin,
          password: trelloPassword
        };

    console.log(trelloData);

    Meteor.call('saveTrelloData', trelloData, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log('ok');
        console.log(results);
        form[0].reset();
      }
    });
  },

  'click .trello-auth': function(event) {
    event.preventDefault();

    var authenticationSuccess = function() { console.log('Successful authentication'); },
        authenticationFailure = function() { console.log('Failed authentication'); };

    Trello.authorize({
      type: 'popup',
      name: 'SSI App',
      scope: {
        read: true,
        write: true },
      expiration: 'never',
      success: authenticationSuccess,
      error: authenticationFailure
    });
  }
});
