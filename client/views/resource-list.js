Template.resourceList.helpers({
  resources: function() {
    return Resources.find({}, {sort: {createdAt: -1}});
  }
});
