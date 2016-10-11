// 'Maildialogs' collections and it's schema

Maildialogs = new Mongo.Collection('maildialogs');

var Schemas = {};

Schemas.MailDialogMessages = new SimpleSchema({
  allMessageIds: {
    type: Object,
    blackbox: true
  },
  dialogMessages: {
    type: [Object],
    blackbox: true
  },
  partnerAddress: {
    type: String
  }
});

Schemas.MailMessages = new SimpleSchema({
  userId: {
    type: String
  },
  channelId: {
    type: String
  },
  createdAt: {
    type: Date
  },
  dialogsContent: {
    type: [Schemas.MailDialogMessages],
    blackbox: true,
    optional: true
  }
});

Maildialogs.attachSchema(Schemas.MailMessages);
