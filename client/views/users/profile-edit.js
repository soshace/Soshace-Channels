Template.profileEdit.helpers({
  myFormData: function() {
    // this.what = 'lol';
    return { directoryName: 'images', user: Meteor.userId() }
  }
});

Template.profileEdit.events({
  'click #deleteUserPic': function(event) {
    var userId = Meteor.userId();
    if (confirm('Are you sure?')) {
      Meteor.call('deleteFile', userId, true);
      Router.go('profile');
    }
  },

  'submit .user-info-edit': function(event) {
    event.preventDefault();

    // Get data
    var form = $('.user-info-edit'),
        profileBlock = $('.profile');
        userData = {
          firstName: $('[name=first-name]').val(),
          lastName: $('[name=last-name]').val(),
          gender: $('[name=gender]').val(),
          bday: $('[name=bday]').val(),
          phone: $('[name=phone]').val(),
          skype: $('[name=skype]').val(),
          location: $('[name=location]').val()
        };

    Meteor.call('saveUserData', userData, function(error) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        Router.go('profile');
        Bert.alert('Successfully changed.', 'success');
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
  // ,
  //
  // 'change form': function(event) {
  //   console.log(this);
  // }
})
