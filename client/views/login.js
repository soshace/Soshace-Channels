// Login without validation & showind errors to user
Template.login.events({
  'submit form': function(event) {
    event.preventDefault();

    var email = $('[name=email]').val();
        password = $('[name=password]').val();

    Meteor.loginWithPassword(email, password, function(error) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        var currentRoute = Router.current().route.getName();
        if (currentRoute == 'login') {
          Router.go('channels');
        }
      }
    });
  }
});
