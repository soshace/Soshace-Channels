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

    if (passwordVal.length < 6) {
      Bert.alert('Password must be at least 6 characters.', 'warning');
    } else if (passwordVal.length > 15) {
      Bert.alert('Password cannot exceed 15 characters.', 'warning');
    } else {
      Accounts.createUser(options, function(error) {
        if (error) {
          Bert.alert(error.reason, 'warning');
        } else {
          // TODO: check for errors for sendVerificationLink?
          Meteor.call('sendVerificationLink', function(error) {
            if (error) {
              Router.go('profile');
              Bert.alert('We have a problem with sending you an email verification link. Check e-mail, please.', 'warning')
            } else {
              Router.go('channels');
              Bert.alert('Check your e-mail for verification link.', 'success');
            }
          });
        }
      });
    }
  }
});
