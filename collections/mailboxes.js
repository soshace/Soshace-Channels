// 'Mailboxes' collections and it's schema

Mailboxes = new Mongo.Collection('mailboxes');

var Schemas = {};

Schemas.ChannelMessage = new SimpleSchema({
  attr: {
    type: Object,
    blackbox: true
  },
  channelId: {
    type: String
  },
  class: {
    type: String
  },
  compressed: {
    type: Boolean
  },
  date: {
    type: Number
  },
  from: {
    type: String
  },
  fromName: {
    type: String
  },
  inReplyTo: {
    type: Boolean
  },
  messageId: {
    type: String
  },
  subject: {
    type: String
  },
  to: {
    type: String
  },
  toName: {
    type: String
  },
  uid: {
    type: Number
  }
});

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
    type: [Schemas.MailDialog],
    blackbox: true
  },
  commonParams: {
    type: Object,
    blackbox: true
  }
});

Mailboxes.attachSchema(Schemas.Mail);
