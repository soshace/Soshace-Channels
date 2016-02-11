Router.configure({
  layoutTemplate: 'main'
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

Router.route('/groups', {
  name: 'groups',
  template: 'groupList'
});

Router.route('/group/:_id', {
  name: 'group',
  template: 'group',
  data: function() {
    var currentGroup = this.params._id;
    var currentUser = Meteor.userId();
    return Groups.findOne({ _id: currentGroup, createdBy: currentUser });
  },
  onBeforeAction: function() {
    var currentUser = Meteor.userId();
    if (currentUser) {
      this.next();
    } else {
      this.render('login');
    }
  }
});

Router.route('/resources', {
  name: 'resources',
  template: 'resourceList'
});

Router.route('/resource/:_id', {
  name: 'resource',
  template: 'resource',
  data: function() {
    var currentResource = this.params._id;
    return Resources.findOne({ _id: currentResource});
  }
});

Router.route('/about', {
  template: 'about'
});
