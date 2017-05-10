/**
* Carousel interactions and elevator up/down animation
* @author  Stephany Varga
* @since   01/15/15
* @class   BrandPage
*/
var BrandPage = {

  init: function() {

    var self = this
      , isIE8 = $('html').hasClass('ie8');

    // if not a mobile device, make these available
    // if (!_isMobile && !isIE8) {
      /*var s = skrollr.init({
        forceHeight: false
      });*/
    // }

    $('.paddle-down').on('click', function(){
      $('.mini-menu li a.first-item').click();
    });

    // Init lightbox carousel
    $('#main.brand-guide.bg-minor article.list a').on('click', function(){
      self.setLightbox($(this));
      return false;
    });

    // Carousel controls - Set screen on click
    $('#lightbox-carousel .carousel-content .carousel-paddles a').on('click', function(){
      self.setScreen($(this), false);
      return false;
    });
    $('#lightbox-carousel .lightbox').on('click', function() {
      $('.carousel-content-item iframe').attr('src', '');
      $('#lightbox-carousel').fadeOut();
      $('.carousel-paddles').fadeOut();
    });

    if ($('#main').hasClass('landing')) {
      // Sidebar click
      $('.brand-guide .sidebar ul li a').on('click', function(){
        var thisAnchor = $(this).data('anchor');
        self.activateStyles($(this));
        self.scrollToAnchor(thisAnchor);
        self.setLocationHash(thisAnchor);
      });

      if (location.hash) {
        if (location.hash !== '#') {
          var locHash = location.hash;
          locHash = locHash.replace('#', '');
          self.scrollToAnchor(locHash);
        }
      }

      // Activate and change hash when in viewport
      window.setTimeout(function(){
        window.setInterval(function(){
          var main = $('#main article:in-viewport')
            , thisNavItem = ''
            , viewedArticleClass = '';
          if (main.attr('class') !== undefined) {
            viewedArticleClass = main.attr('class');
            if (viewedArticleClass == 'hero') {
              thisNavItem = $('.brand-guide .sidebar ul li#firstMenuItem a');
              self.activateStyles(thisNavItem);
              self.setLocationHash('');
            } else {
              $('.brand-guide .sidebar ul li a').each(function(){
                if ($(this).data('anchor') == viewedArticleClass) {
                  thisNavItem = $(this);
                }
              });
              self.activateStyles(thisNavItem);
              self.setLocationHash(viewedArticleClass);
            }
          }
        }, 500);
      }, 1000);
    }

  },

  /**
   *
   * Add URL hash
   *
   * @method activateStyles
   * @params (anchorTag:string) the ID name of the anchor that should be added to the URL as a hash
   *
   */
  setLocationHash: function(anchorTag) {
    window.location.hash = '#'+anchorTag;
  },

  /**
   *
   * Set the active state on the sub nav
   *
   * @method activateStyles
   * @params (elToActivate:object) the object to activate
   *
   */
  activateStyles: function(elToActivate) {
    $('.brand-guide .sidebar ul li').removeClass('active');
    $('.brand-guide .sidebar ul.mini-menu li').removeClass('active');
    elToActivate.parent().addClass('active');
  },

  /**
   *
   * Scroll to a particular point on the page
   *
   * @method scrollToAnchor
   * @params (anchorTag:string) the ID name of the anchor that will be scrolled to
   *
   */
  scrollToAnchor: function(anchorTag) {
    if (anchorTag == 'top') {
      $('html,body').animate({scrollTop: 0}, 'slow');
    } else {
      $('html,body').animate({scrollTop: $('.'+anchorTag).offset().top}, 'slow');
    }
  },

  /**
   *
   * Scroll through slides using nav arrows
   *
   * @method setScreen
   * @params (idName:element) the ID name of the item that needs to be displayed or the actual button element clicked (prev or next)
   * @params (firstInit:boolean) is this the first time the lightbox was initialized
   *
   */
  setScreen: function(idName, firstInit) {

    var self   = this
      , target
      , videoID = '';

    if (firstInit) {
      target = $('#' + idName);
      $('.carousel-content .active')
        .hide()
        .css({'opacity':0})
        .removeClass('active');
      target
        .show()
        .css({'opacity':1})
        .addClass('active');
      if ($('#main').hasClass('bg-video')) {
        videoID = target.find('span').data('video');
        target
          .children().find('iframe')
          .attr('src', '//fast.wistia.net/embed/iframe/'+ videoID +'?autoPlay=true&videoWidth=640&videoHeight=360');
      }
    } else {
      var parent = idName.parent().parent()
        , active = parent.find('.active')
        , index  = active.index() + 2
        , count  = parent.find('li').length;
      if (idName.attr('class') === 'carousel-paddles-lt')
        index = index - 2;
      if (index > count)
        index = 1;
      else if (index < 1)
        index = count;
      target = parent.find('li:nth-child(' + index + ')');
      $('.carousel-content .active')
        .hide()
        .css({'opacity':0})
        .removeClass('active');
      if ($('#main').hasClass('bg-video')) {
        $('.carousel-content .active')
          .children().find('iframe')
          .attr('src', '');
      }
      target
        .show()
        .css({'opacity':1})
        .addClass('active');
      if ($('#main').hasClass('bg-video')) {
        videoID = target.find('span').data('video');
        target
          .children().find('iframe')
          .attr('src', '//fast.wistia.net/embed/iframe/'+ videoID +'?autoPlay=true&videoWidth=640&videoHeight=360');
      }
    }
  },

  /**
   *
   * Show lightbox and display correct item in carousel
   *
   * @method setLightbox
   * @params (e:element) element that was clicked
   *
   */
  setLightbox: function(e) {
    var self   = this;
    self.setScreen(e.attr('class'), true);
    $('#lightbox-carousel').fadeIn();
    $('.carousel-paddles').fadeIn();
  }

};
