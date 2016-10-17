// Methods working with 'Mailboxes' collection
Meteor.methods({
  'getMailDialogs': function(channelId) {
    var currentUserId = this.userId;

    if (!currentUserId) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    var allMailsFromChannel = Mails.findOne({
      'channelId': channelId
    }, {
      fields: {
        folders: 1
      }
    });

    var dialogs = [],
        addresses = [];

    if (Array.isArray(allMailsFromChannel.folders) && allMailsFromChannel.folders.length) {
      // Now we have only 1 folder (INBOX), so we take [0] element
      allMailsFromChannel.folders[0].messages.every(function(message, index) {
        var hasElement = checkAvailability(addresses, message.from);
        if (!hasElement) {
          addresses.push(message.from);
          dialogs.push(message);
        }

        // TODO: save array of added addresses and/or index of last checked message

        if (dialogs.length > 5) {
          return false;
        } else return true;
      });
    }

    return {
      dialogs: dialogs,
      addresses: addresses
    };
  },

  'loadMoreDialogs': function(channelId, lastEmail, addressesAdded) {
    var currentUserId = this.userId;

    if (!currentUserId) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    var allMailsFromChannel = Mails.findOne({
      'channelId': channelId
    }, {
      fields: {
        folders: 1
      }
    });

    var newDialogs = [],
        newAddresses = [];

    // TODO: collect dialogs from last added dialog/address/message
    if (Array.isArray(allMailsFromChannel.folders) && allMailsFromChannel.folders.length) {
      // Now we have only 1 folder (INBOX), so we take [0] element
      allMailsFromChannel.folders[0].messages.every(function(message, index) {
        var hasElement = checkAvailability(addressesAdded, message.from);
        if (!hasElement) {
          newAddresses.push(message.from);
          newDialogs.push(message);
        }

        // TODO: save array of added addresses and/or index of last checked message
        if (newDialogs.length > 20) {
          return false;
        } else return true;
      });
    }

    return newDialogs;
  },

  'getMailDialog': function(channelId, address) {
    var currentUserId = this.userId;

    if (!currentUserId) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    var allMailsFromChannel = Mails.findOne({
      'channelId': channelId
    }, {
      fields: {
        'folders': 1
      }
    });

    var messages = [];

    if (Array.isArray(allMailsFromChannel.folders) && allMailsFromChannel.folders.length) {
      allMailsFromChannel.folders[0].messages.forEach(function(message) {
        if (message.from === address) messages.push(message);
      });
    }

    return messages;
  }
});

function checkAvailability(arr, val) {
  return arr.some(function(arrVal) {
    return val === arrVal;
  });
}
