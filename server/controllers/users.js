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
  }
});
