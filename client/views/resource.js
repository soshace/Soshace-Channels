Template.resource.events({
  'click .resource__delete': function(event) {
    event.preventDefault();
    var documentId = this._id;
    var confirm = window.confirm('Delete ' + this.name + ' ?');
    if (confirm) {
      Meteor.call('removeResource', documentId, function(error, results) {
        if (error) {
          console.log(error.reason);
        } else {
          Router.go('resources');
        }
      });
    }
  }
});
