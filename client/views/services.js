Template.services.events({
  'submit .user-info': function(event) {
    event.preventDefault();

    // get data
    var form = $('.user-info'),
        firstName = $('[name=first-name]').val(),
        lastName = $('[name=last-name]').val();

    console.log(lastName);
    Meteor.call('saveUserName', firstName, lastName, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log('ok');
        console.log(results);
      }
    });
  },

  'click .trello-auth': function(event) {
    event.preventDefault();

    var authenticationSuccess = function() { console.log('Successful authentication'); },
        authenticationFailure = function() { console.log('Failed authentication'); };

    Trello.authorize({
      type: 'popup',
      name: 'SSI App',
      scope: {
        read: true,
        write: true },
      expiration: 'never',
      success: authenticationSuccess,
      error: authenticationFailure
    });
  }
});

Template.services.onRendered(function() {
  let code = window.location.search.replace('?code=', '');
  Meteor.call('postGithub',code,function(error,results){
    let success = results.content.split('&')[0].split('=')[0]!=='error';
    if (success){
      let token = results.content.split('&')[0].split('=')[1];
      Session.set('githubToken',token);
      console.log(token);
    }
  })
});