// 'Channels' collections and it's schema

Channels = new Mongo.Collection('channels');

var Schemas = {};

Schemas.ChannelMessages = new SimpleSchema({
  body: {
    type: String
  },
  date: {
    type: Date
  },
  author: {
    type: String
  }
});

Schemas.Channel = new SimpleSchema({
  name: {
    type: String
  },
  createdAt: {
    type: Date
  },
  createdBy: {
    type: String
  },
  resources: {
    type: [String],
    optional: true
  },
  members: {
    type: [String]
  },
  serviceType: {
    type: String
  },
  mesages: {
    type: Schemas.ChannelMessages,
    optional: true
  }
});

Channels.attachSchema(Schemas.Channel);
