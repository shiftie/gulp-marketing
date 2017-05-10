 /*
  *
  * Fetch Bizo profile data and add it to lead gen forms
  *
  */

var Chat = {
  init: function() {
    var self = this
      , isIE8 = $('html').hasClass('ie8');

    if (window.webutils) {
      webutils.showCTA('a.cta.zopim', '/agent/admin/chat');
    } else {
      $('a.cta.zopim').show();
    }

    if (!_isMobile && !isIE8) {
      skrollr.init({
        forceHeight: false
      });
    }

    $('.carousel-content .carousel-paddles a').on('click', function(){
      self.setScreen($(this));
    });
    $('.carousel-tabs a').on('click', function(){
      self.setMenu($(this));
    });
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
        .css({'opacity':0})
        .removeClass('active')
        .find('.popover')
        .hide();
      target
        .css({'opacity':1})
        .addClass('active');
      self.animatePin(target.find('.popover'));
      button.parent().parent().find('.active').removeClass('active');
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
      , active = parent.find('.active')
      , index  = active.index() + 2
      , count  = parent.find('li').length
      , target
      , menu;

    if (button.attr('class') === 'carousel-paddles-lt')
      index = index - 2;
    if (index > count)
      index = 1;
    else if (index < 1)
      index = count;

    target = parent.find('li:nth-child(' + index + ')');

    active
      .css({'opacity':0})
      .removeClass('active')
      .find('.popover')
      .hide();

    target
      .css({'opacity':1})
      .addClass('active');

    self.animatePin(target.find('.popover'));

    menu = parent.parent().parent().find('.carousel-tabs');

    menu
      .find('.active').removeClass('active')
      .end()
      .find('ul li:nth-child(' + index + ') a')
      .addClass('active');
  },

  /**
   *
   * Set slide from menu
   *
   * @params (button:element) button that was clicked
   *
   */

  setMenuInfo: function(button) {
    var parent = button.parent(),
      active = parent.find('.active'),
      index  = button.parent().index() + 1,
      target,
      wrapper;

    wrapper = parent.parent().parent().parent();
    target  = wrapper.find('.carousel-content li:nth-child(' + index + ')');

    wrapper
      .find('.carousel-content li.active')
      .css({'opacity':0})
      .removeClass('active')
      .find('.popover')
      .hide();

    target
      .css({'opacity':1})
      .addClass('active')
      .find('.magnify')
      .css({ 'display': 'block', 'margin-top':'+=30', 'opacity':0 })
      .delay(400)
      .animate({ 'opacity': 1, 'margin-top':'-=30' }, 300, function(){
        $(this).find('.info').animate({
          'top':'-=6',
          'opacity':'1'
        }, 100, function() {
          $(this).animate({
            'top':'+=6'
          }, 250);
        });
      })
      .find('.info')
      .css({ 'opacity':0 });

    button.parent().parent().find('.active').removeClass('active');
    button.addClass('active');
  },

  /**
   *
   * Scroll through slides using nav arrows
   *
   * @params (button:element) button that was clicked
   *
   */

  setScreenInfo: function(button) {
    var parent = button.parent().parent(),
      active = parent.find('.active'),
      index  = active.index() + 2,
      count  = parent.find('li').length,
      target;

    if (button.attr('class') === 'carousel-paddles-lt')
      index = index - 2;

    if (index > count)
      index = 1;
    else if (index < 1)
      index = count;

    target = parent.find('li:nth-child(' + index + ')');

    active
      .css({'opacity':0})
      .removeClass('active')
      .find('.popover')
      .hide()
      .end()
      .find('.magnify')
      .hide();

    target
      .css({'opacity':1})
      .addClass('active');

    target.find('.magnify')
      .css({ 'display': 'block', 'margin-top':'+=30', 'opacity':0 })
      .delay(400)
      .animate({ 'opacity': 1, 'margin-top':'-=30' }, 300, function(){
        $(this).find('.info').animate({
          'top':'-=6',
          'opacity':'1'
        }, 100, function() {
          $(this).animate({
            'top':'+=6'
          }, 250);
        });
      })
      .find('.info')
      .css({ 'opacity':0 });

    var menu = parent.parent().parent().find('.carousel-tabs');

    menu
      .find('.active').removeClass('active')
      .end()
      .find('ul li:nth-child(' + index + ') a')
      .addClass('active');
  },

  /**
   *
   * Animate a slide pin from the correct direction
   *
   * @params (pin:element) document element
   *
   */

  animatePinInfo: function(pin) {
    setTimeout(function(){
      pin
        .css({'left':'+=15', 'opacity':0, display: 'block'})
        .show()
        .animate({'left':'-=23', 'opacity':1}, 200, function(){
          $(this).animate({
            'left':'+=8'
          }, 100);
        });
    }, 300);
  }
};
