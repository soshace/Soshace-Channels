var boards = [];

Template.channel.events({
  'click .channel__delete': function(event) {
    event.preventDefault();

    // Get current channel id
    var channelId = this._id;

    var confirm = window.confirm('Delete ' + this.name + ' ?');

    if (confirm) {
      Meteor.call('removeChannel', channelId, function(error, results) {
        if (error) {
          console.log(error.reason);
        } else {
          console.log(results);
          Router.go('channels');
        }
      });
    }
  },

  'click .channel__add-member': function(event, template) {
    event.preventDefault();

    // Get current channel id.
    // Here we can't use 'this._id' for channelId
    // because of data context of contacts helper
    var channelId = template.data._id;

    // Take user id from link data attribute
    var userId = event.target.dataset.userid;

    Meteor.call('addMember', channelId, userId, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        console.log(results);
      }
    });
  },

  'click .channel__remove-member': function(event, template) {
    event.preventDefault();

    var channelId = template.data._id,
        userId = event.target.dataset.userid;

    Meteor.call('removeMember', channelId, userId, function(error, results) {
      if (error) {
        console.log(error.reason);
      } else {
        console.log(results);
      }
    });
  }
});

Template.channel.helpers({
  contacts: function() {

    // Get current User contacts array
    var contactsArray = Meteor.user().profile.contacts;

    var selector = {
      _id: { $in: contactsArray }
    };

    var options = {
      fields: { username: 1, _id: 1 }
    };

    return Meteor.users.find(selector, options);
  },

  members: function() {
    // Get current channel id
    var channelId = this._id;

    var selector = {
      _id: channelId
    };

    var options = {
      fields: { members: 1 }
    };

    // Get array of channel members
    var membersArray = Channels.findOne(selector, options).members;

    selector = {
      _id: { $in: membersArray }
    };

    options = {
      fields: { username: 1, _id: 1 }
    };

    // Return channel members logins
    return Meteor.users.find(selector, options);
  },

  trelloBoards: function() {
    return Session.get('trelloBoards');
  }
});

Template.channel.onRendered(function() {
  if (!this._rendered) {
    this._rendered = true;
    Trello.authorize({
      type: 'popup',
      name: 'Trello dashboard',
      scope: {
        read: true,
        write: false
      },
      expiration: 'never',
      success: loadBoards,
      error: function() {
        console.log('Failed auth');
      }
    });
  }
});


var loadBoards = function() {
  console.log('Trello boards loading started');
  Trello.get(
    '/members/me/boards/',
    function(result) {
      boards = result;
      for (var i = result.length - 1; i >= 0; i--) {
        loadLists(i);
      };
      console.log(result);

      result[0].lists = [1, 2, 3];
      Session.set('trelloBoards', result);
      console.log('Trello boards loading finished');
    },
    function() {
      console.log('Failed to load boards');
    }
  );
};

var loadLists = function(index) {
  Trello.get(
    '/boards/' + boards[index].id + '/lists',
    function(result) {
      boards[index].lists = result;

      for (var i = result.length - 1; i >= 0; i--) {
        loadCards(index, i);
      };
    },
    function() {
      console.log('Failed to load list!');
    }
  );
};

var loadCards = function(boardIndex, listIndex) {
  console.log(boards[boardIndex].lists[listIndex].id);
  Trello.get(
    '/lists/' + boards[boardIndex].lists[listIndex].id + '/cards',
    function(result) {
      boards[boardIndex].lists[listIndex].cards = result;

      Session.set('trelloBoards', boards);
    },
    function() {
      console.log('Failed to load card!');
    }
  );
};

Template.registerHelper('formatDate', function(dt) {
  var date = new Date(dt);
  return date.getFullYear()+'/'+date.getMonth()+'/'+date.getDay()+' '+date.getHours()+':'+date.getMinutes();
});

// Template.channel.helpers({
//   resources: function() {
//     var currentUser = Meteor.userId(),
//         channel = Channels.findOne({ _id: this._id }),
//         resourcesIds = channel.resources;
//
//     var selector = {
//       _id: { $in: resourcesIds}
//     };
//
//     return Resources.find(selector);
//   }
// });
