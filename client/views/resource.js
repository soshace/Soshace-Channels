Template.resource.events({
  'click .delete-resource': function(event) {
    event.preventDefault();
    var documentId = this._id;
    var confirm = window.confirm('Delete ' + this.name + ' ?');
    if (confirm) {
      Resources.remove({_id: documentId});
      Router.go('resources');
    }
  }
});
