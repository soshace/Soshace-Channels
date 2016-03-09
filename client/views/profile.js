Template.profile.events({
  'submit .user-info': function(event) {
    event.preventDefault();

    // Get data
    var form = $('.user-info'),
        firstName = $('[name=first-name]').val(),
        lastName = $('[name=last-name]').val();

    Meteor.call('saveUserName', firstName, lastName, function(error, results) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        Bert.alert('Successfully changed.', 'success');
      }
    });
  },

  'click .resend-verification-link': function(event) {
    event.preventDefault();

    Meteor.call('sendVerificationLink', function(error, response) {
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

    Meteor.call('deleteAccount', function(error, response) {
      if (error) {
        // bert alert
        console.log(error.reason);
      } else {
        Router.go('register');
        // bert alert
        console.log(response);
      }
    });
  }
});

Template.profile.onRendered(function() {
  let code = window.location.search.replace('?code=', '');
  Meteor.call('postGithub',code,function(error,results){
    let success = results.content.split('&')[0].split('=')[0]!=='error';
    if (success){
      let token = results.content.split('&')[0].split('=')[1];
      localStorage.setItem('githubToken',token);
      console.log(token);
    }
  })
});
