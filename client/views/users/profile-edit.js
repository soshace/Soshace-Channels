Template.profileEdit.helpers({
  myFormData: function() {
    // this.what = 'lol';
    return { directoryName: 'images', user: Meteor.userId() }
  }
});

Template.profileEdit.events({
  'click #cropUserPic': function() {
    var img = $('.user-uploaded-img'),
        okBtn = $('#acceptCrop'),
        cancelBtn = $('#cancelCrop'),
        deleteBtn = $('#deleteUserPic'),
        cropBtn = $('#cropUserPic'),
        legend = $('.user-image p'),
        coords;

    deleteBtn.addClass('hidden');
    cropBtn.addClass('hidden');
    legend.removeClass('hidden');
    okBtn.removeClass('hidden');
    cancelBtn.removeClass('hidden');

    img.Jcrop({
      boxWidth: 300,
      boxHeight: 300,
      onSelect: function(c) {
        coords = {
          x: c.x,
          y: c.y,
          width: c.w,
          height: c.h
        };
      },
      setSelect: [ 100, 100, 50, 50 ]
    });

    cancelBtn.click(function() {
      legend.addClass('hidden');
      okBtn.addClass('hidden');
      cancelBtn.addClass('hidden');
      deleteBtn.removeClass('hidden');
      cropBtn.removeClass('hidden');

      var JcropAPI = img.data('Jcrop');
      JcropAPI.destroy();
    });

    okBtn.click(function() {
      legend.addClass('hidden');
      okBtn.addClass('hidden');
      cancelBtn.addClass('hidden');
      deleteBtn.removeClass('hidden');
      cropBtn.removeClass('hidden');

      Meteor.call('cropFile', coords, function(error) {
        if (error) {
          Bert.alert('Something went wrong.', 'warning');
        } else {
          Router.go('profile');
          Bert.alert('Image was successfully cropped', 'success');
        }
      })
    });
  },

  'click #deleteUserPic': function() {
    var userId = Meteor.userId();
    if (confirm('Are you sure?')) {
      Meteor.call('deleteFile', userId, true);
      Router.go('profile');
    }
  },

  'submit .user-info-edit': function(event, template) {
    event.preventDefault();

    // Get data
    var userData = {
          email: $('[name=email]').val(),
          firstName: $('[name=first-name]').val(),
          lastName: $('[name=last-name]').val(),
          gender: $('[name=gender]').val(),
          bday: $('[name=bday]').val(),
          phone: $('[name=phone]').val(),
          skype: $('[name=skype]').val(),
          location: $('[name=location]').val()
        };

    Meteor.call('saveUserData', userData, function(error, result) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        Router.go('profile');
        Bert.alert('Successfully changed.', 'success');

        // 'saveUserData' returns false if email was changed
        if (!result) {
          Meteor.call('sendVerificationLink', function(error) {
            if (error) {
              Bert.alert(error.reason, 'warning');
            } else {
              var email = Meteor.user().emails[0].address;
              Bert.alert('Link send to ' + email, 'success');
            }
          });
        }
      }
    });
  },

  'keyup #location-field': function(event) {
    var input = $('#location-field')
        str = input.val(),
        addedCities = $('.location-result li'),
        locationBlock = $('.location-result');

    removeAddedCities(addedCities);
    locationBlock.addClass('invisible');

    $.get('http://api.openweathermap.org/data/2.5/find?q=' + str + '&type=like&mode=json&units=metric&appid=b28d0ac52d85fcb150a267da64e9776d', function(data) {
      var cities = data.list;
      if ($.isArray(cities)) {
        locationBlock.removeClass('invisible');
        cities.forEach(function(city) {
          $('.location-result')
            .append('<li>' + city.name + ', ' + city.sys.country + '</li>');
        });

        $('.location-result li').click(function() {
          input.val($(this).text());
          var addedCities = $('.location-result li');
          removeAddedCities(addedCities);
          locationBlock.addClass('invisible');
        });
      }
    });

    function removeAddedCities(cities) {
      cities.each(function(i, item) {
        $(item).remove();
      });
    }
  }
})
