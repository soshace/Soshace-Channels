Template.channel.events({
  'click .delete-channel': function(event) {
    event.preventDefault();
    var documentId = this._id;
    var confirm = window.confirm('Delete ' + this.name + ' ?');
    if (confirm) {
      Channels.remove({_id: documentId});
      Router.go('channels');
    }
  }
});
