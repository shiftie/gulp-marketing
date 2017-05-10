/**
* @author  Alden Aikele
* @since   18/09/16
* @class   support overview
*/

var SupportPage = {

  init: function() {

    var self = this;

    // send cust domain to Heap
    webutils.trackIntent('SupportOverview');

    // if not a mobile device, make these available
    if (!_isMobile) {
      var s = skrollr.init({
        forceHeight: false
      });
    }

    // for the sticky nav
    $(window).scroll(webutils.debounce(function() {
      var offsetter = $('.nav-offsetter').offset().top
        , viewportHeight = $(window).height()
        , topper = $(document).scrollTop()
        , scroll = offsetter-viewportHeight-topper
        , menu_height = - $('.nav-sticky-menu').height();

      if (!_isMobile) {
        // HACK: Sticky menu will overlap content without significant padding
        // This is necessary so we can avoid `position: absolute` for body content
        // which breaks down on mobile
        $('.pricing-section').css({ 'padding-top': '160px' }); // /support/pricing
        $('.upper-feature').css({ 'padding-top': '80px' }); // /support/features


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
      }
    }, 10));

    //add active class to correct sub menu item
    var currentUrl = window.location.href;

    if (currentUrl.indexOf("features") > -1) {
      $(".nav-features").addClass("active");
    }
    else if ((currentUrl.indexOf("pricing") > -1) || (currentUrl.indexOf("compare") > -1)) {
      $(".nav-pricing").addClass("active");
    }
    else {
      $(".nav-overview").addClass("active");
    }
    //end active logic

    $(window).scroll();

    //start animations logic
    function isElementInViewport(elem) {
      var $elem = $(elem);

      if ($elem.length === 0) return false;

      // Get the scroll position of the page.
      var scrollElem = ((navigator.userAgent.toLowerCase().indexOf('webkit') != -1) ? 'body' : 'html');
      var viewportTop = $(scrollElem).scrollTop();
      var viewportBottom = viewportTop + $(window).height();

      // Get the position of the element on the page.
      var elemTop = Math.round($elem.offset().top);
      var elemBottom = elemTop + $elem.height();

      return ((elemTop < viewportBottom) && (elemBottom > viewportTop));
    }

  // start animation when in viewort.
    function checkAnimation(elem) {
      var $elem = $(elem);

      // If the animation has already been started
      if ($elem.hasClass('start')) return;

      if (isElementInViewport($elem)) {
        // Start the animation
        $elem.addClass('start');
      }
    }

    //scroll animation for features page
    if ($('.support-features').length) {
      $(window).scroll(webutils.debounce(function() {
        checkAnimation('.help-desk');
        checkAnimation('.help-features');
      }, 30));
    } else { //scroll animation for overview page
      $(window).scroll(webutils.debounce(function() {
        checkAnimation('.flexible-support');
        checkAnimation('.people-support');
      }, 30));
    }

    if (window.webutils) {
      webutils.updateFeaturePriorities('support');
      webutils.trackHomeTest('support');
    }

    //FAQ section//
    $('.faq-contain').each(function(i, obj) {
      var $faqContain = $(this).height();

      if ($faqContain > 99){
        $(this).find(".exp-btn").css('margin-top', "-62px");
      }

      if ($faqContain > 79 && $faqContain < 99){
        $(this).find(".exp-btn").css('margin-top', "-54px");
      }

      if ($faqContain > 59 && $faqContain < 79){
        $(this).find(".exp-btn").css('margin-top', "-41px");
      }

      if ($faqContain > 49 && $faqContain < 59){
        $(this).find(".exp-btn").css('margin-top', "-41px");
      }

      else if ($faqContain > 22 && $faqContain < 49) {
        $(this).find(".exp-btn").css('margin-top', "-32px");
      }
    });

    // expand faq answer
    $('.faq-contain').click(function(){
      var $par = $(this).closest("li");

      $(this).toggleClass("faq-contain-grey");
      $par.find(".faq-p").slideToggle("fast", "linear");

      setTimeout(function() {
        $par.find(".exp-plus").toggle();
        $par.find(".exp-mns").toggle();
      }, 307);
    });

    // animate expand button
    $('.faq-contain').toggle(function() {
      var $par = $(this).closest("li");

      $par.find('.exp-plus').animate({  borderSpacing: -90 }, {
        step: function(now,fx) {
          $(this).css('-webkit-transform', 'rotate('+now+'deg)');
          $(this).css('-moz-transform', 'rotate('+now+'deg)');
          $(this).css('transform', 'rotate('+now+'deg)');
        },
      duration:'medium'
      }, 'linear');
     },
    function() {
      var $par = $(this).closest("li");

      $par.find('.exp-mns').animate({  borderSpacing: -180 }, {
        step: function(now,fx) {
          $(this).css('-webkit-transform', 'rotate('+now+'deg)');
          $(this).css('-moz-transform', 'rotate('+now+'deg)');
          $(this).css('transform', 'rotate('+now+'deg)');
        },
      duration:'medium'
      }, 'linear');
    });
  }

};

$(document).ready(function(){
  SupportPage.init();
});
