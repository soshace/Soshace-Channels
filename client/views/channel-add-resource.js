Meteor.subscribe('resources');

Template.channelAddResource.helpers({
  resources: function() {
    var currentUser = Meteor.userId();
    return Resources.find({ createdBy: currentUser}, {sort: {createdAt: -1}});
  }
});

Template.channelAddResource.events({
  'submit form': function(event) {
    event.preventDefault();

    // Get current channel id
    var channelId = this._id;
    // Find select
    var select = document.querySelector('[name=resource-to-add]');
    // Get value of a selected resource
    var selectedResource = select.options[select.selectedIndex].value;

    console.log('ID of a resource: ' + selectedResource);
    console.log('Channel ID: ' + channelId);

    // Сall function & handle errors
    Meteor.call('addNewResourceToChannel', selectedResource, channelId, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        console.log(results);
      }
    });

  }
});
