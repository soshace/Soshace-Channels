// 'Mailboxes' collections and it's schema

Mailboxes = new Mongo.Collection('mailboxes');

var Schemas = {};

Schemas.Mail = new SimpleSchema({
  userId: {
    type: String
  },
  channelId: {
    type: String
  },
  createdAt: {
    type: Date
  },
  dialogs: {
    type: [Object]
  }
});

Mailboxes.attachSchema(Schemas.Mail);
