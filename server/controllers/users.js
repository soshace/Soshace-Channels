// Methods working with 'Meteor.users' collection

// Add empty arrays to users fields 'contacts'/'channels'
// (which defined in client/views/register.js)
// when user creates an account (registation)
Accounts.onCreateUser(function(options, user) {
   // Use provided profile in options, or create an empty object
   user.profile = options.profile || {};

   // Assigns 'contacts'/'channels'  to the newly created user object
   user.profile.contacts = options.contacts;
   user.profile.channels = options.channels;

   // Returns the user object
   return user;
});


Meteor.methods({
  'saveUserData': function(firstName, lastName, servicePass) {
    var currentUser = this.userId;

    // TODO: сделать более точное сравнение
    // возможно приведение типов (проверить аналогичные условия)
    // if (!currentUser) {
    //   throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    // }

    Meteor.users.update(currentUser, {
      $set: {
        'profile.firstName': firstName,
        'profile.lastName': lastName,
        // 'profile.services.name': serviceName,
        'profile.services.pass': servicePass
      }
    });
  },

  'addContact': function(newContact) {
    var currentUser = this.userId;

    var selector = {
      username: newContact
    };

    var userToAdd = Meteor.users.findOne(selector);

    Meteor.users.update(currentUser, {
      $addToSet: {
        'profile.contacts': userToAdd._id
      }}, function(error, results) {
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
  }
});
