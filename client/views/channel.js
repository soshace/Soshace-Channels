Template.channel.events({
  'click .channel__delete': function(event) {
    event.preventDefault();
    var documentId = this._id;
    var confirm = window.confirm('Delete ' + this.name + ' ?');
    if (confirm) {
      Meteor.call('removeChannel', documentId, function(error, results) {
        if (error) {
          console.log(error.reason);
        } else {
          Router.go('channels');
        }
      });
    }
  }
});
