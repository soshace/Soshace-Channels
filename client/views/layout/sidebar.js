Meteor.subscribe('publicUserData');
Meteor.subscribe('hostChannels');

Template.sidebar.helpers({
  channels: function() {
    var channels  = Channels.find({
      createdBy: Meteor.userId()
    }, {
      sort: {
        createdAt: -1
      }
    }).fetch();

    _.each(channels, function(item){
      item.icon = SERVICES[item.serviceType].icon;
    });

    return channels;
  },

  guestchannels: function() {
    var channels  = Channels.find({
      members: Meteor.userId()
    }, {
      sort: {
        createdAt: -1
      }
    }).fetch();

    _.each(channels, function(item){
      item.icon = SERVICES[item.serviceType].icon;
    });

    return channels;
  }
});