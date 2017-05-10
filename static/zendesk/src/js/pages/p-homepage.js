/**
 * Registration form language strings used on the home page.
 */
var _lang = {
  selected: 'en',
  register: {
    emailinvalid: 'Enter a valid email address',
    supportemail: "Please don't use your support address to signup",
    password: 'Enter at least 5 characters',
    passwordchars: 'Password can contain letters, numbers,<br>and any of the following: !@#$^&amp;*()_+.-'
  }
};

/**
* Provides JavaScript handlers and listeners for elements on the Zendesk Home Page Tour
*
* @class HomePageTour
*/
var HomePageTour = {
/**
  * Check width of viewport and add class depending on size
  *
  * @method checkWidth
  * @param {string} selector the class or id name of the css selector
  * @param {string} classToAdd the name of the class to add/remove
  * @return void
  */
  checkWidth: function(selector,classToAdd) {
    var winWidth = $(window).width();
    if (winWidth < 750) {
      $('.'+selector).removeClass(classToAdd);
    } else {
      $('.'+selector).addClass(classToAdd);
    }
  },

  init: function() {
    var self = this;

    self.checkWidth('mod-buddhy', 'mod-buddhy-left');

    // if not a mobile device, make these available
    if (_isMobile) {
      $('body').addClass('mobile-device');
    } else {
      if (self.isAudience(['ENT', 'MM'])) {
        $('.ent-splash').show(); // show enterprise module for mobile users
      }

      var s = skrollr.init({forceHeight: true});
    }

    $(window).resize(function(){
      self.checkWidth('mod-buddhy', 'mod-buddhy-left');
    });
  },

  /**
  * Show promotion to enterprise visitors who haven't opted out
  *
  * @method showPromo
  */
  showPromo: function(){
    var self = this;

    if (window.location.host === 'www.zendesk.com' && !_isMobile && !$.cookie('sitewide_alert')) {
      var qualified = self.isAudience(['ENT', 'MM', 'none']);

      if (qualified) {
        var message = '<div class="sitewide event alert"><div class="wrap"><div class="body"><span class="message"><span class="title"><div class="icon"><img src="//d1eipm3vz40hy0.cloudfront.net/images/m-alert/sitewide-illuminate.png" width="20" height="20"></div>ILLUMINATE</span><span class="pipe">|</span><span class="sub">A Strategic Approach to Customer Engagement<span class="pipe">|</span>Live Stream today at 3:00 p.m. ET<a class="link redirect" target="_blank" href="//www.zendesk.com/company/events">Watch it here</a></span></span><a class="js-disable close ent-text" href="javascript:;"></a></div></div></div>';

        $('body').prepend(message);

        if (typeof ga !== 'undefined') {
          ga('send', 'event', 'illuminate banner', 'show', null, {'nonInteraction': 1});
        }

        // hide popup
        $('.alert .js-disable').on('click', function(){
          $('.sitewide.alert').animate({'margin-top':'-' + $('.alert.sitewide').outerHeight() + 'px'});
          $.cookie('sitewide_alert', 'disabled', {expires: 730, path: '\/', domain: 'zendesk.com'});

          if (typeof ga !== 'undefined') {
            ga('send', 'event', 'illuminate banner', 'hide', null, {'nonInteraction': 1});
          }
        });

        // log redirect
        $('.alert .redirect').on('click', function(){
          $.cookie('sitewide_alert', 'disabled', {expires: 730, path: '\/', domain: 'zendesk.com'});

          if (typeof ga !== 'undefined') {
            ga('send', 'event', 'illuminate banner', 'click', null, {'nonInteraction': 1});
          }
        });
      }
    }
  },

  /**
  * Compare given audience to Demandbase response
  *
  * @method isAudience
  * @param {array} audience array of market segment types
  */
  isAudience: function(audience){
    var match = false;

    if (typeof dbase != 'undefined') {
      var data = dbase
        , company   = data.company_name || ''
        , emplRange = data.employee_range || ''
        , segment   = 'none'
        , emplCount = data.employee_count || ''
        , ceiling;

      if (emplCount !== '') {
        ceiling = emplCount;
      } else if (emplRange !== ''){
        ceiling = emplRange.split('-')[1], segment;
      }

      if (ceiling !== 'undefined' && ceiling > 0) {
        segment = webutils.convertRangeToSegment(ceiling);
      }

      for (var i = 0; i < audience.length; i++) {
        if (audience[i] === segment) {
          match = true;
        }
      }
    }

    return match;
  }

};

/**
 * Reads the list of subdomains from cross-storage and updates the login
 * in the hero for the customer homepage.
 */
(function() {
  if (!$('ul.subdomainlogin').length || !window.webutils) return;

  // Webkit gets a scrollable list of subdomains
  if ($.browser.webkit) {
    $('ul.subdomainlogin ul').addClass('webkit');
  }

  webutils.getFormattedSubdomains().then(function(subdomains) {
    if (!subdomains || !subdomains.length) return;

    var ul, li, i, loginBtn;
    loginBtn = $('ul.subdomainlogin .login-btn');

    // If there's only 1 subdomain, we update the login button url and return
    if (subdomains.length === 1) {
      return loginBtn.attr('href', subdomains[0].url);
    }

    // Otherwise we have multiple subdomains, so we first disable click
    // behaviour on the button itself
    loginBtn.click(function(e) {
      e.preventDefault();
      return false;
    });

    // Indicate that the user has multi subdomains for styling the button
    loginBtn.addClass('multi-subdomains');

    ul = $('ul.subdomainlogin ul');
    for (i = 0; i < subdomains.length; i++) {
      li = $('<li><a href="' + subdomains[i].url + '">'
        + subdomains[i].name + '</a></li>');

      ul.append(li);
    }
  });
}());
