Template.addGroup.events({
  'submit form': function(event) {
    event.preventDefault();
    // get name from input
    var groupName = event.target.groupName.value;
    var currentUser = Meteor.userId();
    Groups.insert({
      name: groupName,
      createdBy: currentUser,
      createdAt: new Date()
    }, function(error, results) {
      Router.go('group', { _id: results });
    });
    event.target.groupName.value = '';
  }
});
