Template.group.events({
  'click .delete-group': function(event) {
    event.preventDefault();
    var documentId = this._id;
    var confirm = window.confirm('Delete ' + this.name + ' ?');
    if (confirm) {
      Groups.remove({_id: documentId});
      Router.go('groups');
    }
  }
});
