Template.profile.events({
  'submit .user-info': function(event) {
    event.preventDefault();

    // Get data
    var form = $('.user-info'),
        userData = {
          firstName: $('[name=first-name]').val(),
          lastName: $('[name=last-name]').val(),
          gender: $('[name=gender]').val(),
          bday: $('[name=bday]').val(),
          phone: $('[name=phone]').val(),
          skype: $('[name=skype]').val(),
          country: $('[name=country]').val(),
          city: $('[name=city]').val()
        };

    Meteor.call('saveUserData', userData, function(error) {
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