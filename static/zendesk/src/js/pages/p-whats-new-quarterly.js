$(function(){
  $(window).scroll();

  $(".controls, .section-row-header").on('click', function(){
    if ($(this).parent().hasClass('open')){
      $(this).parent().removeClass('open').addClass('closed');
    } else {
      $(this).parent().removeClass('closed').addClass('open');
    }
  });

  var liveNavigation = {};

  // Store references to the nav link containers and sections
  liveNavigation.navLinksContainer = $(".container-nav-links");
  liveNavigation.copySections = $(".copy-section");
  liveNavigation.currentSection = "support";

  liveNavigation.updateLinks = function(target) {
    if (target === liveNavigation.currentSection) return;

    liveNavigation.navLinksContainer.children(".nav-link").removeClass("active");
    liveNavigation.navLinksContainer.children("[href='#"+ target + "']").addClass('active');

    liveNavigation.currentSection = target;
  };

  liveNavigation.changeWithScroll = function() {
    var newSection = true;

    liveNavigation.copySections.each(function(i,e) {
      if (window.pageYOffset - $(e).offset().top < 0) {
        newSection = $(liveNavigation.copySections[i-1]).attr('id');
        liveNavigation.updateLinks(newSection);
        return false;
      }
    });
    // if we've scrolled past everything (and not short circuted), we're probably on Connect
    if (newSection === true) {
      liveNavigation.updateLinks("connect");
      return false;
    }
  };

  liveNavigation.init = function() {
    // Only attach for desktops
    if (!_isMobile) {
      // Attach click listeners for the navigation
      liveNavigation.navLinksContainer.children().click(function() {
        liveNavigation.updateLinks($(this).attr('href'));
      });

      // Attach listener for the window scroll
      $(window).scroll(liveNavigation.changeWithScroll);
    }

  };

  liveNavigation.init();
});
