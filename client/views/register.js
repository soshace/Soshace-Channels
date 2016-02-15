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
    var validator = $('.register__form').validate({
      submitHandler: function(event) {

        var email = $('[name=email]').val();
        var password = $('[name=password]').val();

        Accounts.createUser({
          email: email,
          password: password
        }, function(error) {
          if (error) {
            if (error.reason == 'Email already exists.') {
              validator.showErrors({
                email: error.reason
              });
            }
          } else {
            Router.go('settings');
          }
        });

      }
    });
});
