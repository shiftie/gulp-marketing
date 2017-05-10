var ChatMicrosite = {
  sidekickShown: false,

  init: function() {
    var self = this,
        isIE8 = $('html').hasClass('ie8');

    // send cust domain to Heap
    webutils.trackIntent('ChatOverview');

    // if not a mobile device, make these available
    if (!_isMobile && !isIE8) {
      var s = skrollr.init({
        forceHeight: false
      });
    }

    webutils.showCTA(
      'a.cta.trial-btn',
      '/agent/admin/chat',
      {
        event: 'enable_chat',
        subdomainListSelector: '.container-nav-links ul.subdomainlogin, .compare ul.subdomainlogin, .cta-section ul.subdomainlogin'
      }
    );

    // Pricing columns are narrow width, so truncate length of subdomains
    webutils.showCTA(
      'a.pricing-cta',
      '/agent/admin/chat',
      {
        event: 'enable_chat',
        subdomainListSelector: '.pricing-choice ul.subdomainlogin',
        truncationLength: 10
      }
    );

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

    // for sidekick dropdown
    if (!_isMobile) {

      ChatMicrosite.$sideKick = $("#chat-sidekick");
      if (ChatMicrosite.$sideKick.length) {
        $(window).scroll(ChatMicrosite.sidekickDropdown);
      }
    }

    ChatMicrosite.changeChatRegisterLang();
  },

  sidekickDropdown: function() {
    var sidekickOffset = ChatMicrosite.$sideKick.offset().top;
    var windowOffset   = window.scrollY + 81;

    if (sidekickOffset < windowOffset) {
      ChatMicrosite.$sideKick.css("opacity", 1);
      ChatMicrosite.$sideKick[0].play();
      $(window).off("scroll", ChatMicrosite.sidekickDropdown);
    }
  },


  /**
   * Determines the language on the zendesk.com page and passes that language
   * as a "lang" parameter to /app/register-chat
   */
  changeChatRegisterLang: function() {
    var tld, lang;
    tld = location.hostname.split('.').pop();

    if (tld === 'com') {
      lang = 'en';
    } else {
      lang = tld;
    }

    $('a[href*="/app/register-chat"]').each(function(i, ele) {
      var $ele = $(ele);
      var href = $ele.attr('href');

      if (href.match('lang=')) {
        href = href.replace(/lang=[a-z-.]+/i, 'lang=' + lang);
      } else {
        href += (href.match('\\?') ? '&' : '?') + 'lang=' + lang;
      }

      $ele.attr('href', href);
    });
   }
};
