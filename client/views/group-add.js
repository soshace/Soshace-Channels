Template.addGroup.events({
  'submit form': function(event) {
    event.preventDefault();
    // get name from input
    var groupName = event.target.groupName.value;
    Groups.insert({
      name: groupName,
      createdAt: new Date()
    });
    event.target.groupName.value = '';
  }
});
