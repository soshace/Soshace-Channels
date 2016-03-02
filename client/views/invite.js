Template.invite.onCreated(function() {
  Template.instance().subscribe( 'invite', Router.current().params.token );
});

Template.invite.helpers({
  invitation: function() {
    var invite = Invitations.findOne();

    if (invite) {
      return invite;
    }
  }
});

Template.invite.events({
  'submit form': function( event, template ) {
    var validator = $('form').validate({
      submitHandler: function(event) {

        var emailVal = $('[name=email]').val(),
            usernameVal = $('[name=username]').val(),
            passwordVal = $('[name=password]').val(),
            options = {
              email: emailVal,
              username: usernameVal,
              password: passwordVal,
              // contacts: >>,
              // channels: >>
            };

        // Accounts.createUser(options, function(error) {
        //   if (error) {
        //     // ???
        //     if (error.reason == 'Email already exists.') {
        //       validator.showErrors({
        //         email: error.reason
        //       });
        //     }
        //     if (error.reason == 'Username already exists.') {
        //       validator.showErrors({
        //         username: error.reason
        //       });
        //     }
        //     if (error.reason == 'Username failed regular expression validation') {
        //       validator.showErrors({
        //         username: 'Please, enter correct username.'
        //       });
        //   }
        // });
      }
    });
    event.preventDefault();

    var password = template.find( '[name="password"]' ).value;

    var user = {
      email: template.find( '[name="emailAddress"]' ).value,
      password: Accounts._hashPassword( password ),
      token: FlowRouter.current().params.token
    };

    Meteor.call( 'acceptInvitation', user, function( error, response ) {
      if ( error ) {
        Bert.alert( error.reason, 'warning' );
      } else {
        Meteor.loginWithPassword( user.email, password );
      }
    });
  }
});
