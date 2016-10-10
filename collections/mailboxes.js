// 'Mailboxes' collections and it's schema

Mailboxes = new Mongo.Collection('mailboxes');

var Schemas = {};

Schemas.CommonParams = new SimpleSchema({
  flags: {
    type: Array
  },
  keywords: {
    type: Array
  },
  messages: {
    type: Object
  },
  name: {
    type: String
  },
  newKeywords: {
    type: Boolean
  },
  nomodseq: {
    type: Boolean
  },
  permFlags: {
    type: Array
  },
  persistentUIDs: {
    type: Boolean
  },
  readOnly: {
    type: Boolean
  },
  uidnext: {
    type: Number
  },
  uidvalidity: {
    type: Number
  }
});

Schemas.ChannelMessage = new SimpleSchema({
  attr: {
    type: Object
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
    type: [Schemas.MailDialog]
  },
  commonParams: {
    type: Schemas.CommonParams
  }
});

Mailboxes.attachSchema(Schemas.Mail);
