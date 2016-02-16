Meteor.methods({
  'createNewResource': function(resourceName) {
    var currentUser = Meteor.userId();

    if (resourceName === '') {
      resourceName = defaultName(currentUser);
    }

    var data = {
      name: resourceName,
      createdBy: currentUser,
      createdAt: new Date()
    };

    if (!currentUser) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    return Resources.insert(data);
  },
  'removeResource': function(documentId) {
    var currentUser = Meteor.userId();
    var data = {
      _id: documentId,
      createdBy: currentUser
    };

    if (!currentUser) {
      throw new Meteor.Error('not-logged-in', 'You are not logged-in.');
    }

    Resources.remove(data);
  }
});

function defaultName(currentUser) {
    var nextLetter = 'Resource ' + 'A';
    var nextName = nextLetter;
    
    while (Resources.findOne({ name: nextName, createdBy: currentUser })) {
        nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
        nextName = 'Resource ' + nextLetter;
    }
    return nextName;
}
