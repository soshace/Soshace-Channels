
Meteor.startup(function () {
  // init uploads collection
  if (Uploads.find().count() == 0) {
    Uploads.insert({_id: Random.id() });
  }

  UploadServer.init({
    tmpDir: process.env.PWD + '/.upload/tmp',
    uploadDir: process.env.PWD + '/.upload/',
    checkCreateDirectories: true,
    crop: true,
    getDirectory: function(fileInfo, formData) {
      if (formData && formData.directoryName != null) {
        return formData.directoryName + '/';
      }
      return '';
    },
    getFileName: function(fileInfo, formData) {
      if (formData && formData.user != null) {
        return formData.user + '_' + fileInfo.name;
      }
      return fileInfo.name;
    },
    finished: function(fileInfo, formData) {
      // double slash bug because of 'getDirectory' method
      fileInfo.path = fileInfo.path.replace("images//", "images/");
      fileInfo.url = fileInfo.url.replace("images//", "images/");

      if (formData && formData.user != null) {
        var isUserHavePic = Uploads.findOne({ _id: formData.user});
        if (isUserHavePic) {
          Meteor.call('deleteFile', formData.user);
          Uploads.update({_id: formData.user}, { $set: { fileInfo: fileInfo }});
        } else {
          Uploads.insert( {
            _id: formData.user,
            fileInfo: fileInfo
          });
        }
        Meteor.users.update(formData.user, { $set: { 'personalData.picPath': fileInfo.path } });
      }
    },
    // max 2 mb
    maxFileSize: 2097152
  });
});

Meteor.methods({
  'deleteFile': function(userPicId, deleteFromDb) {
    check(userPicId, String);

    var upload = Uploads.findOne({ _id: userPicId });

    if (upload) {
      UploadServer.delete(upload.fileInfo.path);
      if (deleteFromDb) {
        Uploads.remove({ _id: userPicId });
        Meteor.users.update(userPicId, { $set: { 'personalData.picPath': '' } });
      }
    }
  }
})
