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
        contactsVal = $('[name=email]').data('channel'),
        channelVal = $('[name=email]').data('inviter'),
        options = {
          email: emailVal,
          invited: true,
          username: usernameVal,
          password: passwordVal,
          contacts: [contactsVal], // TODO: fix for new collection
          channels: [channelVal] // TODO: fix for new collection
        },
        token = Router.current().params.token;

    Accounts.createUser(options, function(error, response) {
      if (error) {
        Bert.alert(error.reason);
      } else {
        // TODO: check adding to contacta & to channels
        Meteor.call('deleteInvitation', token);
        Router.go('profile');
      }
    });
  }
});
