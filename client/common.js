Template.registerHelper('formatDateTime', function(dt) {
  var date = new Date(dt);
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}  ${date.getHours()}:${date.getMinutes()}`;
});

Template.registerHelper('formatDateTimeFromUnix', function(dt) {
  var dateTime = moment.unix(dt / 1000).format('MM/DD/YYYY HH:mm');
  return `${dateTime}`;
});

// Template.registerHelper('equals', function(a, b) {
//   return (a === b);
// });

Meteor.startup(function(){
	Meteor.subscribe('guestChannels');
	Meteor.subscribe('hostChannels');
});