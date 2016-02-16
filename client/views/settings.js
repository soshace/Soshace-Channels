
Template.settings.helpers({
  channels: function() {
    var currentUser = Meteor.userId();
    return Channels.find({ createdBy: currentUser }, {sort: {createdAt: -1}});
  },
  resources: function() {
    var currentUser = Meteor.userId();
    return Resources.find({ createdBy: currentUser }, {sort: {createdAt: -1}});
  },
});

Template.settings.events({
  'submit form': function(event) {
    event.preventDefault();

    // get data from inputs
    var form = $('form'),
        trelloKey = $('[name=trello-key]').val(),
        trelloLogin = $('[name=trello-login]').val(),
        trelloPassword = $('[name=trello-password]').val(),
        trelloData = {
          apikey: trelloKey,
          login: trelloLogin,
          password: trelloPassword
        };

    console.log(trelloData);

    Meteor.call('saveTrelloData', trelloData, function(error, results) {
      if (error) {
        console.log(error);
      } else {
        console.log('ok');
        console.log(results);
        form[0].reset();
      }
    });
  }
});
