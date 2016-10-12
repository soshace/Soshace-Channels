// Methods working with 'Mailboxes' collection
Meteor.methods({
  'saveMailboxesToDB': function(channelId, dialogs, commonParams) {
    var currentUserId = this.userId,
        newMailData = {
          userId: currentUserId,
          channelId: channelId,
          createdAt: new Date(),
          dialogs: dialogs,
          commonParams: commonParams
        };

    if (!currentUserId) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    return Mailboxes.insert(newMailData);
  },

  'checkMailboxesDB': function(channelId) {
    var currentUserId = this.userId;

    if (!currentUserId) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    return Mailboxes.findOne({
      'channelId': channelId,
      'userId': currentUserId
    }, {
      fields: {
        dialogs: 1,
        commonParams: 1
      }
    });
  },

  'saveMaildialogsToDB': function(channelId, dialog, address) {
    var currentUserId = this.userId,
        newMaildialogData = {
          userId: currentUserId,
          channelId: channelId,
          createdAt: new Date(),
          dialogsContent: dialog,
          address: address
        };

    if (!currentUserId) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    return Maildialogs.insert(newMaildialogData);
  },

  'checkMaildialogsDB': function(channelId, address) {
    var currentUserId = this.userId;

    if (!currentUserId) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    return Maildialogs.findOne({
      'channelId': channelId,
      'userId': currentUserId,
      'address': address
    }, {
      fields: {
        dialogsContent: 1
      }
    });
  }
})
