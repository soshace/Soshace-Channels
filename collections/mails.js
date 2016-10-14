// 'Mails' collections and it's schema

Mails = new Mongo.Collection('mails');

var Schemas = {};

Schemas.Message = new SimpleSchema({
  uid: {
    type: Number,
    optional: true
  },
  messageId: {
    type: String,
    optional: true
  },
  subject: {
    type: String,
    optional: true
  },
  htmlBody: {
    type: String,
    optional: true
  },
  from: {
    type: String,
    optional: true
  },
  fromName: {
    type: String,
    optional: true
  },
  to: {
    type: String,
    optional: true
  },
  toName: {
    type: String,
    optional: true
  },
  date: {
    type: Number,
    optional: true
  },
  inReplyTo: {
    type: String,
    optional: true
  },
  plainText: {
    type: String,
    optional: true
  },
  fullHtml: {
    type: String,
    optional: true
  },
  htmlBody: {
    type: String,
    optional: true
  },
  compressedText: {
    type: String,
    optional: true
  },
  compressed: {
    type: Boolean,
    optional: true
  },
  attr: {
    type: Object,
    blackbox: true,
    optional: true
  }
});

Schemas.Folder = new SimpleSchema({
  name: {
    type: String
  },
  messages: {
    type: [Schemas.Message]
  }
});

Schemas.Mail = new SimpleSchema({
  channelId: {
    type: String
  },
  folders: {
    type: [Schemas.Folder]
  }
});

Mails.attachSchema(Schemas.Mail);
