Template.registerHelper('formatDateTime', function(dt) {
  var date = new Date(dt);
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
});

Template.registerHelper('formatDateTimeFromUnix', function(dt) {
  var dateTime = moment.unix(dt).format('MM/DD/YYYY HH:mm');
  return `${dateTime}`;
});

// Template.registerHelper('equals', function(a, b) {
//   return (a === b);
// });

Meteor.startup(function(){
	// Meteor.call('clearSession');
	Meteor.subscribe('guestChannels');
	Meteor.subscribe('hostChannels');
});