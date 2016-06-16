Template.profileImage.helpers({
  myFormData: function() {
    return { directoryName: 'images', prefix: this._id, _id: this._id }
  }
});

Meteor.startup(function() {
  Uploader.finished = function(index, file) {
    Uploads.insert(file);
  }
});
