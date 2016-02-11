Template.addResource.events({
  'submit form': function(event) {
    event.preventDefault();
    // get name from input
    var resourceName = event.target.resourceName.value;
    Resources.insert({
      name: resourceName,
      createdAt: new Date()
    }, function(error, results) {
      Router.go('resource', { _id: results });
    });
    event.target.resourceName.value = '';
  }
});
