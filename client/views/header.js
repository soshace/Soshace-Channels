Meteor.subscribe('channels');

Template.header.onRendered(function() {
  /* 01. Handle Scrollbar */
  var handleSlimScroll = function() {
      "use strict";
      $('[data-scrollbar=true]').each( function() {
          generateSlimScroll($(this));
      });
  };
  var generateSlimScroll = function(element) {
      var dataHeight = $(element).attr('data-height');
          dataHeight = (!dataHeight) ? $(element).height() : dataHeight;

      var scrollBarOption = {
          height: dataHeight,
          alwaysVisible: true
      };
      if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          $(element).css('height', dataHeight);
          $(element).css('overflow-x','scroll');
      } else {
          $(element).slimScroll(scrollBarOption);
      }
  };

  /* 02. Handle Sidebar - Menu */
  var handleSidebarMenu = function() {
      "use strict";
      $('.sidebar .nav > .has-sub > a').click(function() {
          var target = $(this).next('.sub-menu');
          var otherMenu = '.sidebar .nav > li.has-sub > .sub-menu';
          if ($('.page-sidebar-minified').length === 0) {
              $(otherMenu).not(target).slideUp(250, function() {
                  $(this).closest('li').removeClass('expand');
              });
              $(target).slideToggle(250, function() {
                  var targetLi = $(this).closest('li');
                  if ($(targetLi).hasClass('expand')) {
                      $(targetLi).removeClass('expand');
                  } else {
                      $(targetLi).addClass('expand');
                  }
              });
          }
      });
      $('.sidebar .nav > .has-sub .sub-menu li.has-sub > a').click(function() {
          if ($('.page-sidebar-minified').length === 0) {
              var target = $(this).next('.sub-menu');
              $(target).slideToggle(250);
          }
      });
  };

  /* Handle active menu item */
  var handleActiveSidebarMenuItem = function() {
      "use strict";

      $('.sidebar .nav > li').click(function() {
          var target = $(this),
              isActiveMenuItem = $('.sidebar .nav > li').hasClass('active');

          if (isActiveMenuItem) {
            var activeMenuItem = $('.sidebar .nav > li.active');
            activeMenuItem.removeClass('active');
          }

          if (target.hasClass('has-sub') && target.hasClass('expand')) {
            target.addClass('active');
          } else if (target.hasClass('has-sub') && !target.hasClass('expand')) {
            target.removeClass('active');
          } else {
            target.addClass('active');
          }
      });

      $('.sub-menu > li').click(function() {
          var target = $(this),
              isActiveMenuItem = $('.sub-menu > li').hasClass('active');
              
          if (isActiveMenuItem) {
            var activeMenuItem = $('.sub-menu > li.active');
            activeMenuItem.removeClass('active');
          }

          target.addClass('active');
      });

      // TODO: mb change for event when route is changed?
      // var currentRoute = Iron.Location.get().path;
      // console.log(currentRoute);
      // var menuItemsLinks = $('.sidebar .nav > li > a');
      // console.log(menuItemsLinks);
      //
      // menuItemsLinks.each( function() {
      //   var href = this.href.slice(21);
      //   if (currentRoute === href) {
      //     console.log(this.parent());
      //     this.parent().addClass('active');
      //   }
      // });
  };

  handleSlimScroll();
  handleSidebarMenu();
  handleActiveSidebarMenuItem();
});


Template.header.events({
  'click .logout': function(event) {
    event.preventDefault();
    Meteor.logout();
    Router.go('login');
  }
});

Template.header.helpers({
  channels: function() {
    var currentUser = Meteor.userId();
    return Channels.find({ createdBy: currentUser }, {sort: {createdAt: -1}});
  },

  guestchannels: function() {
    var currentUser = Meteor.userId();
    return Channels.find ({ members: currentUser }, {sort: {createdAt: -1}});
  }
});
