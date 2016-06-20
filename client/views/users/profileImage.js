Template.profileImage.helpers({
  myFormData: function() {
    // this.what = 'lol';
    return { directoryName: 'images', user: Meteor.userId() }
  }
});

Template.profileImage.events({
  'click #deleteUserPic': function(event) {
    var userId = Meteor.userId();
    if (confirm('Are you sure?')) {
      Meteor.call('deleteFile', userId, true);
      Router.go('profile');
    }
  }
})
