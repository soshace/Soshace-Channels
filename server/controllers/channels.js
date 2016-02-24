// Methods working with 'Channels' collection

Meteor.methods({
  'createNewChannel': function(channelName, channelType) {
    var currentUser = this.userId;
    //check(channelName, String);
    //check(channelType, String);

    if (!channelName) {
      channelName = defaultName(currentUser);
    }

    var data = {
      name: channelName,
      createdBy: currentUser,
      createdAt: new Date(),
      members: [],
      serviceType: channelType
    };

    if (!currentUser) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    return Channels.insert(data);
  },

  'removeChannel': function(channelId) {
    var currentUser = this.userId;
    var data = {
      _id: channelId,
      createdBy: currentUser
    };

    if (!currentUser) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    Channels.remove(data);
  },

  'addNewResourceToChannel': function(resourceToAdd, channelId) {
    var currentUser = this.userId;

    var data = {
      resources: resourceToAdd
    };

    // TODO: сделать более точное сравнение
    // возможно приведение типов (проверить аналогичные условия)
    if (!currentUser) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    // check if this resource is already in channel
    // ...

    // add resource to channel field 'resources'
    // '$addToSet' - adds elements to an array only if they do not already exist in the set.
    Channels.update( { _id: channelId }, {
      $addToSet: {
        resources: resourceToAdd
      }
    });
  },

  'addMember': function(channelId, userId) {

    // TODO: add check if user is logged-in (if(!currentUser))??? see above methods
    // var currentUser = this.userId;

    // check userId???

    Channels.update( { _id: channelId }, {
      $addToSet: {
        members: userId
      }
    });
  },

  'removeMember': function(channelId, userId) {

    // some checks?

    Channels.update( { _id: channelId }, {
      $pull: {
        members: userId
      }
    });
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
