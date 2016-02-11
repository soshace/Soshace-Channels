Template.groupList.helpers({
  groups: function() {
    var currentUser = Meteor.userId();
    return Groups.find({ createdBy: currentUser }, {sort: {createdAt: -1}});
  }
});
