// 'Channels' collections and it's schema

Channels = new Mongo.Collection('channels');

var Schemas = {};

Schemas.ChannelMessage = new SimpleSchema({
  body: {
    type: String
  },
  dateTime: {
    type: Date
  },
  author: {
    type: String
  },
  resourceBlockId:{  // Id of the block this message connected with
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
  serviceResource: {
    type: String
  },
  messages: {
    type: [Schemas.ChannelMessage]
  }
});

Channels.attachSchema(Schemas.Channel);
