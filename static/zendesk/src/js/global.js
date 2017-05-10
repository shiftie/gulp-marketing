
/*
 *
 * Global vars
 *
 */

var target, activity, timer;

/*
 * Convertro
 */

$CVO = window.$CVO || [];

function getSearchVar() {
  if(typeof($('#main form.gsc-search-box td.gsc-input input:first-child').val()) == 'undefined'){
    setTimeout(getSearchVar,50);
    return;
  }

  $('#s-page').val($('#main form.gsc-search-box td.gsc-input input:first-child').val());
}

// Add "mobile-menu" class to .masthead when we =< iPhone breakpoint (699px)
function checkBreakpointActivateMobileMenu() {

  var windowsize = $(window).width()
    , $masthead = $('.masthead')
    , $primaryMenu = $('.masthead .primary-menu');

  // TODO: This code needs to be optimized during responsive revamp
  if ( windowsize < 700 ) {
    //if the window is less than 490px wide then add class of 'mobile-menu'
    if ( !($masthead.hasClass('mobile-menu')) ) { // this can't be added to the cond'l above since it'll fire this multiple times on resize which we're trying to avoid
      $masthead.addClass('mobile-menu');
      $primaryMenu.hide();
      $('.mobile-menu').on('click', function(){
        $primaryMenu.toggle();
      });
    }
  } else if( $masthead.hasClass('mobile-menu') ) {
    $masthead.removeClass('mobile-menu');
    $primaryMenu.show();
  }
}


/*
 *
 * Detect preferred language, show alert if it's supported
 *
 */
/*
function i18nAlert() {
  if(window.location.host === 'www.zendesk.com' && !_isMobile && !$.cookie('i18n_alert')) {
    $.ajax({
      url: '/wp-content/themes/zendesk-twentyeleven/lib/i18nAlert.php',
      dataType: 'jsonp',
      success:  function(data) {
        if(typeof data != 'undefined' && typeof data.alert != 'undefined' && data.alert != 'unsupported') {
          $('body').prepend(data.alert);
          $(".masthead.transparent").css("top","60px");

          ga('send', 'event', 'i18n Dialogue', 'show', null, {'nonInteraction': 1});

          // hide popup
          $('.alert .js-disable').on('click', function(){
            $('.i18n.alert').animate({'margin-top':'-59px'});
            $(".masthead.transparent").animate({"top":"0"});
            $.cookie('i18n_alert', 'disabled', {expires: 730, path: '\/', domain: 'zendesk.com'});

            ga('send', 'event', 'i18n Dialogue', 'hide', null, {'nonInteraction': 1});
          });

          // log redirect
          $('.alert .redirect').on('click', function(){
            ga('send', 'event', 'i18n Dialogue', 'redirect', $(this).attr('data-lang'), {'nonInteraction': 1});
          });
        }
      }
    });
  }
}
*/

/**
  * Check if the device is a mobile device
  *
  * @method _isMobile
  * @param void
  * @return {Boolean} Returns true for mobile devices
  */
  var _isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));


/**
  * Check if device is a retina laptop
  *
  * @method _isRetina
  * @param void
  * @return {Boolean} Returns true for retina displays
  */
  var _isRetina = function(){
    return (('devicePixelRatio' in window && devicePixelRatio > 1) ||
      ('matchMedia' in window && matchMedia("(min-resolution:144dpi)").matches));
  };


/**
* Start dom ready listeners
*/
$(function() {
  // only show alerts on english property
  /*
  if(window.location.host === 'www.zendesk.com') {
    i18nAlert();
  }
  */

  // search init
  if (window.universeSearch) {
    universeSearch.init();
  }

  // footer search button click
  $('.search-launcher').click(function(){
    if (!window.universeSearch) return;

    var search = universeSearch.vars.$search;

    search
      .show()
      .find('.universe-search-icon')
        .css({'opacity':0})
        .animate({'opacity':1}, 400)
      .end()
      .find('.universe-search-input')
        .css({'opacity':0})
        .animate({'opacity':1}, 400);

    // autofocus cursor in search field
    if( !($('html').hasClass('ie9')) ) {
      setTimeout( function() {
        $('.universe-search-input').focus();
      }, 100);
    }
  });
});

(function() {
  var itemswidth = 0;

  // Activates mobile menu when at iPhone breakpoint
  checkBreakpointActivateMobileMenu();
  // Checks for iPhone breakpoint on scroll and activates mobile menu if returns true
  $(window).resize(checkBreakpointActivateMobileMenu);
  $(window).trigger('scroll');

  $('#menu-main .list-parent').each(function() {
    itemswidth = $(this).width() + itemswidth;
  });
}());

// Used for IE10-specific styling
document.body.setAttribute('data-useragent', navigator.userAgent);
