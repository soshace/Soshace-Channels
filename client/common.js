Template.registerHelper('formatDateTime', function(dt) {
  var date = new Date(dt);
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
});

// Template.registerHelper('equals', function(a, b) {
//   return (a === b);
// });

Meteor.startup(function(){
	Meteor.call('clearSession');
	Meteor.subscribe('guestChannels');
	Meteor.subscribe('hostChannels');
});