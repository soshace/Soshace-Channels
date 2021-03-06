var options = {
  fields: {
    username: 1,
    _id: 1,
    'personalData.firstName': 1,
    'personalData.lastName': 1
  }
};

Template.contacts.events({
  'submit form': function(event) {
    event.preventDefault();

    var userToAdd = $('[name=login]').val();

    Meteor.call('requestContact', userToAdd, function(error) {
      if (error) {
        Bert.alert('No user with such username.', 'danger');
      } else {
        Bert.alert('Request has been sent.', 'success');
        $('[name=login]').val('');
      }
    });
  },

  'click .contacts__accept-contact-request': function(event){
    event.preventDefault();
    acceptContact(event.target.id);
  },

  'click .contacts__reject-contact-request': function(event){
    event.preventDefault();
    rejectContact(event.target.id);
  },

  'click .contacts__remove-contact': function(event){
    event.preventDefault();
    rejectContact(event.target.id);
  },

  'click .contacts__cancel-contact-request': function(event) {
    event.preventDefault();
    rejectContact(event.target.id);
  },
});

Template.contacts.helpers({
  contacts: function() {
    var allContacts = Meteor.user().contacts;
    var acceptedUsers = _.where(allContacts,{contactStatus:'accepted'});

    var selector = {
      _id: { $in: _.pluck(acceptedUsers, 'contactId')}
    };

    return {
      toShow: acceptedUsers,
      data: Meteor.users.find(selector, options)
    };
  },

  requestsFromUsers: function() {
    var allContacts = Meteor.user().contacts;
    var requestsFromUsers = _.where(allContacts,{contactStatus:'sentRequest'});

    var selector = {
      _id: { $in: _.pluck(requestsFromUsers, 'contactId')}
    };

    return {
      toShow: requestsFromUsers,
      data: Meteor.users.find(selector, options)
    };
  },

  requestsToUsers: function() {
    var allContacts = Meteor.user().contacts;
    var requestsToUsers = _.where(allContacts,{contactStatus:'wasRequested'});

    var selector = {
      _id: { $in: _.pluck(requestsToUsers, 'contactId')}
    };

    return {
      toShow: requestsToUsers,
      data: Meteor.users.find(selector, options)
    };
  },

  rejectedUsers: function() {
    var allContacts = Meteor.user().contacts;
    var rejectedUsers = _.where(allContacts,{contactStatus:'rejected'});

    var selector = {
      _id: { $in: _.pluck(rejectedUsers, 'contactId')}
    };

    return {
      toShow: rejectedUsers,
      data: Meteor.users.find(selector, options)
    };
  }

});

function acceptContact(contactId){
  Meteor.call('acceptContact', contactId, function(error, results) {
    if (error) {
      console.log(error.reason);
    }
  });
}

function rejectContact(contactId){
  Meteor.call('rejectContact', contactId, function(error) {
    if (error) {
      Bert.alert(error.reason, 'warning');
    }
  });
}
