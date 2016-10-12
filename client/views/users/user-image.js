var userImagePath = '';
var deps = new Deps.Dependency();
var img = $('.user-uploaded-img');

Template.userImage.helpers({
  userImagePath: function() {
    deps.depend();
    return userImagePath  || '/images/user.png';
  }
});

Template.userImage.rendered = function(){
  userImagePath = this.data.userImage
  deps.changed()
}

Template.userImage.events({
  'click #deleteUserPic': function() {
    var userId = Meteor.userId();
    if (confirm('Are you sure?')) {
      Meteor.call('deleteFile', userId, true, function(error) {
        if (error) {
          Bert.alert('Error while reading image file. Please contact support about this problem.', 'warning');
        }
      });
      Router.go('profile');
    }
  },

  'change .img-upload': function(event) {
    var reader = new FileReader();
    reader.onload = onImageLoaded;
    reader.readAsDataURL(event.target.files[0]);
  }
})

var onImageLoaded = function(e) {
  userImagePath = event.target.result
  deps.changed();

  img = $('.user-uploaded-img');
  var preview = $('.preview');
  preview.removeClass('hidden')

  img.attr('src', userImagePath)
  preview.attr('src', userImagePath)

  startCropping();
}

function showPreview(coords) {
  var ratio = 200 / coords.w;
  var previewRatio = 0.5;
  var realWidth = img[0].naturalWidth
  var realHeight = img[0].naturalHeight
  var realRatio = realWidth/realHeight

  if (!img) {
    return;
  }

  $('.preview').css({
    width: Math.round(ratio * 100) + 'px',
    height: Math.round(ratio * 100 / realRatio) + 'px',
    marginLeft: '-' + Math.round(ratio * previewRatio * coords.x) + 'px',
    marginTop: '-' + Math.round(ratio * previewRatio * coords.y) + 'px'
  });
}

function startCropping() {
  img.Jcrop({
    onSelect: showPreview,
    onChange: showPreview,
    setSelect: [0, 0, 200, 200],
    aspectRatio: 1,
  });

  // cancelBtn.click(function() {
  //   legend.addClass('hidden');
  //   okBtn.addClass('hidden');
  //   cancelBtn.addClass('hidden');
  //   deleteBtn.removeClass('hidden');
  //   cropBtn.removeClass('hidden');

  //   var JcropAPI = img.data('Jcrop');
  //   JcropAPI.destroy();
  // });

  // okBtn.click(function() {
  //   legend.addClass('hidden');
  //   okBtn.addClass('hidden');
  //   cancelBtn.addClass('hidden');
  //   deleteBtn.removeClass('hidden');
  //   cropBtn.removeClass('hidden');

  //   Meteor.call('cropFile', coords, function(error) {
  //     if (error) {
  //       Bert.alert('Error while reading image file. Please contact support about this problem.', 'warning');
  //     } else {
  //       legend.addClass('hidden');
  //       okBtn.addClass('hidden');
  //       cancelBtn.addClass('hidden');
  //       deleteBtn.removeClass('hidden');
  //       cropBtn.removeClass('hidden');

  //       Router.go('profile');
  //       Bert.alert('Image was successfully cropped.', 'success');
  //     }
  //   })
  // });
}
