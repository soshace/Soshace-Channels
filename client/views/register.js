Template.register.events({
  'submit form': function(event) {
    event.preventDefault();

    var emailVal = $('[name=email]').val(),
        usernameVal = $('[name=username]').val(),
        passwordVal = $('[name=password]').val();
        options = {
          email: emailVal,
          username: usernameVal,
          password: passwordVal
        };

    Accounts.createUser(options, function(error) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        // TODO: check for errors for sendVerificationLink?
        Meteor.call('sendVerificationLink');
        Router.go('channels');
      }
    });
  }
});
