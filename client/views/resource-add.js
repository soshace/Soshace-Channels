Template.addResource.events({
  'submit form': function(event) {
    event.preventDefault();
    // get name from input
    var resourceName = $('[name=name]').val();
    // var currentUser = Meteor.userId();

    Meteor.call('createNewResource', resourceName, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        Router.go('resource', { _id: results});
        $('[name=name]').val('');
      }
    });
  }
});
