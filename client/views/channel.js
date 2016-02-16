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

Template.channel.helpers({
  resources: function() {
    var currentUser = Meteor.userId(),
        channel = Channels.findOne({ _id: this._id }),
        resourcesIds = channel.resources;

    var selector = {
      _id: { $in: resourcesIds}
    };

    return Resources.find(selector);
  }
});
