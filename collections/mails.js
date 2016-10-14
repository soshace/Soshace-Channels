// 'Mails' collections and it's schema

Mails = new Mongo.Collection('mails');

var Schemas = {};

Schemas.Message = new SimpleSchema({
  messageId: {
    type: String
  },
  subject: {
    type: String
  },
  body: {
    type: String
  },
  from: {
    type: String
  },
  to: {
    type: String
  },
  date: {
    type: Date
  },
  additionalInfo: {
    type: Object,
    blackbox: true
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
