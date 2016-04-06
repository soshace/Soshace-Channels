Template.githubDetailsTemplate.helpers({
	runHighlighting: function() {
		Meteor.defer(function() {
			// $('pre code').each(function(i, block) {
			// 	hljs.highlightBlock(block);
			// });
			PR.prettyPrint();
		})
	}
});