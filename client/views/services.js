Template.services.events({
  'submit form': function(event) {
    event.preventDefault();

    // get data from inputs
    var form = $('form'),
        trelloLogin = $('[name=trello-login]').val(),
        trelloPassword = $('[name=trello-password]').val(),
        trelloData = {
          login: trelloLogin,
          password: trelloPassword
        };

    console.log(trelloData);

    Meteor.call('saveTrelloData', trelloData, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log('ok');
        console.log(results);
        form[0].reset();
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