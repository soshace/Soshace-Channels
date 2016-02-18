Template.contacts.events({
  'submit form': function(event) {
    event.preventDefault();

    var userIdToAdd = $('[name=login]').val();
    //console.log(userEmailToAdd);
    Meteor.call('addContact', userIdToAdd, function(error, results) {

      if (error) {

        console.log('ne ok');
        console.log(error.reason);

      } else {

        console.log('ok');
        console.log(results);
        $('[name=login-field]').val('');

      }
    });
  }
});

Template.contacts.helpers({
  contacts: function() {
    var currentUserContacts = Meteor.user().contacts;

    var selector = {
      _id: { $in: currentUserContacts}
    };

    var options = {
      fields: { emails: 1}
    };
    console.log(Meteor.users.find(selector, options));

    return Meteor.users.find(selector, options);

      // Meteor.call('getContactsEmails', currentUserContacts, function(error, results) {
      //   if (error) {
      //     console.log(error.reason);
      //   } else {
      //     console.log(results);
      //   }
      // });
  }
});
