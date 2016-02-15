Router.configure({
  layoutTemplate: 'main',
  loadingTemplate: 'loading'
});

Router.route('/', {
  name: 'flow',
  template: 'flow'
});

Router.route('/login', {
  template: 'login'
});

Router.route('/register', {
  template: 'register',
});

Router.route('/settings', {
  template: 'settings'
});

Router.route('/channels', {
  name: 'channels',
  template: 'channelList',
  waitOn: function() {
    return [ Meteor.subscribe('channels'), Meteor.subscribe('resources')];
  }
});

Router.route('/channel/:_id', {
  name: 'channel',
  template: 'channel',
  data: function() {
    var currentChannel = this.params._id;
    var currentUser = Meteor.userId();
    return Channels.findOne({ _id: currentChannel, createdBy: currentUser });
  },
  onBeforeAction: function() {
    var currentUser = Meteor.userId();
    if (currentUser) {
      this.next();
    } else {
      this.render('login');
    }
  },
  waitOn: function() {
    return [ Meteor.subscribe('channels'), Meteor.subscribe('resources')];
  }
});

Router.route('/channel/resources', {
  name: 'channel-resources',
  data: function() {
    var currentChannel = this.params._id;
    var currentUser = Meteor.userId();
    return Channels.findOne({ _id: currentChannel, createdBy: currentUser });
  }
});

Router.route('/resources', {
  name: 'resources',
  template: 'resourceList',
  waitOn: function() {
    return Meteor.subscribe('resources');
  }
});

Router.route('/resource/:_id', {
  name: 'resource',
  template: 'resource',
  data: function() {
    var currentResource = this.params._id;
    var currentUser = Meteor.userId();
    return Resources.findOne({ _id: currentResource, createdBy: currentUser });
  },
  waitOn: function() {
    return Meteor.subscribe('resources');
  }
});
