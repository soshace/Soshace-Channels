// Methods working with 'Channels' collection

Meteor.methods({
  'createNewChannel': function(newChannel) {
    var currentUserId = this.userId,
      data = {
        name: newChannel.name,
        serviceType: newChannel.service,
        serviceResource: newChannel.resourceId,
        login: newChannel.login,
        createdBy: currentUserId,
        createdAt: new Date(),
        members: [],
        messages: []
      };

    if (!currentUserId) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }
    return Channels.insert(data);
  },

  'removeChannel': function(channelId) {
    if (!this.userId) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    Channels.remove({
      _id: channelId
    });
  },

  'changeChannelName': function(channelId, userId, newName) {
    var currentUser = this.userId;

    if (currentUser === userId) {
      Channels.update({
        _id: channelId
      }, {
        $set: {
          name: newName
        }
      });
    }
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
    Channels.update({
      _id: channelId
    }, {
      $addToSet: {
        resources: resourceToAdd
      }
    });
  },

  'addMember': function(channelId, userId) {

    // TODO: add check if user is logged-in (if(!currentUser))??? see above methods
    // var currentUser = this.userId;

    // check userId???

    Channels.update({
      _id: channelId
    }, {
      $addToSet: {
        members: userId
      }
    });
  },

  'addMemberByParam': function(channelId, parameter) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      addedUser;

    if (!parameter) {
      return;
    }

    if (re.test(parameter)) {
      user = Meteor.users.findOne({
        'emails.0.address': parameter
      });
    } else {
      user = Meteor.users.findOne({
        'username': parameter
      });
    }

    if (user && (user._id !== this.userId)) {
      Channels.update({
        _id: channelId
      }, {
        $addToSet: {
          members: user._id
        }
      });
    }

    if (!user) {
      throw new Meteor.Error(500, ERRORS.userNotFound);
    }
    return;
  },

  'removeMember': function(channelId, userId) {

    // some checks?

    Channels.update({
      _id: channelId
    }, {
      $pull: {
        members: userId
      }
    });
  },

  'addComment': function(body, channelId, resourceBlockId, authorId, dateTime) {
    Channels.update({
      _id: channelId
    }, {
      $addToSet: {
        'messages': {
          body: body,
          dateTime: new Date(),
          author: authorId,
          resourceBlockId: resourceBlockId
        }
      }
    });
  }
});
