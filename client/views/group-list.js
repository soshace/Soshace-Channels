Template.groupList.helpers({
  groups: function() {
    return Groups.find({}, {sort: {createdAt: -1}});
  }
});
