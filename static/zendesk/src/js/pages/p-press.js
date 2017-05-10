/**
* Press page functionality
*
* @class PressPage
* @constructor
*/
var PressPage = function(){

  var $scrollingDiv = $('.sidebar')
    , docHeight = $(document).height()
    , windowHeight = $(window).height()
    , nav = { onTop: true };

  /**
  * Initializes Press Page functionality
  *
  * @method init
  * @param {Boolean} enableStaticNav Whether or not to enable nav
  * @return void
  */
  function init(enableStaticNav){

    // if not a mobile device, make these available
    if (!_isMobile && document.querySelectorAll) {

      if (typeof (skrollr) !== 'undefined') {
        var s = skrollr.init({forceHeight: true});
      }

      // if nav enabled, turn on static nav and link listening
      if (enableStaticNav) {
        handleScrolling();
        handleNav();
      }

      // update window height on resize
      $(window).resize(function() {
        windowHeight = $(window).height();
      });
    }

  }

  /**
  * On scroll add the new class to the active nav and add the hash
  *
  * @method handleScrolling
  * @param void
  * @return void
  */
  function handleScrolling(){

    (function() {
      var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                  window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(callback){
                          window.setTimeout(callback, 1000 / 60);};

      window.requestAnimationFrame = requestAnimationFrame;
    })();

    function scrolling() {
      var main = $('.p-press-page .row:in-viewport')
        , y = $(window).scrollTop()
        , untilBottom = docHeight - (windowHeight + y)
        , sidebar = $('.sidebar');

      // Add 'current' class on nav item to whichever section is in the viewport
      if (main.attr('id')) {

        // if over green background, change cta font to white
        if (main.attr('id') == 'about') {
          sidebar.addClass('on-green');
        } else {
          sidebar.removeClass('on-green');
        }

        // Remove current active class
        sidebar.find('a').parent().removeClass('current');

        var inview = '#' + main.attr('id');
        sidebar.find('a[href="' + inview + '"]').parent().addClass('current');

      // If it's the first section, no need to show class current
      } else if (main.attr('class') == 'first') {

        var inview = 'div.first';

      // Otherwise, let's assume we're viewing the last section
      } else {
        var inview = 'div.last';
      }

      // Move the sidebar as you scroll (imitates position fixed)
      if (untilBottom > 500) {
        var top = ((y + 1) < 0) ? 0 : (y + 1);
        $scrollingDiv.css({'margin-top': top + 'px'});
      }

      // Change the hash depending on what section we're in
      var startPoint = $(inview).offset().top
        , endPoint = startPoint + 30;

      if (y > startPoint && y < endPoint) {
        if (location.hash != inview) {
          location.hash = (inview == 'div.last' || inview == 'div.first') ? 'page' : inview;
        }
      }

      // If away from top, shrink padding of nav
      if (y > 250) {

        if (nav.onTop) {
          $scrollingDiv
            .clearQueue()
            .animate({'padding-top':30}, 400);
          nav.onTop = false;
        }

      // Otherwise, let's restore nav padding to dock it in the header
      } else {

        $scrollingDiv
          .clearQueue()
          .animate({'padding-top':300}, 100);
        nav.onTop = true;

      }

      requestAnimationFrame(scrolling);
    }
    scrolling();
  }

  /**
  * Handle clicking on nav links in sidebar
  *
  * @method handleNav
  * @param void
  * @return void
  */
  function handleNav(){
    $('.sidebar a').click(function(event){
      var element = $(this)
        , locationHref = location.href
        , elementClick = $(element).attr('href')
        , destination = $(elementClick).offset().top - 75;

      $('.sidebar li').removeClass('current');
      $('html,body').animate({ scrollTop: destination}, 600, 'easeOutBack');
      location.hash = elementClick;
      element.parent().addClass('current');

      // Stop links default events
      event.preventDefault();

      return false;
    });
  }

  return {
    init: init
  };

}();
