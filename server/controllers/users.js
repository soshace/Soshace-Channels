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
  }
});
