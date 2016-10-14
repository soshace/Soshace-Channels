// Methods working with 'Mailboxes' collection
Meteor.methods({
  'getMailDialogs': function(channelId) {
    var currentUserId = this.userId;

    if (!currentUserId) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    var allMailsFromChannel = Mails.findOne({
      'channelId': channelId,
      'userId': currentUserId
    }, {
      fields: {
        folders: 1
      }
    });

    var dialogs = [];

    if (allMailsFromChannel.isArray() && allMailsFromChannel.length) {
      // Now we have only 1 folder (INBOX), so we take [0] element
      allMailsFromChannel[0].messages.forEach({
        // TODO: make dialogs here: collect all mails with the same address
      });
    }
  },

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
  },

  'checkMails': function(params) {
    var mails = Mails.findOne({channelId: params.channelId});

    if (!mails) {
      addChannelMail(params.channelId)
    }

    console.log(mails);

    return 123;
  }
})


function saveMessageToDB(channelId, boxName, message) {
  var box = Mails.findOne({channelId: channelId, 'folders.name': boxName});

  console.log(box);

  // Mails.update({channelId: channelId, 'folders.name': 'boxName'}, {
  //   $push: {
  //     item: message
  //   }
  // })
}

function addChannelMail(channelId) {
  var newMailBox = {
    channelId: channelId,
    folders: []
  }

  return Mails.insert(newMailBox);
}