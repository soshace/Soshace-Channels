// Register without validation & showind errors to user
// Template.register.events({
//   'submit form': function(event) {
//     event.preventDefault();
//
//     var email = event.target.email.value;
//     var password = event.target.password.value;
//
//     Accounts.createUser({
//       email: email,
//       password: password
//     }, function(error) {
//       if (error) {
//         console.log(error.reason);
//       } else {
//         Router.go('settings');
//       }
//     });
//
//   }
// });

Template.register.onRendered(function(){
    var validator = $('form').validate({
      submitHandler: function(event) {

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
            if (error.reason == 'Email already exists.') {
              validator.showErrors({
                email: error.reason
              });
            }
            if (error.reason == 'Username already exists.') {
              validator.showErrors({
                username: error.reason
              });
            }
            if (error.reason == 'Username failed regular expression validation') {
              validator.showErrors({
                username: 'Please, enter correct username.'
              });
            }
          } else {
            Meteor.call('sendVerificationLink', function(error, response) {
              if (error) {
                console.log(error);
              }
            });
            Router.go('channels');
          }
        });
      }
    });
});
