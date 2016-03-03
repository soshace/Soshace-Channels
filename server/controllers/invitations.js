Meteor.methods({
  /**
   * Sending invite
   *
   */
  sendInvitation: function(invitation) {

    check(invitation, {
      email: String,
      channelId: String,
      channelCreatorId: String
    });

    try {
      var userToAdd = Accounts.findUserByEmail(invitation.email);
      // Variable for response to client
      var response;

      // Check if user with this email is already registered
      if (userToAdd) {
        Meteor.call('addContact', userToAdd.username);
        Meteor.call('addMember', invitation.channelId, invitation.channelCreatorId);
        response = 'User already registered.';
        return response;
      }

      // If there is no user with that email...
      // Check if there is same invite
      var options = {
        email: invitation.email,
        channelId: invitation.channelId,
        channelCreatorId: invitation.channelCreatorId
      };

      var inviteToFind = Invitations.findOne(options);
      if (inviteToFind) {
        response = 'Invite already exist.';
        return response;
      }

      // If no such invite create new invitation
      var token = Random.hexString(16);

      // Making new invitation for collection
      var newInvite = {
        email: invitation.email,
        token: token,
        channelId: invitation.channelId,
        channelCreatorId: invitation.channelCreatorId,
        date: (new Date()).toISOString()
      };

       // Insert new invitation to collection
       Invitations.insert( newInvite );

       // Prepare email options
       // TODO: add SSR.compileTemplate for email template
       var domain = 'localhost:3000', //TODO: taking domain from settings.json Meteor.settings.private.domain
           url = 'http://' + domain + '/invite/' + token;

       var emailOptions = {
          to: invitation.email,
          from: 'NoReply <testov.testin@yandex.ru>',
          subject: '[SoshaceChannels] Invite for you',
          text: 'Invite to Soshace Channels for ' + invitation.email + '. To accept invite and get your own account go to: \n\n' + url + '\n\nIf you do not accept this invite, please ignore this email. If you feel something is wrong, please contact our support team: ...'
        };

       // Sending email
       // TODO: check for errors?
       Meteor.call('sendEmail', emailOptions);
    } catch (exception) {
      return exception;
    }
  },

  /**
   * Deleting invite
   *
   */
  deleteInvitation: function(token) {
    var invitation = Invitations.findOne({ 'token': token });

    Invitations.remove({ '_id': invitation._id });
  }
  // TODO:
  /**
   * Revoke invite
   *
   */
  // revokeInvitation: function(inviteId) {
  //   check( inviteId, String );
  //
  //   try {
  //     Invitations.remove( inviteId );
  //   } catch( exception ) {
  //     return exception;
  //   }
  // }

});
