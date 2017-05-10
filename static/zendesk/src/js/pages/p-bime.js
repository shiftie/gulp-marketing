/**
* Bime Page
*/

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

var Bime = {
  // Taken from http://stackoverflow.com/a/25937118/488325
  // Outputs coresponding event for transitionend
  transitionEnd: function bimeTransitionEnd () {
    var el = document.createElement('div');
    var transEndEventNames = {
      WebkitTransition : 'webkitTransitionEnd',
      MozTransition    : 'transitionend',
      OTransition      : 'oTransitionEnd otransitionend',
      transition       : 'transitionend'
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
      activeCb: function () {
        this.overviewTabActive = true;
        this.scrollHandler();
      },
      inactiveCb: function () {
        this.overviewTabActive = false;
      }
    },
    connectors: {
      menuEl: $('header.submenu .submenu-connectors'),
      tabEl: $('.tab.connectors'),
      submenu: true,
      activeCb: function () {
        this.applyConnectorsFilter.apply(this, arguments);
      }
    },
    pricing: {
      menuEl: $('header.submenu .submenu-pricing'),
      tabEl: $('.tab.pricing')
    }
  },
  init: function bimeInit () {
    // Cache static selectors.
    this.$body = $('body');
    this.$window = $('window');
    this.$root = $('.bime-page');
    this.$topMenu = $('.masthead-stuck-target');
    this.$submenu = $('header.submenu');
    this.$submenuWrap = this.$submenu.children('.banner-wrap');
    this.$mobileTrigger = this.$submenu.find('.mobile-trigger');
    this.$tabber = $('.tabber');
    this.$connectorsFilter = $('.mod-wrapper.connectors nav ul.grid-container');
    this.$connectors = $('.mod-wrapper.connectors .connectors .connector');
    this.$connectorsContainer = $('.mod-wrapper.connectors .connectors ul');
    this.$hiddenConnectors = $('.mod-wrapper.connectors .hidden');
    this.$videos = this.$root.find('article.dashboard video');
    this.$asides = this.$root.find('.mod-section > aside');

    // Constants
    this.defaultPage = 'overview';
    this.defaultFilter = 'all';
    this.overviewTabActive = false;
    this.transitionTime = 150;
    this.topMenuHeight = 75;
    this.tEnd = this.transitionEnd();
    this.scrollTimeout;

    this.setupOptions();
    this.bindings();
    this.kickstart();
  },
  kickstart: function bimeKickstart () {
    this.scrollHandler();
    this.hashHandler();
  },
  setupOptions: function bimeSetupOptions () {
    this.scroll = this.getScroll();
    this.videosOpts = this.setupElements(
      this.$videos,
      this.activeVideoCallback,
      this.inactiveVideoCallback
    );
    // Use the $tabber element because
    // the $submenu one becomes fixed half way through
    this.submenuOpts = this.setupElement(this.$tabber[0]);
  },
  activeVideoCallback: function bimeActiveVideoCallback (opts) {
    opts.el.play();
  },
  inactiveVideoCallback: function bimeInactiveVideoCallback (opts) {
    opts.el.pause();
    opts.el.currentTime = 0;
  },
  hashHandler: function bimeHashHandler () {
    var hash, subHash, route, pageName;
    // Get the current hash
    if (window.location.hash) {
      var ar = window.location.hash.substring(1).split('/');
      hash = ar.shift();
      subHash = ar.pop();
    }

    // Get the current route
    route = document.location.pathname
      // Remove preceding and following slashes
      .replace(/(^\/+|\/+$)/g, '')
      .split('/')
      .pop();

    if (route === 'bime') {
      route = undefined;
    }

    pageName = hash || route || this.defaultPage;

    this.applyPage(pageName, subHash);
  },
  applyPage: function bimeApplyPage (pageName) {
    var previousTabName, previousTab;
    var args = Array.prototype.slice.call(arguments);
    var tab = this.tabs[args.shift()];

    // Close the mobile menu.
    this.closeMobileMenu();

    // Get the previous tab if present
    if (this.$tabber.children('.active').length) {
      previousTabName = this.$tabber.children('.active').attr('class')
        .replace(/ ?(tab|active) ?/g, '');
      previousTab = this.tabs[previousTabName];
    }

    // If we're on the same page, only execute active callback if needed.
    if (previousTab === tab) {
      if ((tab.submenu && typeof tab.activeCb === 'function') ||
          (!tab.submenu && typeof tab.activeCb === 'function')) {
        tab.activeCb.apply(this, args);
      }
      return;
    }

    // Update menu
    this.$submenu.addClass('no-click');
    this.$submenu.find('.active').removeClass('active');
    tab.menuEl.addClass('active');

    this.doTabAnimation(tab, previousTab);

    // Listen for the end of the animation.
    if (!this.tEnd) {
      // Fallback to simple setTimeout if no transitionend event is available.
      setTimeout(this.endTabAnimation.bind(this, tab, previousTab, args), 150);
      return;
    }

    tab.tabEl
      .off(this.tEnd)
      .on(this.tEnd, this.endTabAnimation.bind(this, tab, previousTab, args));
  },
  doTabAnimation: function bimeDoTabAnimation (tab, previousTab) {
    var top = this.$tabber.offset().top;
    // Update element
    if (previousTab) {
      previousTab.tabEl.addClass('prepare-out');
    }

    tab.tabEl.addClass('prepare-in');

    // Force the content height.
    this.$tabber.height(tab.tabEl.height());

    // Launch animation
    requestAnimationFrame(function () {
      // Scroll back up.
      if (this.getScroll().top > top) {
        // Minus 1 to unstuck the top-submenu
        this.$body.animate({ scrollTop: top - 1 }, 500);
      }

      tab.tabEl.addClass('in');
      if (previousTab) {
        previousTab.tabEl.addClass('out');
      }
    }.bind(this));
  },
  endTabAnimation: function bimeEndTabAnimation (tab, previousTab, args) {
    tab.tabEl.off(this.tEnd);

    // Cleaning classes.
    this.$tabber
      .height('')
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
  applyConnectorsFilter: function bimeApplyConnectorsFilter (filterName) {
    filterName = filterName || this.defaultFilter;

    // Update menu
    this.$connectorsFilter.find('.active').removeClass('active');
    this.$connectorsFilter.find('[data-toggle="' + filterName + '"]')
      .addClass('active');

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
  setupElements: function bimeSetupElements ($elements, activeCB, inactiveCB) {
    var config = {};
    $elements.each(function (index, element) {
      config[index] = this.setupElement(element, activeCB, inactiveCB);
    }.bind(this));
    return config;
  },
  setupElement: function bimeSetupElement (element, activeCB, inactiveCB) {
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
  getScroll: function bimeGetScroll () {
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
  bindings: function bimeBindings () {
    var resizeTimeout;
    var clickTimeout, clickFlag;

    $(window)
      .scroll(this.scrollHandler.bind(this))
      .resize(function (e) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(this.resizeHandler.bind(this), 100);
      }.bind(this))
      .on('hashchange', this.hashHandler.bind(this));

      this.$submenu.on('click', 'a', function (evt) {
        if (this.$submenu.hasClass('no-click')) {
          evt.preventDefault();
          evt.stopPropagation();
        }
      }.bind(this));

    // Mobile Menu
    this.$mobileTrigger.on('touchend click', function () {
      if (!clickFlag) {
        if (!this.$submenu.hasClass('reveal')) {
          this.openMobileMenu();
        } else {
          this.closeMobileMenu();
        }
        clickFlag = true;
      }

      // Throttle the event for some handhelds trigger both click and touchend
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(function () {
        clickFlag = false;
      }, 10);
    }.bind(this));
  },
  openMobileMenu: function bimeOpenMobileMenu () {
    requestAnimationFrame(function () {
      this.$submenu.addClass('reveal');
      this.$submenuWrap
        .height(115 + this.$submenuWrap.children('.menu-wrap').height());
      }.bind(this));
  },
  closeMobileMenu: function bimeCloseMobileMenu () {
    requestAnimationFrame(function () {
      this.$submenu.removeClass('reveal');
      this.$submenuWrap.height(75);
    }.bind(this));
  },
  // Control after a scroll if we need to update elements' states
  controlScroll: function bimeControlScroll (opts, scroll) {
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
      visibleZone.top <= activeZone.top && visibleZone.bottom >= activeZone.top
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
  scrollHandler: function bimeScrollHandler () {
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

    // Continue only if we're on the overview tab.
    if (!this.overviewTabActive) {
      return;
    }

    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(
      this.scrollActivationHandler.bind(this),
    100);
  },
  // Make the top menu slide-out, pushed by the second nav, when scrolling down
  hijackTopMenu: function (top) {
    if (top > this.submenuOpts.top - this.topMenuHeight) {
      this.$topMenu.removeClass('hijack-stuck');
      if (this.$topMenu.hasClass('js-stuck')) {
        this.$topMenu.css({
          top: ((this.submenuOpts.top - top) - this.topMenuHeight) + 'px'
        });
      }
    }
  },
  scrollActivationHandler: function bimeScrollActivationHandler () {
    this.scroll = this.getScroll();
    // Loop through video' rules
    for (var i in this.videosOpts) {
      this.controlScroll(this.videosOpts[i], this.scroll);
    }
  },
  resizeHandler: function bimeResizeHandler () {
    // Update our positions
    this.setupOptions();
  }
};
