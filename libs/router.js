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
  template: 'group-list'
});

Router.route('/about', {
  template: 'about'
});

Router.route('/group/:_id', {
  template: 'group',
  data: function() {
    var currentGroup = this.params._id;
    return Groups.findOne({ _id: currentGroup});
  }
});
