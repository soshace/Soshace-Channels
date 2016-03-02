Template.invite.onCreated(function() {
  Template.instance().subscribe('invite', Router.current().params.token);
});

Template.invite.helpers({
  invitation: function() {
    var invite = Invitations.findOne();

    if (invite) {
      return invite;
    }
  }
});

Template.invite.onRendered(function(){
  //debugger;
  var validator = $('#accept-invitation').validate({
    submitHandler: function(event) {

      var emailVal = $('[name=email]').val(),
          usernameVal = $('[name=username]').val(),
          passwordVal = $('[name=password]').val(),
          contactsVal = $('#accept-invitation').dataset.channelId,
          channelVal = $('#accept-invitation').dataset.inviterId,
          options = {
            'emails[0].address': emailVal,
            'emails[0].verified': true,
            username: usernameVal,
            password: passwordVal,
            contacts: contactsVal,
            channels: channelVal
          };

      console.log(options);

      Accounts.createUser(options, function(error) {
       if (error) {
          // TODO: leave this check???
          if (error.reason == 'Email already exists.') {
            validator.showErrors({
              email: error.reason
            });
          }
          if (error.reason == 'Username already exists.') {
            validator.showErrors({
              username: error.reason
            });
          }
          if (error.reason == 'Username failed regular expression validation') {
            validator.showErrors({
              username: 'Please, enter correct username.'
            });
          }
        } else {
          var token = Router.current().params.token;

          Meteor.call('deleteInvitation', token, function(error, response) {
            if (error) {
              Bert.alert(error.reason, 'warning');
            } else {
              Meteor.loginWithPassword(options.email, options.password);
            }
          });
        }
      });


    }
  });
});

    //
    // var password = template.find( '[name="password"]' ).value;
    //
    // var user = {
    //   email: template.find( '[name="emailAddress"]' ).value,
    //   password: Accounts._hashPassword( password ),
    //   token: FlowRouter.current().params.token
    // };
    //
    // Meteor.call( 'acceptInvitation', user, function( error, response ) {
    //   if ( error ) {
    //     Bert.alert( error.reason, 'warning' );
    //   } else {
    //     Meteor.loginWithPassword( user.email, password );
    //   }
    // });
