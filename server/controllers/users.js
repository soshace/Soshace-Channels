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

  'signOutGithub': function() {
    var currentUser = this.userId;

    Meteor.users.update(currentUser, {
      $set: {
        'profile.services.pass': ''
      }
    });
  },

  'requestContact': function(newContactName) {
    var currentUserId = this.userId;

    var selector = {
      username: newContactName
    };

    var newContactId = Meteor.users.findOne(selector)._id;

    if (newContactId === currentUserId){
      return;
    }

    var currentUserContacts = Meteor.users.findOne({
      _id: currentUserId
    }).profile.contacts;

    var isUserInList = _.findWhere(currentUserContacts, {
        contactId: newContactId
      });

    if (!isUserInList) {
      addContactStatus(currentUserId,newContactId,'wasRequested');
      addContactStatus(newContactId,currentUserId,'sentRequest');
    } else{
      setContactStatus(currentUserId,newContactId,'wasRequested');
      setContactStatus(newContactId,currentUserId,'sentRequest');
    }
  },

  'acceptContact': function(contactId) {
    var currentUserId = this.userId;

    setContactStatus(currentUserId,contactId,'accepted');
    setContactStatus(contactId,currentUserId,'accepted');
  },

  'rejectContact': function(contactId) {
    // Meteor.users.update({},{
    //   $set: {
    //     'profile.contacts': []
    //   }
    // }, {multi: true});
    var currentUserId = this.userId;

    setContactStatus(currentUserId,contactId,'rejected');
    setContactStatus(contactId,currentUserId,'rejected');
    removeContactFromUserChannels(contactId,currentUserId);    
  },

  'addToken': function(serviceName, token) {
    let currentUser = this.userId;
    Meteor.users.update(currentUser, {
      $set: {
        'profile.services.name': serviceName,
        'profile.services.pass': token,
      }
    }, function(error, results) {
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
      return Accounts.sendVerificationEmail(userId);
    }
  },

  'deleteAccount': function() {
    var userId = this.userId;

    if (userId) {
      Meteor.users.remove(userId);
    }
  },
});

var setContactStatus = function(userId,contactId,status){
  Meteor.users.update({
    _id: userId,
    'profile.contacts.contactId': contactId
  }, {
    $set: {
      'profile.contacts.$.contactStatus': status
    }
  }, function(error, results) {
    if (error) {
      console.log(error);
    } else {
      console.log(results);
    }
  });
}

var addContactStatus = function(userId,contactId,status){
  Meteor.users.update({
    _id: userId
  }, {
    $addToSet: {
      'profile.contacts': {
        contactId: contactId,
        contactStatus: status
      }
    }
  }, function(error, results) {
    if (error) {
      console.log(error);
    } else {
      console.log(results);
    }
  });
}

var removeContactFromUserChannels = function(contactId,userId){
  var channels = Channels.find({createdBy: userId}).fetch();

  _.map(channels,function(channel){
    Channels.update({
      _id: channel._id
    }, {
      $pull: {
        members: contactId
      }
    });
  });
}
