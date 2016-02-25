// Login without validation & showind errors to user
// Template.login.events({
//   'submit form': function(event) {
//     event.preventDefault();
//
//     var email = event.target.email.value;
//     var password = event.target.password.value;
//
//     Meteor.loginWithPassword(email, password, function(error) {
//       if (error) {
//         console.log(error.reason);
//       } else {
//         var currentRoute = Router.current().route.getName();
//         if (currentRoute == 'login') {
//           Router.go('flow');
//         }
//       }
//     });
//
//   }
// });

Template.login.onRendered(function(){
    var validator = $('form').validate({
      submitHandler: function(event) {

        var email = $('[name=email]').val();
        var password = $('[name=password]').val();

        Meteor.loginWithPassword(email, password, function(error) {
          if (error) {
            if (error.reason == 'User not found') {
              validator.showErrors({
                email: error.reason
              });
            }
            if (error.reason == 'Incorrect password') {
              validator.showErrors({
                password: error.reason
              });
            }
          } else {
            var currentRoute = Router.current().route.getName();
            if (currentRoute == 'login') {
              Router.go('channels');
            }
          }
        });

      }
    });
});

// Template.login.onCreated(function(){
//     console.log("The 'login' template was just created.");
// });

// Template.login.onDestroyed(function(){
//     console.log("The 'login' template was just destroyed.");
// });
