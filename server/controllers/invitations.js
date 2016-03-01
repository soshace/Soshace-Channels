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

      var options= {
        email: invitation.email,
        token: Random.hexString( 16 ),
        channelId: invitation.channelId,
        channelCreatorId: invitation.channelCreatorId,
        date: ( new Date() ).toISOString()
      };

       // Insert new invitation
       Invitations.insert( options );

       // prepare email
       // TODO: add SSR.compileTemplate for email template

       var domain = Meteor.settings.private.domain,
           url = 'http://' + domain + '/invite/' + invitation.token,
           subject = '[SoshaceChannels] Invite for you',
           text = 'mail body',
           // TODO: determine this in mail.js?
           from = 'NoReply <testov.testin@yandex.ru>';
       // Sending email
       Meteor.call('sendEmail', invitation.email, subject, text, from, function(error, response) {
         if (error) {
           // ...
         } else {
           // ... 
         }
       });
    } catch (exception) {
      return exception;
    }
  },

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


// var invitation = function( options ) {
//   _insertInvitation( options );
//   var email = _prepareEmail( options.token );
//   _sendInvitation( options.email, email );
// };
//
// var _insertInvitation = function ( invite ) {
//   Invitations.insert( invite );
// };
//
// var _prepareEmail = function( token ) {
//   var domain = Meteor.settings.private.domain;
//   var url    = 'http://' + domain + '/invite/' + token;
//
//   SSR.compileTemplate( 'invitation', Assets.getText( 'email/templates/invitation.html' ) );
//   var html = SSR.render( 'invitation', { url: url } );
//
//   return html;
// };
//
// var _sendInvitation = function( email, content ) {
//   Email.send({
//     to: email,
//     from: "Jan Bananasmith <jan@banana.co>",
//     subject: "Invitation to Banana Co.",
//     html: content
//   });
// };
//
// Modules.server.sendInvitation = invitation;
