// Methods working with 'Meteor.users' collection

// Add empty arrays to users fields 'contacts'/'channels'
// (which defined in client/views/register.js)
// when user creates an account (registation)
Accounts.onCreateUser(function(options, user) {
  user._id = Random.id();

  // Use provided profile in options, or create an empty object
  user.profile = options.profile || {};

  // Assigns 'contacts'/'channels'  to the newly created user object
  user.profile.contacts = [];
  user.profile.channels = [];

  // Check if user come with invite
  if (options.invited) {
    // Verify email
    user.emails[0].verified = true;

    var inviterContact = {
      contactId: options.contacts,
      contactStatus: 'accepted'
    };
    // Add inviter to contact list
    user.profile.contacts.push(inviterContact);

    // Add new user to inviter contacts
    Meteor.users.update({
      _id: options.contacts
    }, {
      $addToSet: {
        'profile.contacts': {
          contactId: user._id,
          contactStatus: 'accepted'
        }
      }
    });
  }

  // Returns the user object
  return user;
});


Meteor.methods({
  'saveUserName': function(firstName, lastName) {
    var currentUser = this.userId;

    // TODO: сделать более точное сравнение
    // возможно приведение типов (проверить аналогичные условия)
    // if (!currentUser) {
    //   throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    // }

    Meteor.users.update(currentUser, {
      $set: {
        'profile.firstName': firstName,
        'profile.lastName': lastName
      }
    });
  },

  'requestContact': function(newContactName) {
    var currentUserId = this.userId;

    var selector = {
      username: newContactName
    };

    var newContact = Meteor.users.findOne(selector);

    Meteor.users.update({
      _id: currentUserId
    }, {
      $addToSet: {
        'profile.contacts': {
          contactId: newContact._id,
          contactStatus: 'wasRequested'
        }
      }
    }, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log(results);
      }
    });

    Meteor.users.update({
      _id: newContact._id
    }, {
      $addToSet: {
        'profile.contacts': {
          contactId: currentUserId,
          contactStatus: 'sentRequest'
        }
      }
    }, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log(results);
      }
    });
  },

  'acceptContact': function(contactId) {
    var currentUserId = this.userId;

    Meteor.users.update({
      _id: currentUserId,
      'profile.contacts.contactId': contactId
    }, {
      $set: {
        'profile.contacts.$.contactStatus': 'accepted'
      }
    }, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log(results);
      }
    });

    Meteor.users.update({
      _id: contactId,
      'profile.contacts.contactId':currentUserId
    }, {
      $set: {
        'profile.contacts.$.contactStatus': 'accepted'
      }
    }, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log(results);
      }
    });
  },

  'rejectContact': function(contactId) {
    var currentUserId = this.userId;

    Meteor.users.update({
      _id: currentUserId,
      'profile.contacts.contactId':contactId
    }, {
      $set: {
        'profile.contacts.$.contactStatus': 'rejected'
      }
    }, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log(results);
      }
    });

    Meteor.users.update({
      _id: contactId,
      'profile.contacts.contactId':currentUserId
    }, {
      $set: {
        'profile.contacts.$.contactStatus': 'rejected'
      }
    }, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log(results);
      }
    });
  },

  'addToken': function(serviceName,token) {
    let currentUser = this.userId;
    console.log(token);
    Meteor.users.update(currentUser, {
      $set: {
        'profile.services.name': serviceName,
        'profile.services.pass': token,
      }}, function(error, results) {
        if (error) {
          console.log(error);
        } else {
          console.log(results);
        }
    });
  },

  'sendVerificationLink': function() {
    var userId = this.userId;

    if (userId) {
      return Accounts.sendVerificationEmail( userId );
    }
  },

  'deleteAccount': function() {
    var userId = this.userId;

    if (userId) {
      Meteor.users.remove(userId);
    }
  },
});
