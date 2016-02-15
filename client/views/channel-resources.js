Meteor.subscribe('resources');

Template.channelResources.helpers({
  resources: function() {
    var currentUser = Meteor.userId();
    return Resources.find({ createdBy: currentUser}, {sort: {createdAt: -1}});
  }
});

Template.channelResources.events({
  'submit form': function(event) {
    event.preventDefault();

    // get current channel id
    var channelId = this._id;

    // get checked Resources
    var selectedResources = [];
    $('[name=resource]:checked').each(function() {
      selectedResources.push($(this).attr('id'));
    });

    console.log(selectedResources);
    console.log(channelId);
    // call function & handle errors
    Meteor.call('addNewResourceToChannel', selectedResources, channelId, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        console.log(results);
      }
    });

  }
});
