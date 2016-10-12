
Meteor.startup(function () {
  // init uploads collection
  if (Uploads.find().count() == 0) {
    Uploads.insert({_id: Random.id() });
  }

  UploadServer.init({
    // tmpDir: process.env.PWD + '/../' + '.upload/tmp',
    // uploadDir: process.env.PWD + '/../' + '.upload/',
    tmpDir: Meteor.settings.private.imagesPath + '/tmp',
    uploadDir: Meteor.settings.private.imagesPath,
    checkCreateDirectories: true,
    getDirectory: function(fileInfo, formData) {
      if (formData && formData.directoryName != null) {
        return formData.directoryName + '/';
      }
      return '';
    },
    getFileName: function(fileInfo, formData) {
      if (formData && formData.user != null) {
        return formData.user + '_' + 'pic';
      }
      return fileInfo.name;
    },
    finished: function(fileInfo, formData) {
      console.log(fileInfo)
      // double slash bug because of 'getDirectory' method
      fileInfo.path = fileInfo.path.replace("images//", "images/");
      fileInfo.url = fileInfo.url.replace("images//", "images/");

      Imagemagick.resize({
        // srcPath: process.env.PWD + '/../.upload/' + fileInfo.path,
        // dstPath: process.env.PWD + '/../.upload/' + fileInfo.path,
        srcPath: Meteor.settings.private.imagesPath + fileInfo.path,
        dstPath: Meteor.settings.private.imagesPath + fileInfo.path,
        width: 300,
        height: 300
      });

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
    }
  });
});

Meteor.methods({
  'deleteFile': function(userPicId, deleteFromDb) {
    check(userPicId, String);

    var upload = Uploads.findOne({ _id: userPicId });

    if (upload) {
      try {
        UploadServer.delete(upload.fileInfo.path);        
      }
      catch (e) {
        console.log('User image deleting failed!');
        console.log(e);
      }
      if (deleteFromDb) {
        Uploads.remove({ _id: userPicId });
        Meteor.users.update(userPicId, { $set: { 'personalData.picPath': '' } });
      }
    }
  },

  'cropFile': function(coords) {
    var imgId = this.userId,
        upload = Uploads.findOne({ _id: imgId }),
        dateNow = Date.now(),
        path = upload.fileInfo.path,
        newPath = upload.fileInfo.subDirectory + upload.fileInfo.name + '_' + dateNow,
        // pathForCropperIn = process.env.PWD + '/../' + '.upload/' + path,
        // pathForCropperOut = process.env.PWD + '/../' + '.upload/' + newPath,
        pathForCropperIn = Meteor.settings.private.imagesPath + path,
        pathForCropperOut = Meteor.settings.private.imagesPath + newPath,
        params = coords.width + 'x' + coords.height + '+' + coords.x + '+' + coords.y;

    Imagemagick.convert([pathForCropperIn, '-crop', params, pathForCropperOut]);

    UploadServer.delete(path);
    Uploads.update({_id: imgId}, { $set: { 'fileInfo.path': newPath }});
    Meteor.users.update(imgId, { $set: { 'personalData.picPath': newPath } });
  }
})
