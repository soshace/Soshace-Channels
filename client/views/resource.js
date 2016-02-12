Template.resource.events({
  'click .resource__delete': function(event) {
    event.preventDefault();
    var documentId = this._id;
    var confirm = window.confirm('Delete ' + this.name + ' ?');
    if (confirm) {
      Resources.remove({_id: documentId});
      Router.go('resources');
    }
  }
});
