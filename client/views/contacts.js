Template.contacts.events({
  'submit form': function(event) {
    event.preventDefault();

    var userToAdd = $('[name=login]').val();

    Meteor.call('requestContact', userToAdd, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        console.log(results);
        $('[name=login]').val('');
      }
    });
  },

  'click .contacts__accept-contact-request': function(event){
    event.preventDefault();
    acceptContact(event.target.id);
  }
});

Template.contacts.helpers({
  contacts: function() {
    var allContacts = Meteor.user().profile.contacts;
    var acceptedUsers = _.where(allContacts,{contactStatus:'accepted'});

    var selector = {
      _id: { $in: _.pluck(acceptedUsers, 'contactId')}
    };

    var options = {
      fields: {
        username: 1,
        _id: 1,
        'profile.firstName': 1,
        'profile.lastName': 1
      }
    };

    return {
      toShow: acceptedUsers,
      data: Meteor.users.find(selector, options)
    }
  },

  requestsFromUsers: function() {
    var allContacts = Meteor.user().profile.contacts;
    var requestsFromUsers = _.where(allContacts,{contactStatus:'sentRequest'});

    var selector = {
      _id: { $in: _.pluck(requestsFromUsers, 'contactId')}
    };

    var options = {
      fields: {
        username: 1,
        _id: 1,
        'profile.firstName': 1,
        'profile.lastName': 1
      }
    };

    return {
      toShow: requestsFromUsers,
      data: Meteor.users.find(selector, options)
    }
  },

  requestsToUsers: function() {
    var allContacts = Meteor.user().profile.contacts;
    var requestsToUsers = _.where(allContacts,{contactStatus:'wasRequested'});

    var selector = {
      _id: { $in: _.pluck(requestsToUsers, 'contactId')}
    };

    var options = {
      fields: {
        username: 1,
        _id: 1,
        'profile.firstName': 1,
        'profile.lastName': 1
      }
    };

    return {
      toShow: requestsToUsers,
      data: Meteor.users.find(selector, options)
    }
  }
});

function acceptContact(contactId){
  Meteor.call('acceptContact', contactId, function(error, results) {
    if (error) {
      console.log(error.reason);
    } else {
      console.log(results);
    }
  });  
}
