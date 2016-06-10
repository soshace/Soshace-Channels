// Methods working with 'Meteor.users' collection

// Add empty arrays to users fields 'contacts'/'channels'
// (which defined in client/views/register.js)
// when user creates an account (registation)
Accounts.onCreateUser(function(options, user) {
  user._id = Random.id();

  // Use provided profile in options, or create an empty object
  //user.profile = options.profile || {};

  // Assigns 'contacts'/'channels'  to the newly created user object
  //user.profile.contacts = [];
  //user.profile.channels = [];
  user.contacts = [];
  user.channels = [];
  user.serviceTokens = [];

  // Check if user come with invite
  if (options.invited) {
    // Verify email
    user.emails[0].verified = true;

    var inviterContact = {
      contactId: options.contacts,
      contactStatus: 'accepted'
    };
    // Add inviter to contact list
    //user.profile.contacts.push(inviterContact);
    user.contacts.push(inviterContact);

    // Add new user to inviter contacts
    Meteor.users.update({
      _id: options.contacts
    }, {
      $addToSet: {
        'contacts': {
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
  'saveUserData': function(userData) {
    var currentUser = this.userId;

    // TODO: сделать более точное сравнение
    // возможно приведение типов (проверить аналогичные условия)
    // if (!currentUser) {
    //   throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    // }

    Meteor.users.update(currentUser, {
      $set: {
        'personalData.firstName': userData.firstName,
        'personalData.lastName': userData.lastName,
        'personalData.gender': userData.gender,
        'personalData.bday': userData.bday,
        'personalData.phone': userData.phone,
        'personalData.skype': userData.skype,
        'personalData.country': userData.country,
        'personalData.city': userData.city
      }
    });
  },

  'signOutService': function(serviceName) {
    Meteor.users.update({_id: this.userId, 'serviceTokens.serviceName': serviceName}, {
      $set: {
        'serviceTokens.$.token': '',
        'serviceTokens.$.refreshToken': ''
      }
    });
  },

  'requestContact': function(newContactName) {
    var currentUserId = this.userId,
        selector = {
          username: newContactName
        },
        newContactId = Meteor.users.findOne(selector)._id;

    if (newContactId === currentUserId){
      return;
    }

    var currentUserContacts = Meteor.users.findOne({
      _id: currentUserId
    }).contacts;

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

  'addToken': function(serviceData) {
    var currentUserId = Meteor.userId(),
        userTokens = Meteor.user().serviceTokens;

    if (userTokens){
      var tokenIndex = -1;
      _.map(userTokens, function(data, index){
        if (data.serviceName === serviceData.serviceName){
          tokenIndex = index;
        }
      });
      if (tokenIndex > -1){
        userTokens[tokenIndex] = serviceData;
      } else {
        userTokens.push(serviceData);
      }
    } else {
      userTokens = [serviceData];
    }

    Meteor.users.update({_id: currentUserId}, {
      $set: {
        'serviceTokens': userTokens
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
    'contacts.contactId': contactId
  }, {
    $set: {
      'contacts.$.contactStatus': status
    }
  }, function(error, results) {
    if (error) {
      console.log(error);
    } else {
      console.log(results);
    }
  });
};

var addContactStatus = function(userId,contactId,status){
  Meteor.users.update({
    _id: userId
  }, {
    $addToSet: {
      'contacts': {
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
};

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
};

// var removeObjectFromArray = function(array, name) {
//   return _.reject(array, function(item) {
//     return item.serviceName === name;
//   });
// };
