/**
* Explore Page
*/

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function () {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
      || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function (callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () { callback(currTime + timeToCall); },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
} ());

var Explore = {
  // Taken from http://stackoverflow.com/a/25937118/488325
  // Outputs coresponding event for transitionend
  transitionEnd: function exploreTransitionEnd() {
    var el = document.createElement('div');
    var transEndEventNames = {
      WebkitTransition: 'webkitTransitionEnd',
      MozTransition: 'transitionend',
      OTransition: 'oTransitionEnd otransitionend',
      transition: 'transitionend'
    };

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return transEndEventNames[name];
      }
    }

    return false;
  },
  tabs: {
    overview: {
      menuEl: $('header.submenu .submenu-overview'),
      tabEl: $('.tab.overview'),
      title: document.title,
      activeCb: function () {
        this.scrollHandler();
      }
    },
    features: {
      menuEl: $('header.submenu .submenu-features'),
      tabEl: $('.tab.features'),
      title: document.title,
      submenu: true,
      activeCb: function () {
        this.defaultFilter = 'all';
        this.$connectorsFilter = $('.mod-wrapper.filters nav ul');
        this.$connectors = $('.mod-wrapper.connectors .connectors .connector');
        this.$connectorsContainer = $('.mod-wrapper.connectors .connectors ul');
        this.$hiddenConnectors = $('.mod-wrapper.connectors .hidden');
        this.applyConnectorsFilter.apply(this, arguments);
      },
      inactiveCb: function () {
        this.defaultFilter = undefined;
        this.$connectorsFilter = undefined;
        this.$connectors = undefined;
        this.$connectorsContainer = undefined;
        this.$hiddenConnectors = undefined;
      }
    },
    resources: {
      menuEl: $('header.submenu .submenu-resources'),
      title: document.title,
      tabEl: $('.tab.resources')
    }
  },
  disableMenuAJAX: true,
  init: function exploreInit() {
    // Cache static selectors.
    this.$body = $('body');
    this.$window = $('window');
    this.$root = $('.explore-page');
    this.$topMenu = $('.masthead-stuck-target');
    this.$submenu = $('header.submenu');
    this.$heroVideo = $('#hero-video');
    this.$submenuWrap = this.$submenu.children('.banner-wrap');
    this.$mobileTrigger = this.$submenu.find('.mobile-trigger');
    this.$tabber = $('.tabber');

    // Constants
    this.defaultPage = 'overview';
    this.transitionTime = 250;
    this.topMenuHeight = 75;
    this.tEnd = this.transitionEnd();
    this.scrollTimeout;

    // Wait for the page to be ready
    window.onload = function () {
      this.setupOptions();
      this.bindings();
      this.kickstart();
      this.setupStickyNav();
      this.registerFieldHandlers();

      if (!_isMobile) {
        this.s = skrollr.init({
          forceHeight: false
        });
      }
    }.bind(this);
  },
  setupStickyNav: function() {
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

    $(window).scroll();
  },
  validateField: function(target) {
    var valid = webutils.isFieldValid(target);
    var pin   = target.parent().find('label');
    var fade  = !(pin.css('opacity') === '1');

    if (!valid) {
      pin
        .css({'opacity' : !fade ? 1 : 0, 'display' : 'block'})
        .animate({'opacity' : 1}, 300);

      target
        .removeClass('set')
        .parent()
        .addClass('error');
    } else {
      pin.animate({'opacity': 0}, 200, function() {
        $(this).hide();
        target.parent().removeClass('error');
      });
      target.addClass('set');
    }
    // only show subdomain field if they're a customer/trialer
    if (target.hasClass('customer')) {
      if (target.children('option:selected').val() !== 'No') {
        $('.subdomain-field').show();
        $('.company-subdomain').addClass('required');
      }
      else {
        $('.subdomain-field').hide();
        $('.company-subdomain').removeClass('required').parent().removeClass('error');
      }
    }
    return valid;
  },
  registerFieldHandlers: function() {
    var timeout;
    var processing = false;
    var DEFAULT_NAME = 'unknown';

    var keyupHandler = function () {
      var target = $(this);

      if (target.attr('data-state') !== 'active') return;

      clearTimeout(timeout);

      timeout = setTimeout(function() {
        Explore.validateField(target);
      }, 800);
    };

    var blurHandler = function() {
      var target = $(this);

      target.attr('data-state', 'active');
      Explore.validateField(target);
    };

    var nameHandler = function() {
      var name = webutils.escapeHTML($(this).val()) || '';
      var split = webutils.splitName(name);

      $('#FirstName').val(split[0] || DEFAULT_NAME);
      $('#LastName').val(split[1] || DEFAULT_NAME);
    };

    var selectHandler = function() {
      var target = $(this);

      target.attr('data-state', 'active');
      Explore.validateField(target);

      var content = webutils.escapeHTML(target.val()) + '<span class="toggle"></span>';
      target.siblings('.select-label').html(content);
    };

    var submitHandler = function(){
      if (!processing) {
        Explore.registerLead();
      }

      processing = true;
    };

    $('#early-access-explore')
      .on('keyup', 'input.required', keyupHandler)
      .on('blur', 'input.required', blurHandler)
      .on('blur', '[name="owner\\[name\\]"]', nameHandler)
      .on('change', 'select', selectHandler)
      .on('click', '.btn-eap-submit', submitHandler);

    $('.eap-nav').click(function(e) {
      e.preventDefault();
      var target = Explore.getTargetTop($(this));
      $('html, body').animate({scrollTop:target}, 650);
    });
  },
  registerLead: function() {
    var form     = $('#early-access-explore'),
        required = form.find('.required');

    for (var i = 0; i < required.length; i++) {
      Explore.validateField($(required[i]));
    }

    var delay = setTimeout(function(){
      if ($('#early-access-explore ul li.error').length === 0) {
        $('html, body').animate({
          scrollTop: $(".early-access-signup").offset().top
        }, 2000);

        $('#early-access-explore .loading').css({ 'display': 'table' });
        $('#early-access-explore ul').animate({ opacity: 0.1 }, 200);

        webutils.createLead('#early-access-explore');
        webutils.track('Marketing - Lead - Explore EAP');

        if (window.dataLayer) {
          dataLayer.push({'event': 'explore_signup'});
        }

        setTimeout(function(){
          $('#early-access-explore li').css('opacity', 0);
          $('#early-access-explore .loading').addClass('success')
            .find('.loading-img')
            .css({'background-image':'url(//d1eipm3vz40hy0.cloudfront.net/images/signup/icon-checkmark.png)', 'background-repeat':'no-repeat', 'background-position':'50%','background-color':'#fff', 'height':'66px','width':'66px'})
            .parent()
            .find('p')
            .html($("#explore-early-access-success > span"))
            .parent()
            .animate({
              'opacity':1,
              'width':205,
              'left':-1
            }, 200)
            .parent();
          $('#early-access-explore li').animate({ height: 0 }, 1000);
        }, 10000);
      }
    }, 250);
  },
  getTargetTop: function(target){
    var id = target.attr("href"),
      offset = 90;

    return $(id).offset().top - offset;
  },
  kickstart: function exploreKickstart() {
    this.scrollHandler();
    this.hashHandler();
  },
  setupOptions: function exploreSetupOptions() {
    this.scroll = this.getScroll();

    this.$heroVideo[0].play();

    // Use the $tabber element because
    // the $submenu one becomes fixed half way through
    this.submenuOpts = this.setupElement(this.$tabber[0]);
  },
  activeVideoCallback: function exploreActiveVideoCallback(opts) {
    opts.el.play();
  },
  inactiveVideoCallback: function exploreInactiveVideoCallback(opts) {
    opts.el.pause();
    opts.el.currentTime = 0;
  },
  hashHandler: function exploreHashHandler() {
    var hash, route, pageName;
    // Get the current hash
    if (window.location.hash) {
      var ar = window.location.hash.substring(1).split('/');
      hash = ar.pop();
    }

    // Get the current route
    route = document.location.pathname
      // Remove preceding and following slashes
      .replace(/(^\/+|\/+$)/g, '')
      .split('/')
      .pop();

    if (route === 'explore') {
      route = undefined;
    }

    pageName = route || this.defaultPage;

    this.applyPage(pageName, hash);
  },
  setMenu: function exploreSetMenu(pageName) {
    var tab = this.tabs[pageName];
    // Update menu
    this.$submenu.addClass('no-click');
    this.$submenu.find('.active').removeClass('active');
    tab.menuEl.addClass('active');
  },
  applyPage: function exploreApplyPage(pageName) {
    var previousTabName, previousTab;
    var args = Array.prototype.slice.call(arguments);
    var tab = this.tabs[args.shift()];

    // Get the previous tab if present
    if (this.$tabber.children('.active').length) {
      previousTabName = this.$tabber.children('.active').attr('class')
        .replace(/ ?(tab|active) ?/g, '');
      previousTab = this.tabs[previousTabName];
    }

    this.setMenu(pageName);

    // If we're on the same page, only execute active callback if needed.
    if (previousTab === tab) {
      if ((tab.submenu && typeof tab.activeCb === 'function') ||
        (!tab.submenu && typeof tab.activeCb === 'function')) {
        tab.activeCb.apply(this, args);
      }
      this.$submenu.removeClass('no-click');
      return;
    }

    this.$tabber.height(previousTab.tabEl.height());
    this.doTabAnimation(tab, previousTab);

    // Listen for the end of the animation.
    if (!this.tEnd) {
      // Fallback to simple setTimeout if no transitionend event is available.
      setTimeout(this.endTabAnimation.bind(this, tab, previousTab, args), this.transitionTime);
      return;
    }

    tab.tabEl
      .off(this.tEnd)
      .on(this.tEnd, function () {
        this.endTabAnimation(tab, previousTab, args);
        if (this.s) {
          this.s.destroy();
          this.s = skrollr.init({
            forceHeight: false
          });
        }
      }.bind(this));
  },
  doTabAnimation: function exploreDoTabAnimation(tab, previousTab) {
    // Update element
    if (previousTab) {
      previousTab.tabEl.addClass('prepare-out');
    }

    tab.tabEl.addClass('prepare-in');

    // Force the content height.
    this.$tabber.height(tab.tabEl.height());

    // Launch animation
    requestAnimationFrame(function () {
      tab.tabEl.addClass('in');
      if (previousTab) {
        previousTab.tabEl.addClass('out');
      }
    }.bind(this));
  },
  endTabAnimation: function exploreEndTabAnimation(tab, previousTab, args) {
    tab.tabEl.off(this.tEnd);

    // Cleaning classes.
    this.$tabber
      .height('auto')
      .children()
      .removeClass('active out in prepare-in prepare-out');
    this.$submenu.removeClass('no-click');

    // Assigning the active one.
    tab.tabEl.addClass('active');

    // Execute the inactive callback
    if (previousTab && typeof previousTab.inactiveCb === 'function') {
      previousTab.inactiveCb.apply(this, args);
    }

    // Execute the active callback
    if (typeof tab.activeCb === 'function') {
      tab.activeCb.apply(this, args);
    }
  },
  applyConnectorsFilter: function exploreApplyConnectorsFilter(filterName) {
    filterName = filterName || this.defaultFilter;

    if (filterName === 'features') {
      return;
    }

    // Update menu
    this.$connectorsFilter.find('.active').removeClass('active');
    this.$connectorsFilter.find('[data-toggle="' + filterName + '"]')
      .children('a').addClass('active');

    // Update visible connectors
    if (filterName !== 'all') {
      this.$connectors.filter(':not([data-toggle="' + filterName + '"])')
        .appendTo(this.$hiddenConnectors);
      this.$connectors.filter('[data-toggle="' + filterName + '"]')
        .appendTo(this.$connectorsContainer);
    } else {
      this.$connectors.appendTo(this.$connectorsContainer);
    }
  },
  // Extract scroll activation's options from elements.
  setupElements: function exploreSetupElements($elements, activeCB, inactiveCB) {
    var config = {};
    $elements.each(function (index, element) {
      config[index] = this.setupElement(element, activeCB, inactiveCB);
    }.bind(this));
    return config;
  },
  setupElement: function exploreSetupElement(element, activeCB, inactiveCB) {
    var box = element.getBoundingClientRect();
    return {
      top: box.top + this.scroll.top,
      left: box.left + this.scroll.left,
      width: box.width,
      height: box.height,
      active: false,
      activeCB: activeCB,
      inactiveCB: inactiveCB,
      el: element
    };
  },
  // Get the scroll position.
  getScroll: function exploreGetScroll() {
    var supportPageOffset = window.pageXOffset !== undefined;
    var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
    var x = supportPageOffset ?
      window.pageXOffset : isCSS1Compat ?
        document.documentElement.scrollLeft : document.body.scrollLeft;
    var y = supportPageOffset ?
      window.pageYOffset : isCSS1Compat ?
        document.documentElement.scrollTop : document.body.scrollTop;
    return {
      left: x,
      top: y
    };
  },
  // Bind and throttle the scrolling and resizing.
  bindings: function exploreBindings() {
    var resizeTimeout;
    var clickTimeout, clickFlag;

    $(window)
      .scroll(this.scrollHandler.bind(this))
      .resize(function (e) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(this.resizeHandler.bind(this), 100);
      }.bind(this))
      .on('hashchange', this.hashHandler.bind(this));

    window.onpopstate = function (evt) {
      if (!evt.state) {
        return;
      }
      this.applyPage(evt.state.currentPage);
      document.title = evt.state.title;
    }.bind(this);

    // Mobile Menu
    this.$mobileTrigger.on('click', function () {
      if (!this.$submenu.hasClass('reveal')) {
        this.openMobileMenu();
      } else {
        this.closeMobileMenu();
      }
    }.bind(this));

    if (this.disableMenuAJAX === true) {
      return;
    }

    this.$submenu.on('click', 'a:not(.btn-blue-cta)', function (evt) {
      // If we don't support the history API we let the link go.
      if (!history || !history.pushState) {
        return;
      }

      // Cancel the navigation
      evt.preventDefault();
      evt.stopPropagation();

      if (this.$submenu.hasClass('no-click')) {
        return;
      }

      var $el = $(evt.currentTarget);
      if (!$el.parent().hasClass('active')) {
        // Close the mobile menu.
        this.closeMobileMenu();
        this.goToTab($el.attr('href'), $el.attr('data-page'));
      }
    }.bind(this));
  },
  goToTab: function (href, tab) {
    this.setMenu(tab);

    // Update url
    history.pushState({
      currentHref: href,
      currentPage: tab,
      title: document.title
    }, document.title, href);

    // Scroll to the menu
    // Minus 1 to unstuck the top-submenu
    var top = this.$tabber.offset().top;
    this.$body.animate({ scrollTop: top - 1 }, 500);

    if (this.$tabber.children('.tab.' + tab).children().length) {
      // Change the page
      this.applyPage(tab);
      document.title = this.tabs[tab].title;
      return;
    }

    this.$tabber.addClass('loading');

    $.get(href).always(function (data, message) {
      if (message === 'success') {
        var $data = $(data);
        document.title = $data.filter('title').text();
        this.tabs[tab].title = document.title;
        this.$tabber
          .children('.tab.' + tab)
          .html($data.find('.tab.' + tab).html());

        // Change the page
        this.applyPage(tab);

        // Listen for the end of the animation.
        var fnEnd = function () {
          this.tabs[tab].tabEl.off(this.tEnd, fnEnd);
          this.$tabber.removeClass('loading');
        }.bind(this);

        if (!this.tEnd) {
          // Fallback to simple setTimeout if no transitionend event is available.
          setTimeout(fnEnd, this.transitionTime);
          return;
        }
        this.tabs[tab].tabEl.on(this.tEnd, fnEnd);
      }
    }.bind(this));
  },
  openMobileMenu: function exploreOpenMobileMenu() {
    requestAnimationFrame(function () {
      this.$submenu.addClass('reveal');
      this.$submenuWrap
        .height(185 + this.$submenuWrap.children('.menu-wrap').height());
    }.bind(this));
  },
  closeMobileMenu: function exploreCloseMobileMenu() {
    requestAnimationFrame(function () {
      this.$submenu.removeClass('reveal');
      this.$submenuWrap.height(75);
    }.bind(this));
  },
  // Control after a scroll if we need to update elements' states
  controlScroll: function exploreControlScroll(opts, scroll) {
    // Set our zones
    // The element's active zone.
    var activeZone = {
      top: opts.top,
      bottom: opts.top + opts.height
    };
    // The viewport's visible zone.
    var visibleZone = {
      top: scroll.top,
      bottom: scroll.top + window.innerHeight
    };

    // If we become visible
    if (
      visibleZone.top <= activeZone.top &&
      visibleZone.bottom >= activeZone.bottom
    ) {
      // We activate the element and call its callback.
      if (!opts.active) {
        opts.active = true;
        if (typeof opts.activeCB === 'function') {
          opts.activeCB.call(this, opts);
        }
      }
      // If we go outside the viewport
    } else if (
      (visibleZone.top >= activeZone.bottom &&
        visibleZone.bottom >= activeZone.bottom) ||
      (visibleZone.top <= activeZone.top &&
        visibleZone.bottom <= activeZone.top)
    ) {
      // We deactivate the element and call its callback.
      if (opts.active) {
        opts.active = false;
        if (typeof opts.inactiveCB === 'function') {
          opts.inactiveCB.call(this, opts);
        }
      }
    }
  },
  scrollHandler: function exploreScrollHandler() {
    // Handle the fixiness of the sub
    var top = this.getScroll().top;

    // If the menu is already active,
    // we only check to unstuck it.
    if (this.submenuOpts.active) {
      if (top < this.submenuOpts.top) {
        this.submenuOpts.active = false;
        this.$submenu.removeClass('fixed');
      }
    } else {
      if (top > this.submenuOpts.top) {
        this.submenuOpts.active = true;
        this.$submenu.addClass('fixed');
      }
    }

    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(
      this.scrollActivationHandler.bind(this),
      25);
  },
  scrollActivationHandler: function exploreScrollActivationHandler() {
    this.scroll = this.getScroll();

    if (this.sidekickOpts) {
      this.controlScroll(this.sidekickOpts, this.scroll);
    }

    if (this.heroOpts) {
      this.controlScroll(this.heroOpts, this.scroll);
    }
  },
  resizeHandler: function exploreResizeHandler() {
    // Update our positions
    this.setupOptions();
  }
};
