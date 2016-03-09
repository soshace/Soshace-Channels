Meteor.subscribe('invites');

Template.channelInvites.helpers({
  hasInvitations: function() {
    var invitations = Invitations.find().count();
    return invitations < 1 ? false : true;
  },

  invitation: function() {
    var channelId = this._id,
        invitations = Invitations.find({ channelId: channelId });

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
          if (response === 'User already registered.') {
            Bert.alert('User with this email is already registered. He will recieve request for adding to your contacts and invite for current channel.', 'success');
          } else if (response === 'Invite already exist.') {
            Bert.alert('Invite to this email is already exist. You can revoke it and try again.', 'info');
          } else {
            $('[name=email]').val('');
            Bert.alert('Invitation send to ' + emailForInvite + '.', 'success');
          }
        }
      });
    } else {
      Bert.alert('Please, set an email', 'warning');
    }
  },
  
  'click .revoke-invite': function(event, template) {
    if (confirm('Are you sure? This is permanent.')) {
      Meteor.call('deleteInvitation', this.token, function(error, response) {
        if (error) {
          Bert.alert(error.reason, 'warning');
        } else {
          Bert.alert('Invitation revoked!', 'success');
        }
      });
    }
  }
});
