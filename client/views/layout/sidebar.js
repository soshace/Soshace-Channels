// Meteor.subscribe('publicUserData');

Template.sidebar.helpers({
  channels: function() {
    var channels = Channels.find({
      createdBy: Meteor.userId()
    }, {
      sort: {
        createdAt: -1
      }
    }).fetch();

    _.each(channels, function(item) {
      item.icon = SERVICES[item.serviceType].icon;
    });

    return channels;
  },

  guestChannels: function() {
    var channels = Channels.find({
      members: Meteor.userId()
    }, {
      sort: {
        createdAt: -1
      }
    }).fetch();

    _.each(channels, function(item) {
      item.icon = SERVICES[item.serviceType].icon;
    });

    return channels;
  }
});