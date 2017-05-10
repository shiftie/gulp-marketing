/**
 * Publicly exported object on which all utility functions are installed.
 */
var webutils = {};

(function($) {
  var storage, supportEmails, dimensions;

  supportEmails = ['support', 'help'];
  dimensions = [];

  // Create an instance of CrossStorageClient for use by all of webutils
  if (typeof CrossStorageClient === 'function') {
    storage = new CrossStorageClient('https://www.zndsk.com/hub.html');
  }

  /**
   * Cookie key at which to store the home type.
   */
  webutils.homeKey = 'homeType';

  /**
   * Mapping of homeTypes to their values.
   */
  webutils.homeTypes = {
    standard:           '/standardhome',
    enterprise:         '/enterprisehome',
    customer:           '/customerhome',
    enterprisecustomer: '/enterprisecustomerhome',
    trial:              '/trialhome'
  };

  /**
   * Minimum number of employees to be considered enterprise.
   */
  webutils.enterpriseEmployeeCount = 1000;

  /**
   * Ensure optimizely is defined for the rest of the script.
   */
  window.optimizely = window.optimizely || [];

  /**
   * Ensure heap is defined for the rest of the script.
   */
  window.heap = window.heap || [];

  /**
   * Ensure convertro is defined for the rest of the script.
   */
  window.$CVO = window.$CVO || [];

  /**
   * dbase global variable should be injected by the DemandBase script.
   */
  window.dbase = window.dbase || {};

  /**
   * Tracks a given event across optimizely, convertro, google analytics, and heap.
   * The key must be a string, while the value may be a string or object. The value will
   * only be passed to GA and heap. Optimizely will be passed a track event with the given key.
   *
   * @param {string}        key   The key to track
   * @param {string|object} value The value to send to GA and Heap
   */
  webutils.track = function(key, value) {
    window.optimizely.push(['trackEvent', key]); // split testing tracking

    window.$CVO.push([ 'trackEvent', { type: key }]); // lead attribution tracking

    if (typeof ga !== 'undefined') { // google analytics
      ga('create', 'UA-970836-4');
      ga('send', 'event', key, value, {'nonInteraction': 1});
    }

    if (typeof heap !== 'undefined' && heap.track) { // heap event tracking
      heap.track(key, value);
    }
  };

  /**
   * Pushes a state onto the user's history given a title and fragment.
   *
   * @example
   * webutils.pushStateFragment('Register | Your details', 'details');
   *
   * @param {string} title    The title to push
   * @param {string} fragment The fragment to push
   */
  webutils.pushStateFragment = function(title, fragment) {
    var url = '//' + location.host + location.pathname + location.search + '#' + fragment;

    try {
      history.pushState(fragment, title, url);
    } catch(e) {
      // Do nothing
    }
  };

  /**
   * Returns the origin of an url, with cross browser support. Accommodates
   * the lack of location.origin in IE, as well as the discrepancies in the
   * inclusion of the port when using the default port for a protocol, e.g.
   * 443 over https. Defaults to the origin of window.location if passed a
   * relative path.
   *
   * @param   {string} url The url to a cross storage hub
   * @returns {string} The origin of the url
   */
  webutils.getOrigin = function(url) {
    var uri, protocol, origin;

    uri = document.createElement('a');
    uri.href = url;

    if (!uri.host) {
      uri = window.location;
    }

    if (!uri.protocol || uri.protocol === ':') {
      protocol = window.location.protocol;
    } else {
      protocol = uri.protocol;
    }

    origin = protocol + '//' + uri.host;
    origin = origin.replace(/:80$|:443$/, '');

    return origin;
  };

  /**
   * Returns whether or not the user is on a mobile device.
   *
   * @return {Boolean} Returns true for mobile devices
   */
  webutils.isMobile = function() {
    var pattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

    return (pattern.test(navigator.userAgent));
  };

  /**
   * Returns true if the user is on iOS, false otherwise.
   *
   * @return {Boolean} Whether or not they're on iOS
   */
  webutils.iOS = function() {
    return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
  };

  /**
   * Returns true if the user is on Safari, false otherwise.
   *
   * @return {Boolean} Whether or not they're on Safari
   */
  webutils.isSafari = function() {
    return (navigator.userAgent.indexOf('Safari') !== -1 &&
      navigator.userAgent.indexOf('Chrome') === -1);
  };

  /**
   * Returns whether or not the user is using a retina display.
   *
   * @return {Boolean} Returns true for retina displays
   */
  webutils.isRetina = function() {
    return (('devicePixelRatio' in window && devicePixelRatio > 1) ||
      ('matchMedia' in window && matchMedia("(min-resolution:144dpi)").matches));
  };

  /**
   * Returns the market segment for the given employee range. The market
   * segment is one of: VSB, SMB, MM, or ENT.
   *
   * @params  {string} range The employee range
   * @returns {string} The market segment
   */
  webutils.convertRangeToSegment = function(range) {
    var segment, ceiling;

    if (!range) return;

    range = String(range);
    ceiling = range.split('-');
    segment = 'none';

    if (ceiling.length <= 1) return segment;

    ceiling = ceiling[1];

    if (ceiling > 0) {
      if(ceiling > 4999) {
        segment = 'ENT';
      } else if(ceiling > 249) {
        segment = 'MM';
      } else if(ceiling > 24) {
        segment = 'SMB';
      } else {
        segment = 'VSB';
      }
    } else if(range === '5000+') {
      segment = 'ENT';
    }

    return segment;
  };

  /**
   * Converts a company size to a string range used in the form, e.g. "1-9",
   * "50-99", "5000+", etc.
   *
   * @param   {int}    size
   * @returns {string}
   */
  webutils.convertSizeToRange = function(size) {
    if (!size || size < 10) {
      return '1-9';
    } else if (size < 50) {
      return '10-49';
    } else if (size < 100) {
      return '50-99';
    } else if (size < 250) {
      return '100-249';
    } else if (size < 500) {
      return '250-499';
    } else if (size < 1000) {
      return '500-999';
    } else if (size < 5000) {
      return '1000-4999';
    } else {
      return '5000+';
    }
  }

  /**
   * Returns the user's market segment given their demandbase data. The segment
   * is one of: VSB, SMB, MM or ENT.
   *
   * @returns {string} The user's market segment
   */
  webutils.getMarketSegment = function() {
    var segment = 'none'
      , db      = window.dbase;

    // Pull from DemandBase if returned
    if (typeof db != 'undefined' && db.employee_range) {
      segment = webutils.convertRangeToSegment(db.employee_range);
    } else { // Pull from bizo params if present
      var size = webutils.getURLParameter('size');

      if (size != 'null') {
        segment = size.toUpperCase();
      }
    }

    return segment;
  };

  /**
   * Utility function useful when binding an action to the scroll event to prevent
   * excessive resources consumption. Limits call interval to once every X milliseconds.
   *
   * @param   {object} func function you want to run on scroll
   * @param   {string} wait interval in milliseconds
   */
  webutils.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  /**
   * Gauges the user, setting a behaviour cookie containing the visitor's
   * company info, followed by returning that cookie.
   *
   * @returns {object} The visitor's information
   */
  webutils.gauge = function() {
    var visitor,
        date = new Date(),
        timestamp = date.getTime(),
        referrer = document.referrer,
        hostname = location.hostname.substr(location.hostname.indexOf('.') + 1);

    // if behavioral cookie already exists update metrics
    if ($.cookie('flight')) {
      visitor  = JSON.parse(String($.cookie('flight')));

      // if it's been more than 30 minutes since initial visit update last timestamp and increment session count
      if (timestamp > visitor.last_touch_timestamp + (30*(1000*60))) {
        visitor.visits++;
        visitor.last_touch_timestamp = timestamp; // set time stamp for session to current time
      }

      // update last touch if referrer is not internal / google auth loop / or registration flow
      if (referrer.indexOf('www.zendesk') === -1 && referrer.indexOf('accounts.google') === -1 && location.href.indexOf('/register') === -1) {
        visitor.last_landing_page = location.href;
        visitor.last_referrer = document.referrer;
        visitor.last_touch_timestamp = timestamp; // set time stamp for session to current time
      }

      // update time on site tracker in seconds
      visitor.time_on_site = Math.round(((timestamp - visitor.last_touch_timestamp) / 1000)); // time one site current visit
      visitor.total_time_on_site += visitor.time_on_site; // time on site all visits

      visitor.page_views = ++visitor.page_views;
    } else {
      referrer = (referrer.indexOf('www.zendesk') === -1 ) ? referrer : ''; // ignore redirect internal referrals

      visitor = {
        first_touch_timestamp: timestamp,
        last_touch_timestamp: timestamp,
        first_referrer: referrer,
        last_referrer: 'none',
        first_landing_page: location.href,
        last_landing_page: 'none',
        time_on_site: 0,
        total_time_on_site: 0,
        page_views: 1,
        visits: 1,
        trials: 0,
        domain: 'none',
      };
    }

    $.cookie('flight', JSON.stringify(visitor), {
      expires: 730,
      path: '\/',
      domain: hostname
    });

    return visitor;
  };

  /**
   * Returns the value for the specified URL parameter.
   *
   * @param   {string} key The query string key
   * @returns {string} The value for the given key
   */
  webutils.getURLParameter = function(key) {
    var pattern = RegExp(key + '=' + '(.+?)(&|$)');

    return decodeURI((pattern.exec(location.search)||[,null])[1]);
  };

  /**
   * Parses the current url's fragment, returning an object with the key
   * value pairs.
   *
   * @param   {string}
   * @returns {object}
   */
  webutils.parseFragment = function() {
    var params = {};
    var split = window.location.href.split('#');
    if (split.length < 2) return params;
    var fragment = split[1];

    var pattern = /([^&;=]+)=?([^&;]*)/g;
    var extraction;
    var decode = function (s) {
      return decodeURIComponent(s.replace(/\+/g, ' '));
    };

    while (extraction = pattern.exec(fragment)) {
      params[decode(extraction[1])] = decode(extraction[2]);
    }

    return params;
  };

  /*
   * Add geolocation data to lead forms
   *
   */
  webutils.setGeoByIP = function() {
    $.ajax({
      url:  '//www.zendesk.com/app/geo.json',
      type: 'GET',
      success: function(data) {
        $('input#trial_extras\\[DB_CCode__c\\]').val(data.country_code);
        $('input#trial_extras\\[Country__c\\]').val(data.country);
        $('input#trial_extras\\[DB_State__c\\]').val(data.state);
        $('input#trial_extras\\[DB_City__c\\]').val(data.city);
        $('input#trial_extras\\[DB_Zip__c\\]').val(data.postal);
        $('input#trial_extras\\[Region__c\\]').val(data.region);
        $('input#MailingCountry').val(data.country); // duplicate country field until Eloqua mapping updated

        var heapEvent = 'Marketing - Geolocation - Success';
        var heapVal = Object.assign({}, { error: data.error, undefinedFields: data.undefindFields });

        if (data.error || data.undefinedFields) {
          heapEvent = 'Marketing - Geolocation - Error';

          // if geoip lookup fails fallback on US to prevent routing errors
          $('input#trial_extras\\[DB_CCode__c\\]').val('US');
          $('input#trial_extras\\[Country__c\\]').val('United States');
          $('input#MailingCountry').val('United States');
        }

        webutils.track(heapEvent, heapVal);
      },
      error: {

      }
    });
  };

  /*
   * Calculate the text width in a given form field. Must be provided that
   * that field's parent, and returns the width as an integer.
   *
   * @params  {Element} parent Container of the text box
   * @returns {int}     The width of the element in pixels
   */
  webutils.calcTextWidth = function(parent){
    var content = parent.html(),
        measure = '<span>' + content + '</span>',
        width;

    parent.html(measure);
    width = parent.find('span:first').width();
    parent.html(content);

    return width;
  };

  /*
   * Returns whether or not the string is a valid email.
   *
   * @params  {string} string The string to validate
   * @returns {bool}   Whether or not it's an email
   */
  webutils.isValidEmail = function(string) {
    return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(string);
  };

  /**
   * Returns the a boolean indicating whether or not the passed email is likely
   * to be a support email. The list of strings to search are stored in the
   * _supportEmails array.
   *
   * @param   {string} email The email to match
   * @returns {bool}   Whether or not it's likely a support email
   */
  webutils.isSupportEmail = function(email) {
    var i, localPart;

    email = email.toLowerCase();
    localPart = email.split('@')[0];

    for (i = 0; i < supportEmails.length; i++) {
      if (localPart.indexOf(supportEmails[i]) !== -1) {
        return true;
      }
    }

    return false;
  };

  /**
   * Grabs the gclid from the flight cookie for passing along to eloqua
   *
   * @param {string} eloquaField The gclid field to dump it into, if not the default
   * @param {string} heapidField The heapid field to dump it into, if not the default
   * @param {string} hiddenCampaignIdField the hiddenCampaignId field to dump it into, if not default
   * @returns nothing
   */
  webutils.paramsForEloqua = function(eloquaField, heapidField, hiddenCampaignIdField) {
    eloquaField = eloquaField || '[name=gclid_field]';
    heapidField = heapidField || '[name=heapid_field]';

    hiddenCampaignIdField = hiddenCampaignIdField || '[name=hiddenCampaignId]';

    if ($.cookie('flight')) {
      try {
        var flightCookie     = JSON.parse($.cookie('flight'));
        var firstLandingPage = flightCookie.first_landing_page;

        if (firstLandingPage) {
          // var gclid = firstLandingPage.
          var pattern = /[\?\&]gclid=([^&$]+)/g;
          var matches = pattern.exec(firstLandingPage);
          if (matches.length > 1) {
            $(eloquaField).val(matches[1]);
          }
        }
      } catch(e) {
        if(typeof Bugsnag !== "undefined") {
          Bugsnag.notify("JSON decode", "Decoding flight cookie JSON failed", {
            special_info: { firstLandingPage: firstLandingPage } // pass cookie for error diagnositcs
          });
        }
      }
    }

    if (heap && heap.userId) {
      $(heapidField).val(heap.userId);
    }

    // grab the salesforce campaign ID from url
    var campaignID = webutils.getParameterByName('hiddenCampaignId');

    // if the hiddenCampaignId param is missing extract campaign id from utm_campaign
    if (campaignID === -1) {
      var utmCampaign = webutils.getParameterByName('utm_campaign');

      if(utmCampaign !== -1) {
        // extract the string following the last instance of _ in the utm campaign (expects strucutre of utm_campaign=campaign_name_70180000001F8ad)
        campaignID = utmCampaign.split('_').pop();
      } else {
        campaignID = '70180000001F8ad'; // if campaign is missing in both instances we fall back to a generic high level nurture campaign
      }
    }

    $(hiddenCampaignIdField).val(campaignID); // add campaign id extracted from the URL to the form
  }

  /*
   * Determines if an email address is a corporate or private email account
   * @param {object} an object containing the email address, form, css
   *        or function to reveal the form fields and a function form
   *        what to do next
   *
   *       {
   *          email: $("[type='email']").val(),
   *          reveal: "string" || function() ,
   *          error: function(), // What to do if something bad happens
   *          next: function(),  // Wrap the validation and submission logic
   *       }                     // scope of function is the form
   */


  webutils.checkEmailType = function(params) {

    // Grab the clearbit fields we are looking for
    var clearBitFields = this.clearbitFieldFinder(params.form);
    var clearbitQueryParam = '';
    if ( clearBitFields.length > 0 ) {
      clearbitQueryParam = '&clearbitFields='+encodeURIComponent(clearBitFields.join(","));
    }

    if (!params.email) { return }

    // Confirm the email is valid before sending it
    if (webutils.isValidEmail(params.email)) {
      $.ajax({
        url:'/app/emailinfo.json?email='+params.email+clearbitQueryParam,
        dataType: 'json',
        timeout: 2000
      }).done(function(data) {

        if (typeof(params.reveal) === 'string') {
          // probably provided a CSS selector, query the DOM to reveal
          if (data.extendedInfo && data.extendedInfo.length > 0) {
            var showNotification = false;

            data.extendedInfo.forEach(function(selector) {
              var toReveal = $(params.form).find('[data-clearbit="'+selector+'"]');
              if (toReveal.hasClass('enrichment-required')) {
                showNotification = true;
                toReveal.addClass('required').removeClass('enrichment-required');
              }
              toReveal.closest('.enrichment').show();
            });
            if (showNotification) {
              $(params.form).find(".enrichment-notification").show();
            }
          }

        } if (typeof(params.reveal) === 'function') {
          // callback function
          params.reveal();
        } else {
          // undefined, do nothing
        }

        // Callback for a clearbit match
        if (typeof params.clearbitMatch === "function" && data.clearbitMatch) {
          params.clearbitMatch(data);
        }
        if (typeof params.notClearbitMatch === "function" && !data.clearbitMatch) {
          params.notClearbitMatch();
        }

        if (typeof params.next === "function") {
          params.next.call(params.form);
        }
      }).error(function(data) {
        if(typeof params.error === "function") {
          params.error();
        }
      });
    }
  }

  /**
   * Clearbit field finder
   * Pass in the form's CSS selector
   * get back an array of the clerbit Field mappings
   *
   * @param {formSelector} the CSS selector of the form field
   * @returns {array}
   */

  webutils.clearbitFieldFinder = function(formSelector) {
    var clearBitFields = [];
    var theForm = $(formSelector);

    theForm.find("[data-clearbit]").each(function(i,ele) {
      clearBitFields.push($(ele).attr('data-clearbit'));
    });

    return clearBitFields;
  }

  /*
   * Returns true if it is currently Daylight Savings Time.
   *
   * @returns {boolean} True if DST, false otherwise
   */
  webutils.isDST = function() {
    var today = new Date(),
      jan = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0),
      jul = new Date(today.getFullYear(), 6, 1, 0, 0, 0, 0),
      temp = jan.toGMTString(),
      jan_local = new Date(temp.substring(0, temp.lastIndexOf(" ")-1)),
      jul_local = new Date(temp.substring(0, temp.lastIndexOf(" ")-1)),
      hoursDiffStdTime = (jan - jan_local) / (1000 * 60 * 60),
      hoursDiffDaylightTime = (jul - jul_local) / (1000 * 60 * 60);

     return hoursDiffDaylightTime != hoursDiffStdTime;
  };

  /*
   * Lock the top navigtion to the browser window while scrolling
   *
   * @returns {boolean} True if DST, false otherwise
   */
  webutils.lockTopNavigation = function() {
    var distance = $(window).scrollTop()
      , primaryMenuStuck = $('.masthead-stuck-target')
      , offset = $('.primary-menu-anchor').offset().top - 35
        itemswidth = 0;

    if (distance > offset) {
      primaryMenuStuck.show().css({'top':'0'});
    }

    $(window).scroll(function() {
      distance = $(document).scrollTop();

      // If distance from top is greater than our offset, we haven't set the responsive class for the mobile-menu on the masthead, and we have not detected iPad as useragent
      if (distance > offset && !$('.masthead').hasClass('mobile-menu')) {
        primaryMenuStuck
          .css({
            'position': 'fixed',
            'top':'0',
            'left': '0',
            'height': '75px',
            'width': '100%',
            'z-index':'999',
            'box-shadow': '0px 0px 10px rgba(0, 0, 0, 0.1)',
            'background': '#ffffff'
          })
          .addClass('js-stuck');
      } else { // If distance from top is less than our offset
        primaryMenuStuck.attr('style','').removeClass('js-stuck');
      }
    });
  }

  /**
   * Given a string corresponding to a name, returns a two element array
   * containing the first and last name. All characters after the first space
   * are attributed to the last name.
   *
   * @param  {String} str
   * @return {String}
   */
  webutils.splitName = function(name) {
    var split = (name || '').split(' ');
    var firstName = split.slice(0, 1).join(' ');
    var lastName = split.slice(1).join(' ');

    if(!lastName) lastName = firstName;

    return [firstName, lastName];
  }

  /**
   * Escape strings before injecting code back into DOM. WARNING: Not to be
   * used with any input entered via query string params. This is not safe.
   *
   * @params  {string} str The HTML string to escape
   * @returns The escaped string
   */
  webutils.escapeHTML = function(str) {
    return String(str).replace(/[&<>'";]/g, '');
  };

  /**
   * A cache for the getSubdomainInfo function.
   *
   * @var {null|[]}
   */
  webutils.subdomainsCache = null;

  /**
   * Helper function that returns a promise that resolves to an array of
   * subdomain objects to which the visitors belongs, ordered by lastUpdated.
   * Properties of the objects include: customerType, role, planName and
   * lastUpdated.
   * Note: storage.onConnect() will throw if browser has third-party cookies
   * and site data disabled
   *
   * @returns {Promise} A promise that resolves to an array of subdomains
   */
  webutils.getSubdomainInfo = function() {
    if (!storage) return Promise.resolve([]);

    if (webutils.subdomainsCache) {
      return Promise.resolve(webutils.subdomainsCache);
    }

    var subdomains = [];

    return storage.onConnect().then(function() {
      return storage.getKeys();
    }).then(function(keys) {
      var i, split, subdomainKeys;

      if (!keys || !keys.length) return;

      // Keys containing subdomain info follow the format:
      // "userInfo:subdomain". customerType may be either
      // "customer" or "trial"
      subdomainKeys = [];

      for (i = 0; i < keys.length; i++) {
        split = keys[i].split(':');
        if (split[0].indexOf('userInfo') !== -1) {
          subdomains.push(split[1]);
          subdomainKeys.push(keys[i]);
        }
      }

      if (!subdomainKeys.length) return;

      return storage.get.apply(storage, subdomainKeys);
    }).then(function(subdomainInfo) {
      var i, result;

      webutils.subdomainsCache = [];

      if (!subdomainInfo) return [];

      // subdomainInfo is a single string if only one key was set
      if (!subdomainInfo.length) {
        subdomainInfo = [subdomainInfo];
      }

      // Store the subdomain on the subdomainInfo objects
      for (i = 0; i < subdomainInfo.length; i++) {
        subdomainInfo[i].key = subdomains[i] + '.zendesk.com';
      }

      // Sort the subdomains by lastUpdated
      subdomainInfo.sort(function(a, b) {
        if (a.lastUpdated > b.lastUpdated) {
          return -1;
        } else if (a.lastUpdated < b.lastUpdated) {
          return 1;
        } else {
          return 0;
        }
      });

      webutils.subdomainsCache = subdomainInfo;

      return subdomainInfo;
    }).catch(function(error) {
      console.error(error);
    });
  };

  /**
   * Returns a promise that resolves to an array of subdomains to which the
   * visitors belongs. Subdomains are ordered by their lastUpdated property,
   * that is, the most recently used.
   *
   * @returns {Promise} A promise that resolves to an array of subdomains
   */
  webutils.getSubdomains = function() {
    return webutils.getSubdomainInfo().then(function(subdomains) {
      if (!subdomains || !subdomains.length) return [];

      return subdomains.map(function(subdomain) {
        return subdomain.key;
      });
    });
  };

  /**
   * Returns a formatted array of objects containing subdomain information,
   * including a name that is truncated to 25 characters, as well as the full
   * url. The objects have the following keys: name, url, role.
   *
   * @param {object} [opts] - Contains additional optional parameters:
   *   {number} truncationLength - Max length of a subdomain before
   *      truncation. Defaults to 22.
   *
   * @returns {Promise} A promise that resolves to an array of subdomains
   *
   * @typedef FormattedSubdomain
   * @property {string} name - The truncated, if necessary, subdomain name
   * @property {string} shortName - The subdomain name, not truncated, but
   *   without the ".zendesk.com"
   * @property {string} url - url to the subdomain
   * @property {string} role - Customer role. (Refer to webutils.getSubdomainInfo)
   */
   webutils.getFormattedSubdomains = function(opts) {
    opts = opts || {};

    return webutils.getSubdomainInfo().then(function(subdomains) {
      if (!subdomains || !subdomains.length) return;

      return subdomains.map(function(subdomain) {
        var maxLength = opts.truncationLength || 22;
        var truncated = subdomain.key.substring(0, maxLength);
        if (truncated.length !== subdomain.key.length) {
          truncated += '...';
        }

        return {
          name: truncated,
          shortName: subdomain.key.replace('.zendesk.com', ''),
          url: 'https://' + subdomain.key,
          role: subdomain.role
        };
      });
    });
   };

  /**
   * Returns a promise that resolves to the url of the last trial
   * accessed by the visitor, or null if no they have no prior trials.
   *
   * @example
   * webutils.getLastTrial.then(function(res) { console.log(res); });
   * => https://z3n-example-sub@zendesk.com
   *
   * @returns {Promise} A promise that resolves to an array of subdomains
   */
   webutils.getLastTrial = function() {
    return webutils.getSubdomainInfo().then(function(subdomains) {
      if (!subdomains || !subdomains.length) return;

      for (var i = 0; i < subdomains.length; i++) {
        if (subdomains[i].customerType === 'trial') {
          return 'https://' + subdomains[i].key;
        }
      }
    });
   }

  /**
   * Displays a CTA in the header. If the user is an existing customer or
   * trialer, the button links to the given feature page (or login),
   * and includes a drop down list of subdomains if necessary. Otherwise, a
   * the button specified by altSelector is shown, usually asking the user
   * to register for a free trial. The options object accepts an event to push
   * on the dataLayer object when a subdomain is clicked.
   *
   * Note: the DOM must contain a link or button with the 'login-btn' CSS class.
   *
   * @param {string} altSelector - The selector for the hidden button to show
   *   if the visitor is not a customer/trialer
   * @param {string} page - Page to send the user after login
   * @param {CTAConfiguration} opts - An options hash for additional params
   *
   * @typedef CTAConfiguration
   * @property {string} [dataLayer] - a Google Analytics event
   * @property {string} [subdomainListSelector] - an alternate selector for the
   *   subdomain list. Accepts a comma-separated list of selectors.
   * @property {string} [truncationLength]: Max length of subdomain text before
   *   truncation.
   *
   */
  webutils.showCTA = function(altSelector, page, opts) {
    opts = opts || {};

    var showRegisterButton = function() {
      return $(altSelector).show();
    };

    var listSelector = opts.subdomainListSelector || 'ul.subdomainlogin';
    var $subdomainList = $(listSelector);

    if (!$subdomainList.length || !window.webutils) {
      return Promise.resolve(showRegisterButton());
    }

    // Webkit gets a scrollable list of subdomains
    if ($.browser.webkit) {
      $(listSelector).find('ul').addClass('webkit');
    }

    return webutils.getFormattedSubdomains(opts).then(function(subdomains) {
      if (!subdomains || !subdomains.length) return showRegisterButton();

      $subdomainList.show();
      var $loginBtn = $(listSelector).find('.login-btn');
      if (!$loginBtn.length) {
        console.error('No login button found within subdomain list');
        return;
      }

      // If there's only 1 subdomain, we update the login button url and return
      if (subdomains.length === 1) {
        var subdomainUrl = subdomains[0].url + page;
        var tagName = $loginBtn[0].tagName.toLowerCase();
        // The login button can be either a <button> or <a> tag
        if (tagName === 'button') {
          return $loginBtn.click(function() {
            window.open(subdomainUrl);
          });
        }
        return $loginBtn.attr('href', subdomainUrl);
      }

      // Otherwise we have multiple subdomains, so we first disable click
      // behaviour on the button itself
      $loginBtn.click(function(e) {
        e.preventDefault();
        return false;
      });

      // Indicate that the user has multi subdomains for styling the button
      $loginBtn.addClass('multi-subdomains');

      var $ul = $(listSelector).find('ul');
      var useTruncated = !!opts.truncationLength;
      subdomains.forEach(function (subdomain) {
        var subdomainName = useTruncated ? subdomain.name : subdomain.shortName;
        var $li = $('<li><a href="' + subdomain.url + page + '">'
          + subdomainName + '</a></li>');
        $ul.append($li);
      });
    }).then(function() {
      // Track Enable voice clicks
      var singleButton = '.subdomainlogin > li > a:not(.multi-subdomains)';
      var multiSubdomains = '.subdomainlogin li ul li a';

      $(singleButton + ', ' + multiSubdomains).click(function() {
        if (!window.dataLayer || !opts.event) return;
        dataLayer.push({'event': opts.event});
      });
    }).catch(showRegisterButton);
   };

  /**
   * Use cross-storage client to check and store visitor type. Returns a promise
   * that is resolved on completion.
   *
   * @example
   * webutils.getCustomerDimensions.then(function() {
   *   // Customer dimensions can be found in dimensions
   * });
   *
   * @params  {string} str The HTML string to escape
   * @returns {Promise}
   */
  webutils.getCustomerDimensions = function() {
    if (!storage) return Promise.resolve();

    return storage.onConnect().then(function() {
      return storage.getKeys();
    }).then(function(keys) {
      if (!keys || !keys.length) return;

      // Keys containing subdomain info follow the format: "userInfo:subdomain"
      var index = -1;
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].split(':')[0].indexOf('userInfo') !== -1) {
          index = i;
          break;
        }
      }

      if (index !== -1) {
        return storage.get(keys[index]);
      } else {
        return Promise.resolve();
      }
    }).then(function(visitor) {
      if (!visitor || !visitor.customerType) {
        return Promise.resolve();
      }

      dataLayer = dataLayer || [];
      optimizely = optimizely || [];

      heap = heap || function() { return false; };

      heap.track('Customer', {
        'Customer Type': visitor.customerType, // account_type
        'Customer Role': visitor.role, // user_role
        'Customer Plan': visitor.planName // plan_name
        // marketing_activity : boolean
      });

      optimizely.push(['setDimensionValue', 'customerType', visitor.customerType]);
      optimizely.push(['setDimensionValue', 'customerRole', visitor.role]);
      optimizely.push(['setDimensionValue', 'customerPlan', visitor.planName]);

      dimensions[38] = visitor.customerType;
      dimensions[39] = visitor.role;
      dimensions[40] = visitor.planName;

      return Promise.resolve();
    }).catch(function(error) {
      console.error(error);
    });
  };

  /**
   * Return visitor and customer dimensions
   *
   * @method getDeminsions
   * @return array
   */
  webutils.getDimensions = function() {
    return dimensions;
  };

  /**
   * Posts data to eloqua and appends an iframe to the form containing values
   * for the hidden fields as well as all original form fields
   *
   * @params {string} formName The name of the form to be parsed and re-appended
   */
  webutils.postToEloqua = function(formName, handleDone) {
    var form        = $(formName)
      , inputArr    = []
      , radioArr    = []
      , textareaArr = []
      , textareas   = form.find('textarea')
      , inputs      = form.find('input[type=text], input[type=email], input[type=hidden]')
      , radios      = form.find('input[type=radio]:checked')
      , selected    = form.find('option[selected]')
      , iframe      = $('<iframe class="eloqua-iframe-form" style="display:none;" src="/public/assets/html/eloqua-lead-form-relay.html"></iframe>')
      , formString
      , key;

    $('.eloqua-iframe-form').remove();

    formString = '<form id="eloqua-injected" action="//s2136619493.t.eloqua.com/e/f2" method="post">';

    // rebuild inputs and append to new form
    inputs.each(function() {
      inputArr[this.id] = webutils.escapeHTML($(this).val());
    });

    // parse input text fields
    for(var key in inputArr) {
      var val = inputArr[key];
      val = (val == '') ? 'Unknown' : val;
      formString += '<input type="text" name="' + key + '" value="' + val + '"/>';
    }

    // parse radio fields
    radios.each(function() {
      radioArr[this.id] = webutils.escapeHTML($(this).val());
    });

    // add checked radio values to form
    for(var key in radioArr) {
      var val = radioArr[key];
      val = (val == '') ? 'Unknown' : val;
      formString += '<input type="radio" name="' + key + '" value="' + val + '" checked/>';
    }

    // rebuild textareas and append to new form
    textareas.each(function() {
      textareaArr[this.id] = $(this).val();
    });

    for(var key in textareaArr) {
      var val = textareaArr[key];

      val = webutils.escapeHTML(val);
      formString += '<input type="text" name="' + key + '" value="' + val + '"/>';
    }

    form.find('select').find(':selected').each(function() {
      formString += '<select name="' + $(this).parent().attr('name') +
        '"><option value="' + webutils.escapeHTML($(this).val()) +
        '" selected="selected" /></select>';
    });

    formString += '</form>';

    // put form into iframe
    iframe.one('load', function() { // on initial load of iframe
      try {
        iframe.contents().find('body').append(formString);

        if (handleDone) {
          iframe.on('load', handleDone) // on #eloqua-injected form submit, regardless of success
        }
      } catch (e) {
        // Catch SecurityError
      }
    });

    // put iframe as results
    $('body').append(iframe);

    // This datalayer event can be combined with a condition on the current page
    // path to define GTM triggers
    if (window.dataLayer) {
      dataLayer.push({'event': 'form_submission'});
    }
  };

  /**
   * Posts data to eloqua and appends an iframe to the form containing values
   * for the hidden fields as well as all original form fields
   *
   * @param {string}   formName The name of the form to be parsed and re-appended
   * @param {function} fn       Callback to invoke on completion
   */
  webutils.createLead = function(formName, fn) {
    $.post('/app/lead', $(formName).serialize()) // serialize form and post to lead creation endpoint
      .done(function() {
        if (fn) fn();
      })
      .fail(function() {
        if (fn) fn(new Error('Could not create lead'));

        // on failure trigger bugsnag event that includes form name
        if(typeof Bugsnag !== "undefined") {
          Bugsnag.notify("Lead creation", "Lead creation failed", {
            special_info: { form: formName } // pass form name for error diagnostics
          });
        }
      });
  };

  /*
   * Check for a particular cookie and output it's value
   *
   * @params {string} cookieName The name of the cookie who's value we need
   * @returns The data stored within the cookie
   */
  webutils.searchForCookie = function(cookieName) {
    var cookieData = "";
    if (!document.cookie.length) return cookieData;

    var str_start = document.cookie.indexOf(cookieName + "=");
    if (str_start != -1) {
      str_start = str_start + cookieName.length + 1;
      var str_end = document.cookie.indexOf(";", str_start);
      if (str_end == -1) {
        str_end = document.cookie.length;
      }
      cookieData = unescape(document.cookie.substring(str_start, str_end));
    }

    return cookieData;
  };

  /*
   * Parse out stored google analytics, gauge, and optimizely cookies to get
   * field values
   */
  webutils.parseCookies = function() {
    var visitor
      , ga_source = ''
      , ga_campaign = ''
      , ga_medium = ''
      , ga_term = ''
      , ga_content = ''
      , googleData = ''
      , optimUserData = ''
      , optimBucketData = '';

    googleData = webutils.searchForCookie("__utmz");
    optimUserData = webutils.searchForCookie("optimizelyEndUserId");
    optimBucketData = webutils.searchForCookie("optimizelyBuckets");

    if (googleData) {
      var z = googleData.split('.');

      if(z.length >= 4) {
        var y = z[4].split('|');

        for(i = 0; i < y.length; i++){
          if(y[i].indexOf('utmcsr=') >= 0) ga_source = y[i].substring(y[i].indexOf('=')+1);
          if(y[i].indexOf('utmccn=') >= 0) ga_campaign = y[i].substring(y[i].indexOf('=')+1);
          if(y[i].indexOf('utmcmd=') >= 0) ga_medium = y[i].substring(y[i].indexOf('=')+1);
          if(y[i].indexOf('utmctr=') >= 0) ga_term = y[i].substring(y[i].indexOf('=')+1);
          if(y[i].indexOf('utmcct=') >= 0) ga_content = y[i].substring(y[i].indexOf('=')+1);
        }

        $('input#GA_Medium').val(ga_medium);
        $('input#GA_Source').val(ga_source);
      }
    }

    if (optimUserData !== '') {
      $('input#Opti_ID').val(optimUserData);
    }

    if (optimBucketData !== '') {
      $('input#Opti_Variation_ID').val(optimBucketData);
    }
  };

  /**
  * Pull a specific parameter from a URL by its name and get back its value
  *
  * @method getParameterByName
  * @param {string} name The name of the parameter that you'd like to parse from the URL
  * @return {string} results The value of the paramter passed in
  */
  webutils.getParameterByName = function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? -1 : decodeURIComponent(results[1].replace(/\+/g, " "));
  };


  /**
   * Set marketing automation values for the lead gen form: marketo, convertro,
   * partners, etc.
   *
   * @method setMAVs
   * @param {boolean} isTrial Boolean of whether or not this is a trial form
   * @return void
   */
  webutils.setMAVs = function(isTrial) {
    var visitor = webutils.gauge() || {}; // pull base behavioral cookie data
    var db      = window.dbase || {}; // demandbase object for company attrs
    var ZOBU1   = $('input#ZOBU_1'); // temporarily moving partner id into zobu field

    $('input#trial_extras\\[Convertro_SID__c\\]').val(window.$CVO.sid);
    $('input#trial_extras\\[First_Touch__c\\]').val(visitor.first_landing_page);
    $('input#trial_extras\\[Last_Touch__c\\]').val(visitor.last_landing_page);
    $('input#trial_extras\\[Time_On_Site__c\\]').val(visitor.time_on_site);
    $('input#trial_extras\\[Visits__c\\]').val(visitor.visits);
    $('input#trial_extras\\[Pageviews__c\\]').val(visitor.page_views);
    $('input#trial_extras\\[Sub_Industry\\]').val(db.sub_industry);
    $('input#trial_extras\\[Behavioral_1__c\\]').val(db.industry);
    $('input#trial_extras\\[Behavioral_2__c\\]').val(db.revenue_range);
    $('input#trial_extras\\[Behavioral_3__c\\]').val(db.employee_range);
    $('input#trial_extras\\[Partner_ID__c\\]').val('Unknown');

    if (ZOBU1.length) {
      if ($('select#trial_extras\\[Partner_ID__c\\]').val() == '-') {
        ZOBU1.val('Unknown');
      } else {
        ZOBU1.val($('select#trial_extras\\[Partner_ID__c\\]').val());
      }
    }

    // pass lead form source
    if (isTrial) {
      $('input#trial_extras\\[Web_Offer__c\\]').val('Trial');
      $('input#trial_extras\\[Web_Offer_Name__c\\]').val('Trial');
    }

    webutils.setGeoByIP();
    webutils.parseCookies();
  };

  /**
   * A complete cookies reader/writer framework with full unicode support.
   * Helps with cookie writing when vendor/plugins is unavailable.
   *
   * Revision #1 - September 4, 2014
   *
   * Source:
   * https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
   *
   * This framework is released under the GNU Public License, version 3 or later.
   * http://www.gnu.org/licenses/gpl-3.0-standalone.html
   *
   *   webutils.cookies.setItem(name, value[, end[, path[, domain[, secure]]]])
   *   webutils.cookies.getItem(name)
   *   webutils.cookies.removeItem(name[, path[, domain]])
   *   webutils.cookies.hasItem(name)
   *   webutils.cookies.keys()
   */
  webutils.cookies = {
    getItem: function (sKey) {
      if (!sKey) { return null; }
      return decodeURIComponent(document.cookie.replace(new RegExp(
        "(?:(?:^|.*;)\\s*" +
        encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") +
        "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },

    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
      if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
        return false;
      }
      var sExpires = "";
      if (vEnd) {
        switch (vEnd.constructor) {
          case Number:
            sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
            break;
          case String:
            sExpires = "; expires=" + vEnd;
            break;
          case Date:
            sExpires = "; expires=" + vEnd.toUTCString();
            break;
        }
      }
      document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) +
        sExpires + (sDomain ? "; domain=" + sDomain : "") +
        (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");

      return true;
    },

    removeItem: function (sKey, sPath, sDomain) {
      if (!this.hasItem(sKey)) { return false; }
      document.cookie = encodeURIComponent(sKey) +
        "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
        (sDomain ? "; domain=" + sDomain : "") +
        (sPath ? "; path=" + sPath : "");

      return true;
    },

    hasItem: function (sKey) {
      if (!sKey) { return false; }
      return (new RegExp("(?:^|;\\s*)" +
        encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") +
        "\\s*\\=")).test(document.cookie);
    },

    keys: function () {
      var pattern = /((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g;
      var aKeys = document.cookie.replace(pattern, "").split(/\s*(?:\=[^;]*)?;\s*/);
      for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
        aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
      }
      return aKeys;
    }
  };

  /**
   * Performs a redirect by appending an anchor and invoking a click if
   * Internet Explorer, otherwise it uses location.href. This is to handle
   * IE not passing referrer information when a redirect is triggered by
   * window.location.
   *
   * @param {string} url
   */
  webutils.redirect = function(url) {
    if(navigator.userAgent.indexOf('MSIE') !== -1) {
      var anchor = document.createElement('a');
      anchor.href = url;
      document.body.appendChild(anchor);
      anchor.click();
    } else {
      window.location.href = url;
    }
  },

  /**
   * Invokes cross-storage as well as a demandBase to determine the
   * visitor type and store their intended homepage in a cookie. If successful,
   * DemandBase is accessed to determine whether or not they're a potential
   * enterprise lead, and a cookie is set to direct future requests. If we
   * fail to connect to CrossStorage, demandBase is not contacted and no
   * cookie is set.
   */
  webutils.setHomeCookie = function() {
    if (!storage || webutils.cookies.getItem(webutils.homeKey)) return;

    var setCookie = function(type) {
      var ttl, expire;

      if (type === 'standard' || type === 'enterprise') {
        // Leads have a cookie that expires after 5 minutes
        ttl = 60 * 5 * 1000;
      } else {
        // Customers/trialers expire after 24 hours
        ttl = 60 * 60 * 24 * 1000;
      }

      expire = new Date(new Date().getTime() + ttl);
      webutils.cookies.setItem(webutils.homeKey, type, expire);
    };

    return storage.onConnect().then(function() {
      return storage.getKeys();
    }).then(function(keys) {
      if (!keys || !keys.length) return;

      // Keys containing subdomain info follow the format:
      // "userInfo:subdomain"
      var subdomains = [];
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].split(':')[0].indexOf('userInfo') !== -1) {
          subdomains.push(keys[i]);
        }
      }

      // TODO: Update logic to return the highest priority plan
      // subdomain (e.g. Enterprise > Plus > Regular > Starter > Trial)

      if (subdomains.length) {
        // Use the first subdomain for now
        return storage.get(subdomains[0]);
      } else {
        return Promise.resolve();
      }
    }).then(function(res) {
      if (res && res.customerType) {
        if (res.customerType === 'trial') {
          setCookie('customer');
        } else if (res.planName === 'Enterprise' || res.planName === 'Plus') {
          setCookie('enterprisecustomer');
        } else {
          setCookie('customer');
        }
      } else if (window.dbase && window.dbase.employee_count >= enterpriseEmployeeCount) {
        setCookie('enterprise');
      } else {
        setCookie('standard');
      }
    })['catch'](function() {
      // Intentionally left blank
    });
  };

  /**
   * Sets a cookie on the given user directing them to the trial home page
   * on any future home requests.
   */
  webutils.addTrialHomeCookie = function() {
    var ttl, expire;

    ttl = 60 * 60 * 24 * 1000;
    expire = new Date(new Date().getTime() + ttl);

    webutils.cookies.setItem(webutils.homeKey, 'trial', expire);
  };

  /**
   * Updates the queue of feature priorities to be passed as trial_extras
   * during account creation. When invoked, the function checks if the page
   * is one of the supported feature pages. If so, it's placed at the front
   * of the queue. The queue consists of a comma delimited string stored
   * in a cookie with the key 'features'.
   *
   * @param {string} feature The feature to update
   */
  webutils.updateFeaturePriorities = function(feature) {
    var key, features, opts, queue, i;

    key = 'features';
    features = ['help_center', 'chat', 'voice', 'embeddables', 'sdk'];
    opts = {expires: 7, path: '/'};

    // Not on a supported landing page
    if (features.indexOf(feature) === -1) return;

    // Simply add the feature if no others were tracked
    if (!$.cookie(key)) return $.cookie(key, feature, opts);

    // Otherwise split the features string on commas, remove the
    // feature if already present, and push it to the front of
    // the queue
    queue = $.cookie(key).split(',');
    i = queue.indexOf(feature);
    if (i > -1) queue.splice(i, 1);

    queue.unshift(feature);

    $.cookie(key, queue.join(','), opts);
  };

  /**
   * Sets customer dimensions in GA.
   */
  webutils.processGA = function() {
    // pass visitor dimensions to data layer and ga
    if(window.location.href.indexOf('/register') !== -1) return;

    var sendGAData = function() {
      webutils.getCustomerDimensions().then(function() {
        if (typeof ga === 'undefined') return;

        ga('create', 'UA-970836-4');

        var dimensions = webutils.getDimensions();

        // ga dimensions start at 20th index
        for (var i = 20; i < dimensions.length; i++) {
          var label = 'dimension' + i,
              dimension = {};

          // send dimensions to both ga and data layer
          dimension[label] = dimensions[i]
          ga('set', label, dimensions[i]);
          dataLayer.push(dimension);
        }

        // push not interactive ga event to sync attributes to session
        ga('send', 'event', 'dimensions', 'sync', {'nonInteraction': 1});
      });
    };

    setTimeout(function() {
      // GA access must be ran in a timeout
      sendGAData();
    }, 3000);
  };

  /*
   * Used to track intent of customers.
   * When a customer visits a product page this passes
   * in their intent as well as their subdomain to Heap.
   * Allowing us to see which customers are visiting
   * which product pages for possible expansion.
   */

  webutils.trackIntent = function(intent) {
    // Get subdomains
    webutils.getSubdomainInfo().then(function(res) {
      if (!res) {
        return;
      }
      // Find customer domain
      var customerDomain;
      for (var i = 0; i < res.length; i++) {
        if (res[i].customerType !== 'trial') {
          customerDomain = res[i].key;
          break;
        }
      }
      // Send customerDomain to Heap
      if (customerDomain && window.heap) {
        heap.identify({
          domain: customerDomain
        });
        heap.track(intent + ' > Pageview', {
          subdomain: customerDomain
        });
      }
    });
  };

  /**
   * Saves the eloqua GUID in the page's eloqua form, if present.
   */
  webutils.saveEloquaGuid = function() {
    var timerId = null, timeout = 5;

    function WaitUntilCustomerGUIDIsRetrieved() {
      if (!!(timerId)) {
        if (timeout <= 0) return;
        timeout -= 1;

        if (typeof GetElqCustomerGUID !== 'function') return;

        try {
          document.forms.eloquaform.elements.elqCustomerGUID.value = GetElqCustomerGUID();
        } catch (e) {
          // Could not retrieve elqCustomerGUID from eloqua form
        }
      }

      timerId = setTimeout(WaitUntilCustomerGUIDIsRetrieved, 500);
      return;
    }

    if (typeof _elqQ !== "undefined" && typeof document.forms.eloquaform !== "undefined") {
      window.onload = WaitUntilCustomerGUIDIsRetrieved;
      _elqQ.push(['elqGetCustomerGUID']);
    }
  };

  /**
   * Styles the header and header navigation of the page.
  */

  webutils.styleHeader = function() {
    $(window).ready(function() {
      // Invoke placeholder shim for IE9
      $('input, textarea').placeholder();

      // change header logo to product logo on scroll
      if (!$(".masthead-simple")[0]){
        $(function() {
          var header = $(".site-title a");
          $(window).scroll(webutils.debounce(function() {
            var scroll = $(window).scrollTop();

            if (scroll >= 600) {
              header.addClass("z-logo");
            } else {
              header.removeClass("z-logo");
            }
          }, 100));
        });
      };

      if ($(window).width() < 701 || webutils.isMobile()) {
        $('.masthead-refresh').addClass('masthead-mobile');
      } else {
        $('.masthead-refresh').addClass('masthead-opaque');
      }

      //mobile interaction
      if ($(".masthead-mobile")[0]){
        //primary menu expand
        $('.site-title').click(function() {
          if ( $(this).hasClass('active') ) {
            $(".primary-menu").slideUp();
            $(this).addClass('hamb-menu');
            setTimeout(function(){
              $('.site-title').removeClass("active");
              $("body").attr("style", "");
              $("#menu-header-navigation-mini").attr("style", "");
            }, 700);

          } else {
            $(this).removeClass('hamb-menu');
            $(this).addClass('active');
            $(".primary-menu").slideDown();
            $("body").css({
              // "max-height":"300px",
              "position":"fixed",
              "overflow":"hidden",
              "width":"100%"
            });
            setTimeout(function(){
              $("#menu-header-navigation-mini").css({
                "max-height":(window.innerHeight - 75)+"px",
                "overflow":"scroll",
                "-webkit-overflow-scrolling":"touch"
              });
            },300)

          }

        });

        //sub menu expand
        $('.menu-heading').click(function(){

          var clickedParent = $(this).parent();
            clickedDropdown = clickedParent.children('.primary-menu-list-dropdown');

          if ( (clickedParent.children().hasClass("primary-menu-list-dropdown")) && (clickedParent.hasClass('active-dropdown')) ){
            if (clickedDropdown.is(":visible")) {
              clickedDropdown.slideUp();
              clickedParent.removeClass('active-dropdown');
              return false;
            } else {
              return true;
            }

          } else if (!clickedParent.children().hasClass("primary-menu-list-dropdown")) {
            return true;

          } else {
            clickedParent.addClass('active-dropdown');
            clickedDropdown.slideDown();
            return false;
          }

        });
      }
    });
  }

  /**
   * Registers a modal to be triggered on click of a button, or via an
   * URL hash. Works with forms, and handles state change on submission
   * success or failure.
   *
   * @TODO Describe how to use it.
   *
   * @param {object}   opts The modal's configuration
   * @param {function} fn   The callback to invoke
   */
  webutils.registerModal = function(opts, fn) {
    var body, overlay, bg, wrapper, container, close, form, anchor,
        success, failure, show, hide;

    body      = $('body');
    overlay   = $('<div/>', {'class': 'overlay-form'}).css({display: 'none'});
    bg        = $('<div/>', {'class': 'overlay-bg'}).css({display: 'none'});
    wrapper   = $('<div/>', {'class': 'modal-wrapper'});
    container = $('<div/>', {'class': 'modal-container'});
    content   = $('<div/>', {'class': 'modal-content'});
    close     = $('<a/>',   {'class': 'modal-close', href: '#'});

    container.append(close, content);
    wrapper.append(container);
    overlay.append(bg, wrapper);
    body.append(bg, overlay);

    form    = $(opts.form).css({display: 'none'});
    success = $(opts.success).css({display: 'none'});
    failure = $(opts.failure).css({display: 'none'});

    content.append(form, success, failure);

    // Add success icon before message, and submit class to anchor
    $('<div/>', {'class': 'modal-success'}).prependTo(success)
    anchor = form.find('a');
    anchor.attr('class', 'submit');

    show = function(delay) {
      // Place modal nearby if using mobile, or a small resolution
      var position = 0;
      if ($(window).width() < 768 || $(window).height() < 700 ||
          webutils.isMobile()) {
        position = $(document).scrollTop();
      }

      form.show();
      bg.css({opacity: 0}).show().delay(delay)
        .animate({opacity: 0.6}, 500);
      overlay.css({top: '-1000px', opacity: 0}).show().delay(delay)
        .animate({top: position, opacity: 1}, 500);
    };

    hide = function(e) {
      if (e) e.preventDefault();
      form.hide();
      success.hide();
      failure.hide();
      overlay.hide();
      bg.hide();
    };

    // Ignore clicks in the modal
    container.on('click', function(e) {
      e.preventDefault();
      return false;
    });

    // Clicks outside the modal hide the overlay,
    // as well as the close button
    wrapper.on('click', hide);
    bg.on('click', hide);
    close.on('click', hide);

    // Clicking the form's anchor submits the form
    $(anchor).on('click', function(e) {
      e.preventDefault();
      fn(function(err) {
        form.hide();
        if (err) return failure.show();

        // Clear inputs on success
        form.find('input').val('');
        success.show();
      });
    });

    $(opts.trigger).on('click', function(e) {
      e.preventDefault();
      show(0);
    });

    if (opts.hash && window.location.hash === opts.hash) {
      show(1500);
    }
  };

  /**
   * Registers a modal to be triggered on click of a button, or via an
   * URL hash.
   *
   * @TODO Describe how to use it.
   *
   * @param {object}   opts The modal's configuration
   * @param {function} fn   The callback to invoke
   */
  webutils.registerSimpleModal = function(opts, fn) {
    var body, overlay, bg, wrapper, container, close, show, hide,
      content, inner;

    body      = $('body');
    overlay   = $('<div/>', {'class': 'overlay-form'}).css({display: 'none'});
    bg        = $('<div/>', {'class': 'overlay-bg'}).css({display: 'none'});
    wrapper   = $('<div/>', {'class': 'modal-wrapper'});
    container = $('<div/>', {'class': 'modal-container'});
    content   = $('<div/>', {'class': 'modal-content'});
    close     = $('<a/>',   {'class': 'modal-close', href: '#'});

    container.append(close, content);
    wrapper.append(container);
    overlay.append(bg, wrapper);
    body.append(bg, overlay);

    inner = $(opts.content).html();
    content.append(inner);

    show = function(delay) {
      // Place modal nearby if using mobile, or a small resolution
      var position = 0;
      if ($(window).width() < 768 || $(window).height() < 700 ||
          webutils.isMobile()) {
        position = $(document).scrollTop();
      }

      // form.show();
      bg.css({opacity: 0}).show().delay(delay)
        .animate({opacity: 0.6}, 500);
      overlay.css({top: '-1000px', opacity: 0}).show().delay(delay)
        .animate({top: position, opacity: 1}, 500);
    };

    hide = function(e) {
      if (e) e.preventDefault();
      overlay.hide();
      bg.hide();
    };

    // Ignore clicks in the modal, but not anchors
    container.on('click', function(e) {
      if (e.target && e.target.hasAttribute('href')) return;
      e.preventDefault();
      return false;
    });

    // Something is preventing anchors
    container.on('click', 'a', function(e) {
      if (!e.target || !e.target.hasAttribute('href'));
      window.location = e.target.getAttribute('href');
    });

    // Clicks outside the modal hide the overlay,
    // as well as the close button
    wrapper.on('click', hide);
    bg.on('click', hide);
    close.on('click', hide);

    if (opts.trigger) {
      $(opts.trigger).on('click', function(e) {
        e.preventDefault();
        show(0);
      });
    }

    if (opts.hash && window.location.hash === opts.hash) {
      show(1500);
    }
  };

  /**
   * Shows the Messenger promotion to visitors who haven't opted out. The
   * alert is only shown to non-mobile visitors.
   *
   * @method showPromo
   */

  webutils.cookieNotice = function() {
    if(!$.cookie('cookie_notice')) {
      var notice = $('.cookie-notice');

      notice.show();

      // dismiss click event
      notice.find('.js-disable-notice-cookie').on('click', function(){
        notice.animate({'margin-top':'-' + notice.outerHeight() + 'px'});
        $.cookie('cookie_notice', 'disabled', {expires: 730, path: '\/'});
      });
    }
  }

  /**
   * Shows the Messenger promotion to visitors who haven't opted out. The
   * alert is only shown to non-mobile visitors.
   *
   * @method showPromo
   */
  webutils.showMessengerPromo = function(messageDesc) {
    if (webutils.isMobile() || $.cookie('messenger_alert')) return;

    var message, logEvent, disableAlert;

    message = '<div class="sitewide event alert"><div class="wrap">' +
      '<div class="body"><span class="message"><span class="title">' +
      messageDesc + '</span></span><a class="js-disable close ent-text" '+
      'href="javascript:;"></a></div></div></div>';

    logEvent = function(val) {
      if (!window.ga) return;
      ga('send', 'event', 'messenger banner', val, null, {'nonInteraction': 1});
    }

    disableAlert = function() {
      $.cookie('messenger_alert', 'disabled', {
        expires: 730,
        path: '\/',
        domain: 'zendesk.com'
      });
    }

    $('body').prepend(message);
    logEvent('show');

    // hide alert
    $('.alert .js-disable').on('click', function() {
      disableAlert();
      logEvent('hide');
      $('.sitewide.alert').animate({
        'margin-top':'-' + $('.alert.sitewide').outerHeight() + 'px'
      });
    });

    // log redirect
    $('.alert .redirect').on('click', function() {
      disableAlert();
      logEvent('click');
    });
  };

  /**
   * Helper for loading heap snippet
   */
  webutils.loadHeapSnippet = function(id) {
    window.heap=window.heap||[],heap.load=function(e,t){window.heap.appid=e,window.heap.config=t=t||{};var r=t.forceSSL||"https:"===document.location.protocol,a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=(r?"https:":"http:")+"//cdn.heapanalytics.com/js/heap-"+e+".js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(a,n);for(var o=function(e){return function(){heap.push([e].concat(Array.prototype.slice.call(arguments,0)))}},p=["addEventProperties","addUserProperties","clearEventProperties","identify","removeEventProperty","setEventProperties","track","unsetEventProperty"],c=0;c<p.length;c++)heap[p[c]]=o(p[c])};
    heap.load(id);

    // Keep trying until convertro is loaded or 5s has passed
    var interval = setInterval(function() {
      if (!window.$CVO || !window.$CVO.sid) return;
      heap.addEventProperties({convertroId: window.$CVO.sid});
      clearInterval(interval);
    }, 250);

    setTimeout(function() {
      clearInterval(interval);
    }, 5000);
  };

  /**
   * Asynchronously loads Heap.
   */
  webutils.loadHeap = function() {
    webutils.loadHeapSnippet("1646711747");
  };

  /**
   * Asynchronously loads heap for the inbox homepage.
   */
  webutils.loadInboxHeap = function() {
    webutils.loadHeapSnippet("333349368");
  };

  /**
   * Asynchronously loads Eloqua.
   */
  webutils.loadEloqua = function() {
    window._elqQ = window._elqQ || [];

    _elqQ.push(['elqSetSiteId', '2136619493']);
    _elqQ.push(['elqTrackPageView']);

    (function () {
      function async_load() {
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.async = true;
        s.src = '//img03.en25.com/i/elqCfg.min.js';
        var x = document.getElementsByTagName('script')[0];
        x.parentNode.insertBefore(s, x);
      }

      if (window.addEventListener) window.addEventListener('DOMContentLoaded', async_load, false);
      else if (window.attachEvent) window.attachEvent('onload', async_load);
    })();
  };

  /**
   * Loads Zopim for use on the Japanese website.
   */
  webutils.loadZopim = function() {
    window.$zopim||(function(d,s){var z=$zopim=function(c){z._.push(c)},$=z.s=
    d.createElement(s),e=d.getElementsByTagName(s)[0];z.set=function(o){z.set.
    _.push(o)};z._=[];z.set._=[];$.async=!0;$.setAttribute('charset','utf-8');
    $.src='//v2.zopim.com/?2IzC0iKrPAJDU0ejkB3oGifWkIspR69r';z.t=+new Date;$.
    type='text/javascript';e.parentNode.insertBefore($,e)})(document,'script');

    $zopim(function() {
      $zopim.livechat.hideAll();

      $zopim.livechat.setOnUnreadMsgs(function(num) {
        if(num) { $zopim.livechat.window.show(); }
      });
    });
  };

  /**
   * Fires an event corresponding to the pageName if referred to by one of
   * the home pages in the test.
   *
   * @param {string} pageName
   */
  webutils.trackHomeTest = function(pageName) {
    var page, variation;

    page = document.referrer.replace(/[?#].*/g, '').split('/')[3];
    variation = 'home';

    if (!page || page === variation) {
      webutils.track(pageName);
    }
  };

  /**
   * Loads and fires a Marin conversion event. Marin uses the following mapping
   * of Zendesk values to Marin fields:
   *
   * Convertro ID => order_id
   * Company Size => product
   * Country      => category
   * Rank         => revenue
   *
   * A suffix is added to the order id, seperated by an underscore.
   */
  webutils.trackMarinConversion = function(size, country, rank, suffix, marinId) {
    if (!window._pq) return;

    var order = (window.$CVO) ? window.$CVO.sid : null;
    if (suffix) {
      order = (order || '') + '_' + suffix;
    }

    if (!marinId) {
      marinId = 'trial';
    }

    // Add datalayer object
    window.utag_data = {
      currency_code: 'USD',
      order_id: order,
      product: size,
      category: country,
      revenue: rank
    };

    _pq.push(['track', marinId]);
    webutils.track('Invoked Marin');
  };

  /**
   * Given the company size, performs an ajax call to request the lead data,
   * and immediately fires a conversion event to marin. Differs from
   * trackMarinConversion's use in that the form is expected to have been
   * completed, e.g. for a non-trial, content download or conversion.
   *
   * @param {string} size
   */
  webutils.trackMarinContentConversion = function(size, suffix, marinId) {
    $.ajax({
      dataType: 'json',
      cache: false,
      type: 'get',
      url: '//www.zendesk.com/app/leaddata.json',
      data: {size: size}
    }).done(function(res) {
      webutils.trackMarinConversion(size, res.country, res.rank, suffix, marinId);
    }).fail(function() {
      console.log('Could not retrieve lead data');
    });
  };

  /**
   * Returns whether or not the specified field is valid.
   *
   * @param  {jQuery}  field
   * @return {Boolean}
   */
  webutils.isFieldValid = function(field) {
    var string = field.attr('value');
    var type   = field.attr('type');
    var holder = field.attr('placeholder');

    return (type === 'text' && (string != '' && string != holder && webutils.utf8AlphaNum.test(string))) ||
           (type === 'email' && webutils.emailRegexp.test(string)) ||
           (type === 'select' && string !== '-');
  }

  /**
   * Regular expression for matching emails.
   *
   * @type {RegExp}
   */
  webutils.emailRegexp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  /**
   * Regular expression matching a string containing one or more UTF8 alphanumeric characters.
   * Ranges taken from:
   * Taken from https://github.com/slevithan/xregexp/blob/master/src/addons/unicode-categories.js
   *
   * @type {RegExp}
   */
  webutils.utf8AlphaNum = new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4' +
    '\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5' +
    '\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E' +
    '\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5' +
    '\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC' +
    '\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8' +
    '\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10' +
    '\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D' +
    '\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F' +
    '\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71' +
    '\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA' +
    '\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59' +
    '\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1' +
    '\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1' +
    '\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A' +
    '\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD' +
    '\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055' +
    '\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA' +
    '\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5' +
    '\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4' +
    '\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751' +
    '\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C' +
    '\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B' +
    '\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5' +
    '\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D' +
    '\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC' +
    '\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126' +
    '\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E' +
    '\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6' +
    '\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005' +
    '\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E' +
    '\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F' +
    '\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793' +
    '\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7' +
    '\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B' +
    '\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA' +
    '\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3' +
    '\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28' +
    '\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F' +
    '\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7' +
    '\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC一-龠ぁ-んァ-ヴa-zA-Z0-9ａ-ｚＡ-Ｚ０-９ー]+');

  // Show the promo if on www.zendesk.com/zopim/
  // and if not using a transparent header
  // var host, path;
  // host = window.location.host;
  // path = window.location.pathname.split('/')[1];
  // if (host === 'www.zendesk.com' && path === 'zopim') {
  //   if (!$('.transparent').length) webutils.showMessengerPromo();
  // }

  // Set the home cookie on each request
  setTimeout(webutils.setHomeCookie, 1000);
}(jQuery));
