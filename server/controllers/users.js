Meteor.methods({
  'saveTrelloData': function(data) {
    var currentUser = this.userId;

    // TODO: сделать более точное сравнение
    // возможно приведение типов (проверить аналогичные условия)
    // if (!currentUser) {
    //   throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    // }

    Meteor.users.update(currentUser, {
      $set: {
        trelloData: data
      }
    });
  },

  'addContact': function(userIdToAdd) {
    var currentUser = this.userId;

    var selector = {
      _id: userIdToAdd
    };

    var userToAdd = Meteor.users.findOne(selector);

    Meteor.users.update(currentUser, {
      $addToSet: {
        contacts: userToAdd._id
      }
    });
  }
  // ,
  //
  // 'getContactsEmails': function(contacts) {
  //
  //   var selector = {
  //     _id: { $in: contacts}
  //   };
  //
  //   var options = {
  //     fields: { emails: 1}
  //   };
  //
  //   return Meteor.users.find(selector, options);
  // }
});
