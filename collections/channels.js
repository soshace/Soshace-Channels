Channels = new Mongo.Collection('channels');

Channels.schema = new SimpleSchema({
  name: {type: String},
  createdAt: {type: Date},
  createdBy: {type: String},
  resources: {type: [String], optional: true}
});
