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

      var token = Random.hexString( 16 );

      // TODO: !!!
      // check if email is already registered
      // then -> another logic

      // Making new invitation for collection
      var newInvite = {
        email: invitation.email,
        token: token,
        channelId: invitation.channelId,
        channelCreatorId: invitation.channelCreatorId,
        date: ( new Date() ).toISOString()
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
       Meteor.call('sendEmail', emailOptions, function(error) {
         if (error) {
           return error.reason;
         }
       });
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
