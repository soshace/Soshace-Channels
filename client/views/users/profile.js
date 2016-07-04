Template.profile.events({
  'click .resend-verification-link': function(event) {
    event.preventDefault();

    Meteor.call('sendVerificationLink', function(error) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        var email = Meteor.user().emails[0].address;
        Bert.alert('Link send to ' + email, 'success');
      }
    });
  },

  'click .delete-user': function(event) {
    event.preventDefault();
    if (confirm('Are you sure?')) {
      Meteor.call('deleteAccount', function(error) {
        if (error) {
          Bert.alert(error.reason, 'warning');
        } else {
          Router.go('register');
          Bert.alert('Your account was deleted.', 'success');
        }
      });
    }
  },

  'click .sign-out-service': function(event) {
    event.preventDefault();

    Meteor.call('signOutService', event.target.id, function(error) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        Bert.alert('Service token was deleted.', 'success');
      }
    });
  }
});
