Meteor.methods({
  'createNewChannel': function(channelName) {
    var currentUser = Meteor.userId();
    //check(channelName, String);

    if (channelName === '') {
      channelName = defaultName(currentUser);
    }

    var data = {
      name: channelName,
      createdBy: currentUser,
      createdAt: new Date()
    };

    if (!currentUser) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    return Channels.insert(data);
  },
  'removeChannel': function(documentId) {
    var currentUser = Meteor.userId();
    var data = {
      _id: documentId,
      createdBy: currentUser
    };

    if (!currentUser) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    Channels.remove(data);
  }
});

function defaultName(currentUser) {
    var nextLetter = 'A';
    var nextName = 'Channel ' + nextLetter;
    while (Channels.findOne({ name: nextName, createdBy: currentUser })) {
        nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
        nextName = 'Channel ' + nextLetter;
    }
    return nextName;
}
