// Template.login.events({
//   'submit form': function(event) {
//     event.preventDefault();
//
//
//   }
// });


// Template.login.onCreated(function(){
//     console.log("The 'login' template was just created.");
// });

Template.login.onRendered(function(){
    $('.login__form').validate({
      submitHandler: function(event) {

        var email = event.target.email.value;
        var password = event.target.password.value;

        Meteor.loginWithPassword(email, password, function(error) {
          if (error) {
            console.log(error.reason);
          } else {
            var currentRoute = Router.current().route.getName();
            if (currentRoute == 'login') {
              Router.go('flow');
            }
          }
        });

      }
    });
});

// Template.login.onDestroyed(function(){
//     console.log("The 'login' template was just destroyed.");
// });
