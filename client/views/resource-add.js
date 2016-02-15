Template.addResource.events({
  'submit form': function(event) {
    event.preventDefault();
    // get name from input
    var resourceName = event.target.resourceName.value;
    var currentUser = Meteor.userId();
    Resources.insert({
      name: resourceName,
      createdBy: currentUser,
      createdAt: new Date()
    }, function(error, results) {
      Router.go('resource', { _id: results });
    });
    event.target.resourceName.value = '';
  }
});
