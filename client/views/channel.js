Template.channel.events({
  'click .channel__delete': function(event) {
    event.preventDefault();
    var documentId = this._id;
    var confirm = window.confirm('Delete ' + this.name + ' ?');
    if (confirm) {
      Channels.remove({_id: documentId});
      Router.go('channels');
    }
  }
});
