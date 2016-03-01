Template.channelInvites.helpers({
  hasInvitations: function() {
    var invitations = Invitations.find().count();
    return invitations < 1 ? false : true;
  },

  invitations: function() {
    var invitations = Invitations.find();

    if ( invitations ) {
      return invitations;
    }
  }
});

Template.channelInvites.events({
  'submit form': function(event) {
    event.preventDefault();

    var emailForInvite = $('[name=email]').val(),
        channelId = this._id,
        channelCreatorId = Meteor.userId();

    var invitation = {
      email: emailForInvite,
      channelId: channelId,
      channelCreatorId: channelCreatorId
    };

    if (emailForInvite && channelId && channelCreatorId !== '') {
      Meteor.call('sendInvitation', invitation, function(error, response) {
        if (error) {
          Bert.alert(error.reason, 'warning');
        } else {
          $('[name=email]').val('');
          Bert.alert('Invitation send to ' + emailForInvite + '.', 'success');
        }
      });
    } else {
      Bert.alert('Please, set an email', 'warning');
    }
  },
  // fore REVOKE invite
  //   'click .revoke-invite': function( event, template ) {
  //     if ( confirm( "Are you sure? This is permanent." ) ) {
  //       Meteor.call( "revokeInvitation", this._id, function( error, response ) {
  //         if ( error ) {
  //           Bert.alert( error.reason, "warning" );
  //         } else {
  //           Bert.alert( "Invitation revoked!", "success" );
  //         }
  //       });
  //     }
  //   }
});
