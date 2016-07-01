Invitations = new Mongo.Collection( 'invitations' );

Invitations.allow({
  insert: () => false,
  update: () => false,
  remove: () => false
});

Invitations.deny({
  insert: () => true,
  update: () => true,
  remove: () => true
});

var Schemas = {};

Schemas.Invitation = new SimpleSchema({
  email: {
    type: String,
    label: 'Email to send invitation to.'
  },

  token: {
    type: String,
    label: 'Invitation token.'
  },

  channelId: {
    type: String,
    label: 'Channel ID from which invite was sent.'
  },

  channelCreatorId: {
    type: String,
    label: 'ID of user who was sending invite.'
  },

  date: {
    type: String,
    label: 'Invitation Date'
  }
});

Invitations.attachSchema(Schemas.Invitation);
