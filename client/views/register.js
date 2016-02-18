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
            passwordVal = $('[name=password]').val();
            options = {
              email: emailVal,
              password: passwordVal,
              contacts: []
            };

        Accounts.createUser(options, function(error) {
          if (error) {
            if (error.reason == 'Email already exists.') {
              validator.showErrors({
                email: error.reason
              });
            }
          } else {
            Router.go('channels');
          }
        });
      }
    });
});
