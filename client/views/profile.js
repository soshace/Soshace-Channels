Template.profile.events({
  'submit .user-info': function(event) {
    event.preventDefault();

    // get data
    var form = $('.user-info'),
        firstName = $('[name=first-name]').val(),
        lastName = $('[name=last-name]').val(),
        serviceName = $('[name=service-name]').val(),
        servicePass = $('[name=service-pass]').val();

    Meteor.call('saveUserData', firstName, lastName, serviceName, servicePass, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log('ok');
        console.log(results);
      }
    });
  },

  // 'click .trello-auth': function(event) {
  //   event.preventDefault();
  //
  //   var authenticationSuccess = function() { console.log('Successful authentication'); },
  //       authenticationFailure = function() { console.log('Failed authentication'); };
  //
  //   Trello.authorize({
  //     type: 'popup',
  //     name: 'SSI App',
  //     scope: {
  //       read: true,
  //       write: true },
  //     expiration: 'never',
  //     success: authenticationSuccess,
  //     error: authenticationFailure
  //   });
  // },

  'click .resend-verification-link': function(event) {
    event.preventDefault();

    // add bert's alerts
    Meteor.call('sendVerificationLink', function(error, response) {
      if (error) {
        // add bert alert
        console.log(error);
      } else {
        var email = Meteor.user().emails[0].address;
        // add bert alert
        console.log('link send to ' + email);
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
