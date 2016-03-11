Template.profile.events({
  'submit .user-info': function(event) {
    event.preventDefault();

    // Get data
    var form = $('.user-info'),
        firstName = $('[name=first-name]').val(),
        lastName = $('[name=last-name]').val();

    Meteor.call('saveUserName', firstName, lastName, function(error) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        Bert.alert('Successfully changed.', 'success');
      }
    });
  },

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

    Meteor.call('deleteAccount', function(error) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        Router.go('register');
        Bert.alert('Your account was deleted.', 'success');
      }
    });
  },

  'click .sign-out-github': function(event) {
    event.preventDefault();

    Meteor.call('signOutGithub', function(error) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        Bert.alert('Github token was deleted.', 'success');
      }
    });
  }
});
