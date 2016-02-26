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

Router.route('/profile', {
  template: 'profile',
  waitOn: function() {
    return [ Meteor.subscribe('channels'), Meteor.subscribe('Meteor.users')];
  }
});

Router.route('/contacts', {
  template: 'contacts',
  waitOn: function() {
    return [ Meteor.subscribe('Meteor.users') ];
  }
});

Router.route('/channels', {
  name: 'channels',
  template: 'channelList',
  waitOn: function() {
    return Meteor.subscribe('channels');
  }
});

Router.route('/addchannel', {
  template: 'addChannel',
  waitOn: function() {
    return [ Meteor.subscribe('channels'), Meteor.subscribe('Meteor.users')];
  }
});

Router.route('/channel/:_id', {
  name: 'channel',
  template: 'channel',
  data: function() {
    var currentChannel = this.params._id;
    var currentUser = Meteor.userId();
    return Channels.findOne({ _id: currentChannel });
  },
  onBeforeAction: function() {
    var currentUser = Meteor.userId();
    if (currentUser) {
      this.next();
      Template.channel.updateData(this.params._id);
    } else {
      this.render('login');
    }
  },
  waitOn: function() {
    return [ Meteor.subscribe('channels'), Meteor.subscribe('Meteor.users')];
  }
});

Router.route('/verify-email/:token', {
  name: 'verify-email',
  onBeforeAction: function() {
    var token = this.params.token;

    Accounts.verifyEmail(token, function(error) {
      if (error) {
        Router.go('profile');
        // bert alert
        console.log(error.reason);
      } else {
        Router.go('profile');
        // bert alert
        console.log('verified');
      }
    });
  }
});
