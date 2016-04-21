Template.githubDetailsTemplate.helpers({
	runHighlighting: function() {
		// Meteor.defer(function() {
		// 	// hljs.initHighlighting();
		// 	$('pre code').each(function(i, block) {
		// 	    hljs.highlightBlock(block);
		// 	  });
		// })
	}
});

Template.githubDetailsTemplate.rendered = function () {
	// console.log(hljs);
	// $('pre code').each(function(i, block) {
	// 	console.log(block);
	//     hljs.highlightBlock(block);
	//   });

};