Template.githubDetailsTemplate.helpers({
	runHighlighting: function() {
		Meteor.defer(function() {
			PR.prettyPrint();
		})
	}
});