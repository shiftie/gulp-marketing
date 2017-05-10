/**
* Carousel interactions
* @author  Alden Aikele
* @since   03/25/14
* @class   PlusPlanPage
*/
var CareersRefresh = {

  init: function() {
    var self = this;

    /* Carousel controls - Set screen and menu on click */
    $('#ex-features .carousel-content .carousel-paddles a').on('click', function(){
      self.setScreen($(this));
    });
    $('#ex-features .carousel-tabs a').on('click', function(){
      self.setMenu($(this));
    });

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
        .removeClass('active');
      target
        .css({'opacity':1})
        .addClass('active');
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
      .removeClass('active');
    target
      .css({'opacity':1})
      .addClass('active');
    menu = parent.parent().parent().find('.carousel-tabs');
    menu
      .find('.active').removeClass('active')
      .end()
      .find('ul li:nth-child(' + index + ') a')
      .addClass('active');
  }

};
