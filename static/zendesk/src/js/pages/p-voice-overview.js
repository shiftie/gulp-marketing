/**
* Carousel interactions
* @author  Alden Aikele
* @since   11/14/14
* @class   VoicePage
*/

var VoicePage = {

  init: function() {
    var self = this
      , isIE8 = $('html').hasClass('ie8');

    // send cust domain to Heap
    webutils.trackIntent('Voice');

    //show customer login
    if (window.webutils) {
      webutils.showCTA('a.cta.free-trial', '/agent/admin/voice', {
        event: 'enable_voice'
      });
    } else {
      $('a.cta.free-trial').show();
    }

    // if not a mobile device, make these available
    if (!_isMobile && !isIE8) {
      var s = skrollr.init({
        forceHeight: false
      });
    }

    // for the sticky nav
    $(window).scroll(function() {
      var topper = $(document).scrollTop()
        , offsetter = $('.nav-offsetter').offset().top;

      if (topper > offsetter) {
        $('.nav-sticky-menu').addClass('nav-fixed');
      } else {
        $('.nav-sticky-menu').removeClass('nav-fixed');
      }
    });
  }
};
