Template.contacts.events({
  'submit form': function(event) {
    event.preventDefault();

    var userToAdd = $('[name=login]').val();

    Meteor.call('addContact', userToAdd, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        console.log(results);
        $('[name=login]').val('');
      }
    });
  }
});

Template.contacts.helpers({
  contacts: function() {
    var currentUserContacts = Meteor.user().profile.contacts;

    var selector = {
      _id: { $in: currentUserContacts}
    };

    var options = {
      fields: {
        username: 1,
        'profile.firstName': 1,
        'profile.lastName': 1,
      }
    };

    return Meteor.users.find(selector, options);
  }
});
