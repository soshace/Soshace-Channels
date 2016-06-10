Meteor.subscribe('publicUserData');

Template.sidebar.helpers({
  channels: function() {
    var currentUser = Meteor.userId();
    return Channels.find({
      createdBy: currentUser
    }, {
      sort: {
        createdAt: -1
      }
    });
  },

  guestchannels: function() {
    var currentUser = Meteor.userId();
    return Channels.find({
      members: currentUser
    }, {
      sort: {
        createdAt: -1
      }
    });
  },

  currentUserLoaded: function(){
    deps.depend();
    console.log(Meteor.userId());
    return Meteor.userId();
  }
});

Template.sidebar.onRendered(function() {
  handleSidebarMenu();
  handleActiveSidebarMenuItem();
});

function handleSidebarMenu() {
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
}

function handleActiveSidebarMenuItem() {
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
}
