// Template.register.events({
//   'submit form': function(event) {
//     event.preventDefault();
//
//
//   }
// });

Template.register.onRendered(function(){
    $('.register__form').validate({
      submitHandler: function(event) {

        var email = event.target.email.value;
        var password = event.target.password.value;

        Accounts.createUser({
          email: email,
          password: password
        }, function(error) {
          if (error) {
            console.log(error.reason);
          } else {
            Router.go('settings');
          }
        });
        
      }
    });
});
