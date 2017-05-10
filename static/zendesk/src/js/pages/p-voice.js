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

    $('.get-started-cta').on('click', function(){
      var thisAnchor = $(this).attr('href');
      self.gotoAnchor(thisAnchor);
      return false;
    });

    // if not a mobile device, make these available
    if (!_isMobile && !isIE8) {
      var s = skrollr.init({
        forceHeight: false
      });
    }

      //compare table
    $(function(){
      $('.js-compare').on('click', function(){
        $('.voice-compare').slideDown(4000);
        $('html, body').animate({
          scrollTop: $('.voice-compare').offset().top - 75
        }, 1000);
      });
    });

    $(window).load(function(){
      $(window).scroll(function() {
        var topper = $(document).scrollTop()
          , offsetter = $('.compare-table-key-offsetter').offset().top -75;

        if (topper > offsetter) {
          $('.compare-table-key').addClass('js-compare-table-stick');
        } else {
          $('.compare-table-key').removeClass('js-compare-table-stick');
        }
      });
    });

    /* Carousel controls - Set screen and menu on click */
    $('#ex-features .carousel-arrows a').on('click', function(){
      self.setScreen($(this));
    });

    $('#ex-features .carousel-tabs a').on('click', function(){
      self.setMenu($(this));
    });

    /* Bottom More Features CTA Phone Hover animation */
    $('.ent-templ .feature.signup .cta .button-dark, .ent-templ .feature.signup span.phonenum').hover(
      function(){
        $('.ent-templ .feature.signup .cta .button-dark').stop(true, true).animate({textIndent: '-600px'}, 'slow');
        $('.ent-templ .feature.signup span.phonenum').stop(true, true).animate({textIndent: '0'}, 'slow');
      },
      function(){
        $('.ent-templ .feature.signup .cta .button-dark').stop(true, true).animate({textIndent: '0'}, 'slow');
        $('.ent-templ .feature.signup span.phonenum').stop(true, true).animate({textIndent: '600px'}, 'slow');
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
  },

  /**
   *
   * Scroll to anchor
   *
   * @method gotoAnchor
   * @params (anchorID:string) the name of the anchor to scroll to
   *
   */
  gotoAnchor: function(anchorID) {
    var aTag = $("div[name='"+ anchorID +"']");
    $('html,body').animate({scrollTop: aTag.offset().top - 110}, 'slow');
  },

  /**
   *
   * Animate a slide pin from the correct direction
   *
   * @method animatePin
   * @params (pin:element) document element
   *
   */
  animatePin: function(pin){
    var cls   = pin.attr('class')
      , dir   = cls.substr(cls.lastIndexOf(' ') + 1)
      , start
      , end;
    if (dir === 'popover-pos-top' || dir === 'popover-pos-bottom') {
      if (dir === 'popover-pos-top') {
        start = '+=20';
        end   = '-=20';
      }
      if (dir === 'popover-pos-bottom') {
        start = '-=20';
        end   = '+=20';
      }
      setTimeout(function(){
        pin
          .css({'top':start, 'opacity':0})
          .show()
          .animate({'top':end, 'opacity':1}, 300);
      }, 300);
    } else if (dir === 'popover-pos-left' || dir === 'popover-pos-right') {
      if (dir === 'popover-pos-left') {
        start = '+=20';
        end   = '-=20';
      }
      if (dir === 'popover-pos-right') {
        start = '-=20';
        end   = '+=20';
      }
      setTimeout(function(){
        pin
          .css({'left':start, 'opacity':0})
          .show()
          .animate({'left':end, 'opacity':1}, 300);
      }, 300);
    }
  },

  /**
   *
   * Set slide from menu
   *
   * @method setMenu
   * @params (button:element) button that was clicked
   *
   */
  setMenu: function(button) {
    var self    = this
      , parent  = button.parent()
      , active  = parent.find('.active')
      , index   = button.parent().index() + 1
      , wrapper = parent.parent().parent().parent()
      , target  = wrapper.find('.carousel-content li:nth-child(' + index + ')');

      wrapper
        .find('.carousel-content li.active')
          .removeClass('active');
      target
        .addClass('active');

      button
        .parent()
        .parent()
        .find('.active')
          .removeClass('active');

      button.addClass('active');
  },

  /**
   *
   * Scroll through slides using nav arrows
   *
   * @method setScreen
   * @params (button:element) button that was clicked
   *
   */
  setScreen: function(button) {
    var self   = this
      , parent = button.parent().parent()
      , active = parent.find('.carousel-content-item.active')
      , index  = active.index() + 2
      , count  = parent.find('.carousel-content li').length
      , target
      , menu;

    if (button.attr('class') === 'voice-icon arrow-up') {
      index = index - 2;
    }
    if (index > count) {
      index = 1;
    } else if (index < 1) {
      index = count;
    }

    target = parent.find('li:nth-child(' + index + ')');

    active
      .removeClass('active');
    target
      .addClass('active');

    var menu = parent.parent().parent().find('.carousel-tabs');

    menu
      .find('.active')
        .removeClass('active')
        .end()
      .find('ul li:nth-child(' + index + ') a')
        .addClass('active');
  }
};
