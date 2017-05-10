var CustExpMicrosite = {

  init: function() {
    var self = this,
        isIE8 = $('html').hasClass('ie8');

    // send cust domain to Heap
    webutils.trackIntent('CustExpTraining');

    // if not a mobile device, make these available
    if (!_isMobile && !isIE8) {
      var s = skrollr.init({
        forceHeight: false
      });
    }

    // for the sticky nav
    $(window).scroll(function() {
      var offsetter = $('.nav-offsetter').offset().top
        , viewportHeight = $(window).height()
        , topper = $(document).scrollTop()
        , scroll = offsetter-viewportHeight-topper
        , menu_height = - $('.nav-sticky-menu').height();

      if (scroll < menu_height) {
        $('.nav-sticky-menu').addClass('nav-scroll');
      } else {
        $('.nav-sticky-menu').removeClass('nav-scroll');
      };
      if (topper > offsetter) {
        $('.nav-sticky-menu').addClass('nav-fixed').removeClass('nav-scroll');
      } else {
        $('.nav-sticky-menu').removeClass('nav-fixed');
      };
    });

    $(window).scroll();

    $('.anchor-link').on('click', function(event){
      var element = this;
      var elementClick = $(element).attr('href');
      var destination = $(elementClick).offset().top - 100;
      $('html,body').animate({ scrollTop: destination}, 650);
      //Stop links default events
      event.preventDefault();
      return false;
    });
  }
};
