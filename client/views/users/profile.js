Template.profile.events({
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
          country: $('[name=country]').val(),
          city: $('[name=city]').val()
        };

    Meteor.call('saveUserData', userData, function(error) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        profileBlock.removeClass('profile-edit');
        Bert.alert('Successfully changed.', 'success');
      }
    });
  },

  'click .resend-verification-link': function(event) {
    event.preventDefault();

    Meteor.call('sendVerificationLink', function(error) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        var email = Meteor.user().emails[0].address;
        Bert.alert('Link send to ' + email, 'success');
      }
    });
  },

  'click .delete-user': function(event) {
    event.preventDefault();
    if (confirm('Are you sure?')) {
      Meteor.call('deleteAccount', function(error) {
        if (error) {
          Bert.alert(error.reason, 'warning');
        } else {
          Router.go('register');
          Bert.alert('Your account was deleted.', 'success');
        }
      });
    }
  },

  'click .sign-out-service': function(event) {
    event.preventDefault();

    Meteor.call('signOutService', event.target.id, function(error) {
      if (error) {
        Bert.alert(error.reason, 'warning');
      } else {
        Bert.alert('Service token was deleted.', 'success');
      }
    });
  },

  'click .profile-edit-btn': function(event) {
    event.preventDefault();
    var profileContainer = $('.profile');
    profileContainer.addClass('profile-edit');
    //$("#location-field").placecomplete({});

    // $("#location-field").placecomplete({
    //   width: "element",
    //   placeholderText: "Enter your location here"
    // });

    // var $el = $("#location-field"),
    //     $responseEl = $("#response");
    //
    // $el.placecomplete({
    //     width: "element"
    // });

    //var tmpl = Handlebars.compile($("#response-template").html());

    // $el.on({
    //     "placecomplete:selected": function(evt, placeResult) {
    //         var data = JSON.stringify(placeResult, undefined, 2);
    //
    //         var context = {
    //             eventType: evt.type,
    //             dataTypeHTML: "<a href='https://developers.google.com/maps/documentation/javascript/reference#PlaceResult'>Google Maps API PlaceResult</a> augmented with display_text property",
    //             data: data
    //         };
    //         $responseEl.html(tmpl(context));
    //
    //         // Add syntax highlighting via highlight.js
    //         $responseEl.find("pre code").each(function(i, el) {
    //             hljs.highlightBlock(el);
    //         });
    //     },
    //     "placecomplete:cleared": function(evt) {
    //         var context = {
    //             eventType: evt.type
    //         };
    //         $responseEl.html(tmpl(context));
    //     },
    //     "placecomplete:error": function(evt, errorMsg) {
    //         var context = {
    //             eventType: evt.type,
    //             dataTypeHTML: "<a href='https://developers.google.com/maps/documentation/javascript/reference#PlacesServiceStatus'>google.maps.places.PlacesServiceStatus</a>",
    //             data: '"' + errorMsg + '"'
    //         };
    //         $responseEl.html(tmpl(context));
    //     }
    // });
    // $el.select2("open", true);

  },

  'click .profile-edit-close': function(event) {
    event.preventDefault();
    var profileContainer = $('.profile');
    profileContainer.removeClass('profile-edit');
  }
});
