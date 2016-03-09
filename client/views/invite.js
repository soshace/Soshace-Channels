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

Template.invite.events({
  'submit form': function(event) {
    event.preventDefault();

    var emailVal = $('[name=email]').val(),
        usernameVal = $('[name=username]').val(),
        passwordVal = $('[name=password]').val(),
        contactsVal = $('[name=email]').data('inviter'),
        channelVal = $('[name=email]').data('channel'),
        options = {
          email: emailVal,
          invited: true,
          username: usernameVal,
          password: passwordVal,
          contacts: contactsVal
        },
        token = Router.current().params.token;

    Accounts.createUser(options, function(error, response) {
      if (error) {
        Bert.alert(error.reason);
      } else {
        Meteor.call('addMember', channelVal, Meteor.userId());
        Meteor.call('deleteInvitation', token);
        Router.go('profile');
      }
    });
  }
});
