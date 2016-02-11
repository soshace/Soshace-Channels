Template.addResource.events({
  'submit form': function(event) {
    event.preventDefault();
    // get name from input
    var resourceName = event.target.resourceName.value;
    Resources.insert({
      name: resourceName,
      createdAt: new Date()
    });
    event.target.resourceName.value = '';
  }
});
