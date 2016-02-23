Template.services.events({
  'submit .user-info': function(event) {
    event.preventDefault();

    // get data
    var form = $('.user-info'),
        firstName = $('[name=first-name]').val(),
        lastName = $('[name=last-name]').val();

    console.log(lastName);
    Meteor.call('saveUserName', firstName, lastName, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log('ok');
        console.log(results);
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
