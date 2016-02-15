
Template.resourceList.helpers({
  resources: function() {
    var currentUser = Meteor.userId();
    return Resources.find({ createdBy: currentUser}, {sort: {createdAt: -1}});
  }
});
