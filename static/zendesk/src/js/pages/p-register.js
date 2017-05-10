/**
 * Global variables, including translation keys and strings.
 *
 * @var {object}
 */
var _target,
    _activity,
    _legacyBrowser,
    _suggested = '',
    _errorTimer,
    _domainTimer,
    _grecaptchaResponse,
    _attemptedCaptchaSubmission = false,
    _regSubmitFormHandler,
    _lang = {
      selected: 'en',
      register: {
        domaintaken: 'URL Already Taken',
        employees: 'employees',
        checking: 'Checking domain availability...',
        domaininvalid: 'Enter only letters and numbers',
        emailinvalid: 'Enter a valid email address',
        supportemail: "Please don't use your support address to signup",
        langselect: 'Your Zendesk will be hosted here, in',
        password: 'Enter at least 5 characters',
        passwordchars: 'Password can contain letters, numbers,<br>and any of the following: !@#$^&amp;*()_+.-',
        creationFailed: "Sorry! Something went wrong and we couldn't setup your Zendesk",
        creationFailedSecondary: "We've notified our support team of the issue",
        loginTooltip: "Click above to make Zendesk setup even easier",
        prohibited: 'You appear to be in a Prohibited Jurisdiction under our ' +
          '<a href="http://www.zendesk.com/company/terms">Terms of Service</a>. ' +
          'If this is an error, please email legal@zendesk.com.'
      }
    };

/**
 * The form submission handler passed to the "data-callback" attribute
 * of Google's ReCAPTCHA
 */
function recaptchaSubmitHandler(token) {
  _grecaptchaResponse = token;

  if (_attemptedCaptchaSubmission && _regSubmitFormHandler) {
    _regSubmitFormHandler();
  }
}

(function($) {
  /**
   * Whether or not clearbit should be used to enrich profile data.
   *
   * @var {boolean}
   */
  var enableClearbit = true;

  /**
   * Whether or not clearbit was used to skip the company step.
   *
   * @var {boolean}
   */
  var skippedCompanyStep = false;

  /**
   * Whether or not to enable skipping company/personal details steps
   * when using a personal email. Flag fetched from /app/emailinfo.json
   *
   * @var {boolean}
   */
  var enablePersonalEmailSkip = false;

  /**
   * Whether or not the visitor used a personal email. They would have then
   * skipped both company and personal details steps.
   *
   * @var {boolean}
   */
  var personalEmail = false;

  /**
   * Whether or not the visitor is a lead. If false, they're a Zendesk employee
   * This is determined on the second step, after which both their email
   * and company name have been entered.
   *
   * @var {boolean}
   */
  var lead = true;

  /**
   * Check if this is a promotional startup account registration.
   * If so we'll force USD.
   *
   * @var {boolean}
   */
  var promotion = (webutils.getURLParameter('promo') === 'startups');

  /**
   *
   * User's rank
   *
   * @var {string|null}
   */
  var rank;

  /**
   * User's ISO3166-1 country code
   *
   * @var {string|null}
   */
  var country;

  /**
   * The plan name. One of trial, starter, regular, plus or enterprise.
   *
   * @var {string}
   */
  var plan = 'trial';
  var plans = plans = ['essential', 'team', 'professional', 'enterprise'];

  for (var j = 0; j < plans.length; j++) {
    if (window.location.pathname.indexOf(plans[j]) !== -1) {
      plan = plans[j];
      break;
    }
  }

  /**
   * The environment to target.
   *
   * @var {string}
   */
  var env = 'production';
  if (window.location.search.indexOf('env=master') !== -1) {
    env = 'master';
  } else if (window.location.search.indexOf('env=staging') !== -1) {
    env = 'staging';
  }

  /**
   * The final Next button in the reg form that submits the form to initiate
   * account creation.
   *
   * @type {jQuery}
   */
  var $regFormSubmitBtn = $('.create-account');

  /**
   * A mapping of profile field names to their inputs.
   *
   * @var {object}
   */
  var $fields = {
    email:           $('input[name="owner[email]"]'),
    password:        $('input[name="owner[password]"]'),
    company:         $('input[name="account[name]"]'),
    subdomain:       $('input[name="account[subdomain]"]'),
    token:           $('input[name="account[google_access_token]"]'),
    size:            $('select[name="account[help_desk_size]"]'),
    name:            $('input[name="owner[name]"]'),
    phone:           $('input[name="address[phone]"]'),
    googleAppsAdmin: $('input[name="trial_extras[google_apps_admin]"]'),
    xsellSource:     $('input[name="trial_extras[xsell_source]"]'),
    productSignUp:   $('input[name="trial_extras[product_sign_up]"]')
  };

  /**
   * A regex for scrubbing invalid characters from a subdomain.
   * Alphanumeric and dashes are the only allowed characters.
   *
   * @var {string}
   */
  var SUBDOMAIN_REGEX = /[^a-zA-Z0-9\-]/g;

  /******************************************************
   * Google Apps logic
   ******************************************************/

  /**
   * The user's Google profile information if logged in, otherwise null.
   * If logged in, the object contains the following keys: name, email
   *
   * @var {object|null}
   */
  var googleProfile;

  /**
   * The callback function invoked when the Google login button is clicked.
   * Redirects the user to the google oauth2 page, requesting permissions
   * to retrieve their email address.
   */
  function googleClickHandler() {
    var redirect = encodeURIComponent(window.location.href.split('#')[0]);
    webutils.redirect('//www.zendesk.com/app/google-auth?redirect=' + redirect);
  }

  function googleCallbackHandler() {
    $('.step.step-1').css({opacity: 0});
    $('#googlelogin').hide();
    $('#or').hide();

    getGoogleProfile(function(err) {
      if (err || !googleProfile || !googleProfile.email || !googleProfile.token || googleProfile.subdomain) {
        $('.step.step-1').css({opacity: 1});

        if (googleProfile.subdomain) {
          var zendesk = googleProfile.subdomain + '.zendesk.com';
          var message = 'Your Google Apps domain (' + googleProfile.domain +
            ') is already linked to a Zendesk account at <a href="https://' + zendesk +'">'
            + zendesk + '</a>';
          $('.step-1 .col-left').html(message);
        } else {
          $('#googlelogin').show();
          $('#or').show();
        }

        return;
      }

      if (googleProfile.domain) {
        // Defined in zendesk/zendesk_core
        $('input[name="account[google_apps_domain]"]').val(googleProfile.domain);
        $('input[name="trial_extras[google_apps_domain]"]').val(googleProfile.domain);
      }

      var isGmail = googleProfile.email.indexOf('gmail') !== -1;
      var isZendesk = googleProfile.email.indexOf('zendesk') !== -1;
      var companyName;

      webutils.track('Multistep Trial > Google Login');

      getGoogleAdminStatus(function(err, admin) {
        if (err) return;

        if (!admin) {
          $fields.googleAppsAdmin.val('0');
        } else {
          $fields.googleAppsAdmin.val('1');
          webutils.track('Multistep Trial > Google Apps Admin');
        }
      });

      if (!isGmail && !isZendesk) {
        var split = googleProfile.email.split('@')[1].split('.');
        companyName = (split.length > 1) ? split[split.length - 2] : '';
        if (companyName && companyName.length <= 3) {
          companyName = (split.length > 2) ? split[split.length - 3] : '';
        }
        if (companyName) {
          companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
        }
        $fields.company.val(companyName);
      } else if (isZendesk) {
        // Use z3n for zendesk emails
        companyName = 'z3n';
        $fields.company.val(companyName);
      }

      $fields.email.val(googleProfile.email);
      $fields.name.val(googleProfile.name);
      $('input[name="trial_extras[created_via_google]"]').val('1');
      $fields.token.val(googleProfile.token);
      $('li.password-row').remove();

      var loadStep = nextHandler(1);
      loadStep();

      if (!isGmail) {
        // Simulate keyup and blur to force the trailing domain to move,
        // and the validation to fire for the subdomain
        var subdomain = companyName.trim().replace(SUBDOMAIN_REGEX).toLowerCase();
        $fields.subdomain.val(subdomain);
        $fields.subdomain.keyup();
        $fields.subdomain.blur();
      }
    });
  }

  /**
   * Retrieves the Google Profile from node and the google API.
   *
   * @param {function} fn
   */
  function getGoogleProfile(fn) {
    // This first response contains the user's email, token and potential
    // domain if using Google Apps
    $.ajax({
      dataType: 'json',
      url: '//www.zendesk.com/app/google-profile.json',
      cache: false,
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      }
    }).done(function(res) {
      googleProfile = res;

      // Retrieve the user's name
      var profileUrl = 'https://www.googleapis.com/oauth2/v1/userinfo?' +
        'alt=json&access_token=' + res.token;

      $.ajax({
        dataType: 'json',
        url: profileUrl,
        cache: false
      }).done(function(res) {
        googleProfile.name = res.name || res.given_name;
        fn();
      }).fail(function() {
        fn(new Error('Could not retrieve profile'));
      });
    });
  }

  /**
   * Returns whether or not the user is a google admin.
   *
   * @param {function} fn
   */
  function getGoogleAdminStatus(fn) {
    if (!googleProfile || !googleProfile.token) {
      return fn(new Error('No google token'));
    }

    var baseUrl = 'https://www.googleapis.com/admin/directory/v1/users/';
    var opts = {
      url: baseUrl + googleProfile.email,
      cache: false,
      dataType: 'json',
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + googleProfile.token);
      }
    };

    $.ajax(opts).done(function() {
      fn(null, true);
    }).fail(function() {
      fn(null, false);
    });
  }

  // Bind Google handlers
  $('#googlelogin').click(googleClickHandler);
  if (window.location.hash === '#googleloggedin') {
    // Logged in from reg flow
    googleCallbackHandler();
  } else if (window.location.hash === '#gamloggedin') {
    // Logged in from Google Apps Marketplace
    $('input[name="account[source]"]').val('Google App Market');
    webutils.track('Multistep Trial > From Google App Market');
    googleCallbackHandler();
  }

  /******************************************************
   * Office 365 logic
   ******************************************************/

  /**
   * The user's Office profile information if logged in, otherwise null.
   * If logged in, the object contains the following keys: name, email
   *
   * @var {object|null}
   */
  var officeProfile;

  /**
   * The callback function invoked when the Office login button is clicked.
   * Redirects the user to the office oauth2 page, requesting permissions
   * to retrieve their email address.
   */
  function officeClickHandler() {
    var redirect = encodeURIComponent(window.location.href.split('#')[0]);
    webutils.redirect('//www.zendesk.com/app/office-auth?redirect=' + redirect);
  }

  function officeCallbackHandler() {
    $('.step.step-1').css({opacity: 0});
    $('#officelogin').hide();
    $('#or').hide();

    getOfficeProfile(function(err) {
      if (err || !officeProfile || !officeProfile.email || !officeProfile.name || !officeProfile.domain) {
        $('.step.step-1').css({opacity: 1});
        return;
      }

      if (officeProfile.domain) {
        // Defined in zendesk/zendesk_core
        $('input[name="trial_extras[office_domain]"]').val(officeProfile.domain);
      }

      var isOutlook = officeProfile.email.indexOf('outlook') !== -1;
      var isHotmail = officeProfile.email.indexOf('hotmail') !== -1;
      var isMSN = officeProfile.email.indexOf('msn') !== -1;
      var companyName;

      webutils.track('Multistep Trial > Office Login');

      if (!isOutlook && !isHotmail && !isMSN) {
        var split = officeProfile.email.split('@')[1].split('.');
        companyName = (split.length > 1) ? split[split.length - 2] : '';
        if (companyName && companyName.length <= 3) {
          companyName = (split.length > 2) ? split[split.length - 3] : '';
        }
        if (companyName) {
          companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
        }
        $fields.company.val(companyName);
      }

      $fields.email.val(officeProfile.email);
      $fields.name.val(officeProfile.name);
      $('input[name="trial_extras[created_via_office_365]"]').val('1');
      $('li.password-row').remove();

      var loadStep = nextHandler(1);
      loadStep();

      if (!isOutlook && !isHotmail && !isMSN) {
        // Simulate keyup and blur to force the trailing domain to move,
        // and the validation to fire for the subdomain
        var subdomain = companyName.trim().replace(SUBDOMAIN_REGEX).toLowerCase();
        $fields.subdomain.val(subdomain);
        $fields.subdomain.keyup();
        $fields.subdomain.blur();
      }
    });
  }

  /**
   * Retrieves the Office Profile from node and the office API.
   *
   * @param {function} fn
   */
  function getOfficeProfile(fn) {
    // This first response contains the user's email, token and potential
    // domain if using Office
    $.ajax({
      dataType: 'json',
      url: '//www.zendesk.com/app/office-profile.json',
      cache: false,
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      }
    }).done(function(res) {
      officeProfile = res;
      fn();
    }).fail(function() {
      fn(new Error('Could not retrieve profile'));
    });
  }

  // Bind Office handlers
  $('#officelogin').click(officeClickHandler);
  if (window.location.hash === '#officeloggedin') {
    // Logged in from reg flow
    officeCallbackHandler();
  }

  /******************************************************
   * Core logic
   ******************************************************/

  /**
   * A function that preloads pod-specific lotus assets. Assets are loaded
   * with a concurrency level of 1 so that the browser will yield connections
   * as necessary for form-related actions.
   */
  function preload() {
    $.ajax({
      url: '//www.zendesk.com/app/lotusassets.json',
      type: 'GET',
      cache: false
    }).done(function(assets) {
      if (!(assets instanceof Array) || !assets.length) return;

      var recursivelyLoad = function(i) {
        if (i >= assets.length) return;

        // text dataType prevents jQuery from executing the script
        $.ajax({
          url: assets[i],
          dataType: 'text',
          type: 'GET',
          cache: true
        }).done(function() {
          setTimeout(function() {
            recursivelyLoad(++i);
          }, 300);
        });
      };

      recursivelyLoad(0);
    });
  }

  /**
   * Stores the list and number of subdomains found in cross-storage in form
   * inputs to be passed to the registration call. A comma delimited list is
   * stored in trial_extras[mixpanel_subdomains], and the total number in
   * trial_extras[mixpanel_subdomains_num].
   */
  function storeSubdomains() {
    var subField, numSubField;

    subField = $('input[name="trial_extras[mixpanel_subdomains]"]');
    numSubField = $('input[name="trial_extras[mixpanel_subdomains_num]"]');

    // Remove the mixpanel inputs if there's nothing to pass
    var removeFields = function() {
      subField.remove();
      numSubField.remove();
    };

    webutils.getSubdomains().then(function(res) {
      if (!res || !res.length) return removeFields();

      var subdomains = res.map(function(subdomain) {
        return subdomain.split('.zendesk')[0];
      }).join(',');

      subField.val(subdomains);
      numSubField.val(res.length);
    }, removeFields);
  }

  /**
   * Given an email, performs an ajax request to retrieve information including
   * company details. The resulting details are passed to the callback function.
   *
   * @param {string}   email Email to lookup
   * @param {function} fn    Callback function to invoke
   */
  function lookupEmail(email, fn) {
    var defaultRes = {
      personalEmail: null,
      companyName: null,
      companySize: null
    };

    $.ajax({
      url: '//www.zendesk.com/app/emailinfo.json?email=' + email,
      dataType: 'json',
      timeout: 2000
    }).done(function(data) {
      enablePersonalEmailSkip = data.enablePersonalEmailSkip;
      fn(data || defaultRes);
    }).fail(function() {
      fn(defaultRes);
    });
  }

  /**
   * Modified registration code
   */

  /*
   * Convertro
   */
  $CVO = window.$CVO || [];

  /**
   * Validate form elements
   *
   * @params (target:dom element) form element to validate
   */
  function validate(target) {
    var string = target.val(),
      type   = target.attr('type'),
      holder = target.attr('placeholder'),
      pin    = target.parent().find('label.error'),
      fade   = (pin.css('opacity') === '1') ? false : true;

    if (holder === 'company.zendesk.com') {
      if (string === '' || string === holder) {
        if (target.parent().hasClass('error')) return;

        pin.css({
            'display' : 'block',
            'width' : '100%',
            'opacity' : ((fade === false) ? 1 : 0),
            'margin-top' : '-48px'
          })
          .animate({
            'opacity' : 1,
            'margin-top' : '-5px'
          }, 300);

        target.removeClass('set');
        target.parent().addClass('error');
      }
    } else {
      if ((type === 'text' && (string === '' || string === holder || !webutils.utf8AlphaNum.test(string))) ||
      (type === 'email' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(string)) ||
      (type === 'select' && target.find('option:selected').val() === '-') ||
      (type === 'password' && !googleProfile && string.length < 5)  ||
      (type === 'email' && webutils.isSupportEmail(string))) {
        // Prevent invocation when already displayed
        if (target.parent().hasClass('error')) return;

        // Email field has two possible errors: emailinvalid and supportemail
        var supportFlag, emailLangKey;
        if (type === 'email') {
          if (webutils.isSupportEmail(string)) {
            supportFlag = true;
            emailLangKey = 'supportemail';
          }

          emailLangKey = emailLangKey || 'emailinvalid';
          pin.html('<span></span>' + _lang.register[emailLangKey]);
          pin.attr('class', 'error');
        }

        pin.css({
            'display' : 'block',
            'width' : '100%',
            'opacity' : ((fade === false) ? 1 : 0),
            'margin-top' : '-48px'
          })
          .animate({
            'opacity' : 1,
            'margin-top' : '-5px'
          }, 300);

        target.removeClass('set');
        target.parent().addClass('error');

        if (type === 'password') {
          pin.html('<span></span>' + _lang.register.password);
          pin.attr('class', 'error');
        }

        if (target.attr('placeholder') === 'company.zendesk.com') {
          $('label.suggested').hide();
        }
      } else {
        pin.animate({
          'opacity' : 0,
          'margin-top' : '-48px'
        }, 200, function(){
          target.parent().removeClass('error');
        });

        target.addClass('set');
      }
    }
  }

  /**
   * Check if subdomain is available
   *
   * @params (domain:string)
   */
  function domainLookup(domain, attempts) {
    var altSuffixes = ['help', 'support'];
    attempts = attempts || 0;

    // Too many attempts, the service is likely unavailable or being abused
    if (attempts > 10) return;

    $.ajax({
      url: '/wp-content/themes/zendesk-twentyeleven/lib/domain-check.php?domain=' + domain,
      type: 'POST',
      data: 'domain=' + domain,
      cache: false,
      success: function(data) {
        if (typeof data.available != 'undefined') {
          if (data.available === 'true') {
            var address = $('input[name="account[subdomain]"]'),
                root = address.val(),
                pin = $('label.suggested');

            clearTimeout(_domainTimer);
            address.val(domain);

            if (pin.html().substr(26) === _lang.register.checking || _suggested != root.substr(0, _suggested.length)) {
              pin.animate({
                'opacity' : 0,
                'margin-top' : '-48px'
              }, 200, function(){
                pin.parent().removeClass('error');
              });

              address.addClass('set');
            }

            $('.domain-ping').hide();

            domainTrail();
          } else {
            _domainTimer = setTimeout(function() {
              if (!attempts) {
                // We're on the first suffix
                domain += altSuffixes[attempts];
              } else if (attempts < altSuffixes.length) {
                // delete prior suffix and add new one
                domain = domain.substr(0,
                  domain.length - altSuffixes[attempts - 1].length);
                domain += altSuffixes[attempts];
              } else {
                // Delete last suffix before rotating numbers
                if (attempts === altSuffixes.length) {
                  domain = domain.substr(0,
                    domain.length - altSuffixes[attempts - 1].length);
                }

                var num = domain.substr(domain.length - 1);

                if (!isNaN(parseFloat(num)) && isFinite(num)) {
                  domain = domain.substr(0, domain.length - 1) + Math.floor(Math.random()*100+1);
                } else {
                  domain += '1';
                }
              }

              domainLookup(domain, attempts + 1);
            }, 350);
          }
        }
      },
      error: function() {
        domainLookup(domain, attempts + 1);
        webutils.track('Multistep Trial > Domain lookup error');
      }
    });
  }

  /**
   * Show error for targeted form field
   *
   * @params (target:dom element) form field
   */
  function showError(target) {
    var pin  = target.parent().find('label'),
      fade = (pin.css('opacity') === '1') ? false : true;

    pin.css({
        'opacity' : ((fade === false) ? 1 : 0),
        'margin-left' : '1em'
      })
      .animate({
        'opacity' : 1,
        'margin-left' : '0'
      }, 300);

    target.parent().addClass('error');

    window.clearTimeout(_errorTimer);
    _errorTimer = setTimeout(function() {
      validate(target);
    }, 900);
  }

  function formatName() {
    var name, names;

    name  = $('input[name="owner[name]"]').val();
    names = name.indexOf(' ');

    if (names === -1) {
      $('#FirstName').attr('value', name);
      $('#LastName').attr('value', name);
    } else {
      $('#FirstName').attr('value', name.substr(0, names));
      $('#LastName').attr('value', name.substr(names + 1, name.length));
    }
  }

  /**
   * Track and limit account creation retries.
   */
  var registerRetries, maxRegisterRetries;

  registerRetries = 0;
  maxRegisterRetries = 0;

  function register(form) {
    webutils.setMAVs(true);
    formatName();

    var timeOffset = (new Date()).getTimezoneOffset() / 60 * (-1),
        domain     = $('input[name="account[subdomain]"]'),
        phone      = $('input[name="address[phone]"]'),
        company    = $('input[name="account[name]"]');

    domain.val(domain.val().replace(/www./g, ''));
    domain.val(domain.val().replace(/http:\/\//g, ''));
    domain.val(domain.val().replace(/[^\w\-]/g, ''));
    domain.val(domain.val().replace('xn--', ''));
    domain.val(domain.val().substring(0, 50));

    phone.val(phone.val().replace(/[^0-9]/g, ''));

    if (!$("input[name='account[utc_offset]']").length) {
      form.prepend('<input type="hidden" name="account[utc_offset]" value="' + timeOffset + '" />');
    }

    if (phone.val() === '') {
      phone.val('Unknown');
    }

    var creationFailed = function(res) {
      if (!lead) return;
      webutils.track('Multistep Trial > Creation failed', {
        subdomain: domain.val(),
        res: JSON.stringify(res)
      });
    };

    // Shows a failure message after the set number of failures
    var showFailure = function(res, prohibited) {
      var reason, span;

      reason = _lang.register[(prohibited) ? 'prohibited' : 'creationFailed'];
      creationFailed(res);

      $('.step .staging img').hide();
      $('.step .staging span').hide();
      $('.step .staging .prompt').hide();
      $('.step .staging h1').html(reason);

      if (!prohibited) {
        span = $('<span />')
          .addClass('secondary-info')
          .text(_lang.register.creationFailedSecondary);
        $('.step .staging').append(span);
      }
    };

    var baseRegUrl, useFastCreation, reqOptions, formData;

    // New endpoint also requires that language be part of account
    // Set window.disableFastCreation to true in optimizely to quickly disable
    if (window.disableFastCreation) {
      baseRegUrl = '//www.zendesk.com/app/accounts.json';
    } else {
      useFastCreation = true;
      baseRegUrl = '//www.zendesk.com/app/v2/accounts_fast.json';
      $('select#language')
        .attr('name', 'account[language]')
        .attr('id', 'account[language]');
    }

    // account.json uses x-www-form-urlencoded, while accounts_fast.json
    // uses application/json
    reqOptions = {
      url: baseRegUrl + ((_legacyBrowser) ? '?force_classic=true&' : '?'),
      type: 'POST',
      cache: false
    };

    if (useFastCreation) {
      $('input[name="trial_extras[mixpanel_fast_creation]"]').val('true');

      if (lead) webutils.track('Multistep Trial > Fast Account Creation');

      // Merge values since serializeObject doesn't support multiple forms
      // Leading boolean value forces a deep copy
      formData = {};
      formData['g-recaptcha-response'] = _grecaptchaResponse;
      $('form.reg').each(function(i, val) {
        $.extend(true, formData, formData, $(val).serializeObject());
      });
      reqOptions.data = JSON.stringify(formData);
      reqOptions.contentType = 'application/json';
    } else {
      reqOptions.data = form.serialize();
    }

    $.ajax(reqOptions).done(function(res) {
      registerRetries++;

      if (res.success) {
        // Request actually succeeded
        if (lead) {
          webutils.track('Multistep Trial > API Request Succeeded');
        }
        parseResponse(res);
      } else if (res.errors instanceof Array) {
        // Response was 200, but when passed an array of errors, the API
        // is always indicating that the subdomain was taken, so we return
        // them to the first step
        creationFailed(res);
        parseResponse(res);
      } else if (res.message && res.message.indexOf('Prohibited') !== -1) {
        showFailure(res, true);
      } else if (registerRetries <= maxRegisterRetries) {
        // Can still retry
        register($('form.reg'));
      } else {
        // A non-subdomain error occurred with a 200 response code
        showFailure(res);
      }
    }).fail(function(xhr, status, err) {
      function heapEventProps() {
        var result = {
          statusCode: xhr.status,
          subdomain: formData.account.subdomain,
          source: formData.account.source
        };
        return $.isPlainObject(xhr.responseJSON)
          ? Object.keys(xhr.responseJSON).reduce(function(result, key) {
            var val = xhr.responseJSON[key];
            result[key] = typeof val === 'object' ? JSON.stringify(val) : val;
            return result;
          }, result)
          : result;
      }

      if (lead) {
        webutils.track('Multistep Trial > API Request Failed', heapEventProps());
      }

      registerRetries++;
      if (registerRetries <= maxRegisterRetries) {
        register($('form.reg'));
      } else {
        // Likely no way to recover if it's failed this many times. The
        // API is probably unavailable
        showFailure();

        if (window.handleAccountCreationFailure) {
          window.handleAccountCreationFailure();
        }
      }
    });

    if (lead) {
      webutils.track('Multistep Trial > API Request');
    }
  }

  function parseResponse(response) {
    var form = $('form.reg');

    if (response.success) {
      try {
        webutils.addTrialHomeCookie();
      } catch (e) { }

      // Old and new endpoints use different properties for redirects
      var verification;
      if (response.owner_verification_link) {
        verification = response.owner_verification_link;
      } else {
        verification = response.right_away_link;
      }

      if (plan === 'essential') {
        verification += '?plan_redirect=small';
      } else if (plan === 'team') {
        verification += '?plan_redirect=medium';
      } else if (plan === 'professional') {
        verification += '?plan_redirect=large';
      } else if (plan === 'enterprise') {
        verification += '?plan_redirect=extra_large';
      }

      webutils.redirect(verification);
    } else {
      if (window.handleAccountCreationFailure) {
        window.handleAccountCreationFailure();
      }

      setTimeout(function(){
        var curr = $('.step.step-5'),
            next = $('.step.step-1');

        $('.check').css('opacity', 0);

        curr.animate({'margin-left':-390, 'opacity':0 }, 300, function(){
          $(this).hide(); // ie8
        });

        next.css({'opacity':0.5, 'margin-left':250, 'display':'block'})
            .animate({'margin-left':0, 'opacity':1}, 400, 'easeInCirc');
      }, 1000);

      $.each(response.errors, function (index, value) {
        var ident  = ['subdomain', 'company', 'name', 'email', 'password'],
            len    = ident.length;

        if (value.toLowerCase().indexOf('jurisdiction') === -1) {
          for (var i = 0; i < len; i++) {
            if (value.toLowerCase().indexOf(ident[i]) === 0) {
              if (ident[i] === 'subdomain') {
                $('label.suggested').hide();

                if (value.indexOf('3') != -1) {
                  $('label.url').html(_lang.register.domaininvalid);
                } else {
                  $('label.url').html(_lang.register.domaintaken);
                }
              }

              var target = form.find('.' + ident[i]),
                  pin = target.parent().find('label.error');

              target.parent().addClass('error');

              pin.css({
                  'display' : 'block',
                  'width' : '100%',
                  'opacity' : 0,
                  'margin-left' : '1em'
                })
                .animate({
                  'opacity' : 1,
                  'margin-left' : '0'
                }, 300);

              target.parent().addClass('error');
            }
          }
        } else {
          $('form').html('<h1 style="font: 22px/1 DNRM; text-transform: uppercase; color: rgb(199, 19, 19); margin-top:10px;">Unable to create account</h1><h3 style="margin-bottom:22px;">In compliance with U.S. economic sanctions laws and regulations, we are unable to set up a Zendesk account for visitors in your region. If you feel like you\'ve recieved this notification in error please contact our support department <a href="mailto:support@zendesk.com">support@zendesk.com</a>');
        }
      });
    }
  }

  /**
   * Set the default help desk language in the signup form
   * based on the accept-language headers
   */
  function setLang() {
    if (window.location.hostname === 'www.zendesk.com') {
      $.ajax({
        url:      '/wp-content/themes/zendesk-twentyeleven/lib/lang.php',
        dataType: 'jsonp',
        success:  function(data) {
          var lang = $('#' + data.lang);

          lang.attr('selected', true);

          $('#selected-lang a').html($('#language option:selected').text() + '<span></span>');
        }
      });
    } else {
      var host = window.location.hostname.split('.');
      var lang = $('#' + host.pop());

      lang.attr('selected', true);

      $('#selected-lang a').html($('#language option:selected').text() + '<span></span>');
    }
  }

  /**
   * Lead event triggers and syncing for Optimizely and behavioral
   * cookies.
   */
  function broadcast() {
    // Ignore employees
    if (!lead) return;

    var form      = $('form.reg'),
      name      = form.find('.name').val(),
      email     = form.find('.email').val(),
      company   = form.find('.company').val(),
      employees = form.find('.employees').val(),
      domain    = form.find('.subdomain').val(),
      host      = location.hostname.substr(location.hostname.indexOf('.') + 1);

    webutils.trackMarinConversion($fields.size.val(), country, rank);

    name = name.split(' ')[0];

    // update behavioral cookie
    if ($.cookie('flight')) {
      var visitor = JSON.parse(String($.cookie('flight')));

      visitor.trials++;
      visitor.domain = domain;

      $.cookie('flight', JSON.stringify(visitor), {expires: 730, path: '\/', domain: host});
    }

    // Fire conversion events for GA and optimizely
    if (typeof ga !== 'undefined') {
      ga('create', 'UA-970836-4');
      ga('send', 'pageview', '/lead/trial');
    }

    window.optimizely = window.optimizely || [];
    if (webutils.getURLParameter('ref') == 'nav') {
      window.optimizely.push(['trackEvent', 'nav_trial_click_to_lead']);
    }
    webutils.track('Multistep Trial > Converted', {
      loggedIn: !!googleProfile || !!officeProfile,
      personalEmail: personalEmail
    });

    // Temporary, for personal email test
    if (personalEmail) {
      webutils.track('Multistep Trial > Personal Converted');
    }

    // Temporary for ab test
    if (googleProfile) {
      webutils.track('Multistep Trial > Google Converted');
    }

    webutils.trackHomeTest('Multistep Trial > Converted from Home');

    try {
      // Update the nurture flow, marking the account as created
      $('#created').val('true');

      // Disabled nurture
      // if (lead) webutils.postToEloqua('form.reg');

      // Store number of seats in ZOBU_2
      if ($('select[name="trial_extras[expected_num_seats]"]').length) {
        var numSeats = $('select[name="trial_extras[expected_num_seats]"] option:selected').val();
        $('input#ZOBU_2').val(numSeats);
      }

      // Store login state to ZOBU_3
      if (googleProfile && googleProfile.email) {
        $('input#ZOBU_3').val('google_logged_in');
      }

      // Redirect eloqua from nurture flow to reg form
      if ($('#elqFormName').val() === 'WebsiteRegisterNurtureForm') {
        $('#elqFormName').val('WebsiteRegisterForm');
      }
      if (lead) webutils.postToEloqua('form.reg');
    } catch (e) {
      // Couldn't post to eloqua
    }

    if (typeof dataLayer != 'undefined') {
      dataLayer.push({'event': 'trial_created'});
    }

    if (plan != 'trial') {
      $CVO.push([ 'trackEvent', {type: 'Buy Signup' }]);
    } else {
      $CVO.push([ 'trackEvent', { type: 'Trial Signup' }]);
    }
  }

  var trial      = $('#trial'),
    marketo      = false,
    inputCompany = $('input#account\\[name\\]'),
    inputDomain  = $("input#account\\[subdomain\\]"),
    modal = $('form.reg');

  /**
   * An array of objects outlining form states, including their title and
   * corresponding fragment.
   *
   * @var {object[]}
   */
  var states = [
    {title: "Register | Let's Get Started",  fragment: 'getstarted'},
    {title: 'Register | About Your Company', fragment: 'company'},
    {title: 'Register | About Yourself',     fragment: 'aboutyourself'},
    {title: 'Register | Subdomain',          fragment: 'subdomain'},
    {title: 'Register | Building',           fragment: 'building'}
  ];

  /**
   * Invokes the necessary to progressively show checks for each of the visible
   * inputs in a given step, and returns the required delay before displaying
   * the next page.
   *
   * @example
   * showChecks('.step-1');
   *
   * @param   {string} step Class for the step in which to show checkmarks
   * @returns {int}    The delay
   */
  var showChecks = function(step) {
    var checks, delay, i;

    // Only look at checks for visible inputs
    checks = $(step + ' li:visible .check');
    delay = 150;

    for (i = 0; i < checks.length; i++) {
      $(checks[i])
        .delay(delay*i)
        .css({'top':40, 'z-index':2})
        .animate({'opacity':1, 'top':'50%'}, 100);

      delay += 100;
    }

    // Calculate the final delay generated by the loop below
    return (100 * (checks.length - 1) + 150) * checks.length;
  };

  /**
   * Logic to be invoked after company has been provided. Invokes domain
   * logic and determines whether or not the user is a lead.
   */
  function afterCompany() {
    // Add user to "lead" dimension if not a zendesk employee, as identified
    // by a zendesk email, or by using z3n/k3n in company/subdomain
    var company, email;
    email   = $('input[name="owner[email]"]').val().toLowerCase();
    company = $('input[name="account[name]"]').val().toLowerCase();

    $('input[name="account[subdomain]"]').addClass('active');
    inputDomain.keyup();
    inputDomain.blur();

    // If not a lead, broadcast() will not fire for that visitor
    if (email.indexOf('@zendesk') === -1 &&
        company.indexOf('z3n') === -1 &&
        company.indexOf('k3n') === -1) {
      if (window.optimizely) {
        optimizely.push(['setDimensionValue', 'lead', 'lead']);
      }
    } else {
      lead = false;
      if (typeof heap !== 'undefined' && heap.track) {
        heap.track('notlead', {details: company + ':' + email});
      }
    }
  }

  /**
   * Returns a function to be used as a listener for a next button click in
   * order to animate checkmarks into each form element and display the next
   * page in the form. It also validates each of the required fields, and only
   * renders the next step if no errors were found.
   *
   * @example
   * $('.step-1 a.next').click(nextHandler(1));
   *
   * @param {int} step The number of the current step
   */
  function nextHandler(step) {
    return function() {
      var required, i;

      if (step === 2) afterCompany();

      required = $('.step' + step + '.required');
      for (i = 0;i < required.length; i++) {
        validate($(required[i]));
      }

      setTimeout(function() {
        var switchDelay, state, emailInfo, nextStep, curr, next, transition, chicken;

        chicken = $('.chicken-container');

        nextStep = step + 1;
        curr = $('.step.step-' + step);
        next = $('.step.step-' + nextStep);

        // Return only if the current steps has errors
        if ($('.step-' + step + ' li.error').length) return;

        transition = function() {
          $('html, body').animate({ scrollTop: 0 }, 'slow');
          switchDelay = showChecks('.step-' + step);

          // Form inputs are valid, track progress
          webutils.setMAVs(true);
          formatName();

          setTimeout(function() {
            if (lead) {
              webutils.track('Multistep Trial > Step ' + nextStep);
            }

            curr.animate({'margin-left':-550, 'opacity':0}, 350, function(){
              $(this).hide(); // ie8
            });

            chicken.attr('class', chicken.attr('class').replace(/\s+step\d/, ''));
            chicken.addClass('step' + nextStep);

            next
              .css({'opacity':0.5, 'margin-left':200, 'display':'block'})
              .animate({'margin-left':0, 'opacity':1}, 300, function() {
                domainTrail();
              });

            // Required to skip the second state
            if (skippedCompanyStep && step < 3) {
              state = states[step + 1];
            } else {
              state = states[step];
            }

            webutils.pushStateFragment(state.title, state.fragment);
          }, switchDelay);
        };

        if ($fields.size.val() !== '-' && lead) updateLeadData();

        if (step === 1 && enableClearbit) {
          lookupEmail($fields.email.val(), function(res) {
            var split = ($fields.email.val() + '').split('@');

            if (res.personalEmail) {
              webutils.track('Multistep Trial > Personal Email');
            } else {
              webutils.track('Multistep Trial > Company Email');
            }

            if (res.companyName) {
              webutils.track('Multistep Trial > Company Match');
            } else if (!res.personalEmail && !res.companyName) {
              $('input[name="trial_extras[company_miss]"]').val('1');
            } else if (res.personalEmail) {
              personalEmail = true;
              $('input[name="trial_extras[personal_email]"]').val('1');
            }

            if (enablePersonalEmailSkip && personalEmail) {
              $('input[name="trial_extras[personal_email_skipped]"]').val('1');
            }

            if (!personalEmail) {
              // Fill out subdomain if it's a company email
              var emailDomain = split[split.length - 1].split('.')[0];
              var subdomain = emailDomain.trim().toLowerCase()
                .replace(SUBDOMAIN_REGEX, '');

              if (res.companyName === 'Zendesk') {
                res.companyName = 'z3n';
                subdomain = 'z3n';
              }

              $fields.subdomain.val(subdomain.substring(0, 50));
            } else if (enablePersonalEmailSkip && !$fields.name.val().length) {
              // Fill out name if it's a personal email
              // Note: the owner[name] field is already filled out if user is
              // coming from Chat xsell, so check for an existing value first
              var name = (split[0] || '').split('+')[0];
              $fields.name.val(name);
            }

            if (res.companyName) {
              // If there was a match, fill in the company name/size
              // Then skip the company step
              $fields.company.val(res.companyName);
              $fields.size.val(webutils.convertSizeToRange(res.companySize));
              $fields.size.change();
              afterCompany();

              if (lead) webutils.track('Multistep Trial > Step 2');
              skippedCompanyStep = true;
              nextStep = 3;
              next = $('.step.step-' + nextStep);
            } else if (enablePersonalEmailSkip && personalEmail) {
              // If they used a personal email, skip company and personal step
              // Assume a company size of 1-9 and under 4 agents
              if (lead) webutils.track('Multistep Trial > Step 2');
              if (lead) webutils.track('Multistep Trial > Step 3');
              $fields.size.val('1-9');
              $fields.size.change();
              $('select[name="trial_extras[expected_num_seats]"]').val('1-4');
              $('#num-seats-row').hide();
              nextStep = 4;
              next = $('.step.step-' + nextStep);
            }

            transition();
          });
        } else {
          transition();
        }
      }, 210);

      return false;
    };
  };

  // Bind click events for next buttons
  for (var i = 1; i < 4; i++) {
    $('.step-' + i + ' a.next').click(nextHandler(i));
  }

  // form submission;
  var broadcastedEvents;

  function animateAndHideStep($elmt, $hideElmt) {
    $elmt.animate({ 'margin-left': -390, 'opacity': 0 }, 300, function(){
      $hideElmt.hide(); // ie8
    });
  }

  /**
   * A hacky method for positioning the reCAPTCHA privacy policy logo below the
   * Next button and above the legal copy.  Note that the accompanying CSS
   * for `.grecaptcha-badge` prevents the default hover event handler from
   * sliding the badge to the left.
   * The timeout is to ensure we override Google's CSS styles.
   */
  function styleRecaptcha() {
    setTimeout(function() {
      $('.grecaptcha-badge').css({ left: '72px', bottom: '33px' });
    }, 300);
  }

  styleRecaptcha();

  /**
   * Confirms whether a grecaptcha response has been received from Google API
   * and fetches if none has been received yet
   *
   * @return {bool}
   */
  function isRecaptchaValidated() {
    return !!_grecaptchaResponse;
  }

  function regFormSubmitClickHandler() {
    var required, i;

    // Fill out missing company name using the subdomain if they skipped the step
    // Note: the account[name] company name field is already filled out
    // if user is coming from Chat xsell, so check for an existing value first
    if (enablePersonalEmailSkip && personalEmail && !$fields.company.val().length) {
      var companyName = $('input[name="account[subdomain]"]').val();
      $fields.company.val(companyName);
    }

    if ($('.domain-ping').is(':visible')) return;

    required = $('.required');
    for (i = 0;i < required.length; i++) {
      validate($(required[i]));
    }

    if (!isRecaptchaValidated()) {
      _attemptedCaptchaSubmission = true;
      return;
    }

    setTimeout(function() {
      if ($('li.error').length === 0) {
        var switchDelay;

        webutils.pushStateFragment(states[3].title, states[3].fragment);

        $('html, body').animate({ scrollTop: 0 }, 'slow');

        switchDelay = showChecks('.step-4');

        setTimeout(function(){
          var curr = $('.step.step-4'),
              next = $('.step.step-5'),
              path = $('span.path'),
              chicken = $('.chicken-container');

          path.html($('input[name="account[subdomain]"]').val() + '.zendesk.com');

          curr.animate({'margin-left':-390, 'opacity':0 }, 300, function(){
            $(this).hide(); // ie8
          });

          chicken.attr('class', chicken.attr('class').replace(/\s+step\d/, ''));
          chicken.addClass('step5');

          next.css({'opacity':0.5, 'margin-left':250, 'display':'block'})
            .animate({'margin-left':0, 'opacity':1}, 400, 'easeInCirc');

        }, switchDelay);

        $('input[name="trial_extras[features]"]').val($.cookie('features'));

        if (!broadcastedEvents && lead) {
          broadcast();
          broadcastedEvents = true;
        }

        //register account
        webutils.parseCookies();
        register($('form.reg'));
      }
    }, 210);

    return false;
  }

  /**
   * Consolidates all the handlers that are attached to the registration form
   */
  function setupRegFormHandlers() {
    // TODO: add more handlers to this function
    _regSubmitFormHandler = regFormSubmitClickHandler;
    $regFormSubmitBtn.click(regFormSubmitClickHandler);
  }

  setupRegFormHandlers();

  inputDomain
    .bind('keyup', domainTrail)
    .on('focus', function(){
      $('.domain-ping').hide();
    })
    .on('blur', function(){
      if ($(this).val() === '') return;

      var ping = $(this).parent().find('label.suggested');

      $('.domain-ping').show();

      $(this).parent().find('label.error').hide();

      ping
        .html('<span class="info"></span>' + _lang.register.checking)
        .css({
          'display' : 'block',
          'width' : '100%',
          'opacity' : 0,
          'margin-top' : '-48px'
        })
        .animate({
          'opacity' : 1,
          'margin-top' : '-5px'
        }, 300);

      // Subdomains may contain multiple consecutive dashes, but must start with
      // an alphanumeric char. E.g. "a---valid---subdomain". Don't allow
      // punycodes with "xn"
      var scrubbedDomain = $(this).val()
        .replace(SUBDOMAIN_REGEX, '')
        .toLowerCase()
        .replace(/^[\-]*/, '')
        .replace('xn--', '')
        .substring(0, 50);
      domainLookup(webutils.escapeHTML(scrubbedDomain));
    });

  inputCompany.blur(function () {
    var curr = inputDomain;

    // Herb TODO: check the logic here, because I think it always returns
    if (curr.val().length && curr.attr('placeholder') !== curr.val()) return;

    var domain = (webutils.escapeHTML($(this).val()).toLowerCase()
      .replace(SUBDOMAIN_REGEX, '')).replace(' ', '');

    if (domain === '' || domain.length < 3) return;

    var pin = inputDomain.parent().find('label.suggested');
    inputDomain
      .parent()
      .find('label.error')
      .hide();

    _suggested = domain;

    setTimeout(function() {
      inputDomain.val(_suggested);
      domainTrail();
    }, 150);

    pin.css({
      'opacity' : 0,
      'display' : 'block',
      'width' : '100%',
      'margin-bottom' : '-35px'
    })
    .animate({
      'opacity' : 1,
      'margin-bottom' : '-5px'
    }, 300);
  });

  setLang(); // set preferred browser language

  /* Listeners */
  if ($('html.no-pass-type').length > 0) {
    $('.ie-password-label').show().css('text-indent', '0').on('click', function(){
        $(this).hide();
        modal.find('.password').trigger('focus');
      });

      modal.find('.password').on('focus', function(){
        $('.ie-password-label').hide();
      });
  }

  $('select[name="account[help_desk_size]"], select[name="trial_extras[expected_num_seats]"]')
    .hover(function(){
      $(this).parent().find('span.select').addClass('hover');
    }, function(){
      $(this).parent().find('span.select').removeClass('hover');
    })
    .on('focus', function(){
      $(this).parent().find('span.select').addClass('focus');
    })
    .on('blur', function(){
      $(this).parent().find('span.select').removeClass('focus');
    });

    $('select[name="trial_extras[expected_num_seats]"]').change(function(){
      var label = $('select[name="trial_extras[expected_num_seats]"] option:selected').text();
      $('#select-agents')
        .html(webutils.escapeHTML(label) + '<span></span>')
        .addClass('set')
        .parent()
        .attr('class', '');

      validate($(this));
    });

    $('select[name="account[help_desk_size]"]').change(function(){
      $('#select-employees')
        .html(webutils.escapeHTML($(this).val()) + ' ' + _lang.register.employees + '<span></span>')
        .addClass('set')
        .parent()
        .attr('class', '');

      if (window.location.host === 'www.zendesk.com' && $('select[name="account[help_desk_size]"]').val() === '1-9') {
        $('#address\\[phone\\]').attr('placeholder', 'Phone (optional)');
      }

      validate($(this));
    });

    // Set default language val for Safari and IE
    $('#selected-lang a').html($('#language option:selected').text() + '<span></span>');

    $('#language').change(function(){
      $('#selected-lang a').html($(this).find('option:selected').text() + '<span></span>');
    });

    $('#refer').change(function(){
      $('#selected-refer a').html($(this).find('option:selected').text() + '<span></span>');
    });

    $('form.reg')
      .on('keyup', 'input.required', function(){
        if ($(this).attr('data-state') === 'active') {
          _target = $(this);

          window.clearTimeout(_errorTimer);
          _errorTimer = setTimeout(function() {
          validate(_target);
        }, 800);
        }
      })
      .on('focus', 'input.required', function(){
        $(this).addClass('focus');
      })
      .on('blur', 'input.required', function(){
        if ($(this).attr('data-state') != 'active') {
          $(this).attr('data-state', 'active');
        }

        $(this).removeClass('focus');

        validate($(this));
      });

    $('.phone').on('blur', function(){
      if ($(this).val() !== '' && $(this).val() != 'Phone')
        $(this).addClass('set');
      else
        $(this).removeClass('set');
    });

    $('.shadow').on('click', function(){
    $(this).parent().find('input').focus();
  });

  $('input[name="owner[email]"]').bind('keypress', function (event) {
    var key, regex;

    regex  = new RegExp("[a-zA-Z0-9@+._-]");
    key  = String.fromCharCode(!event.charCode ? event.which : event.charCode);

    if (event.charCode != 0 && event.which != 0 && !regex.test(key)) {
      event.preventDefault();

      showError($(this));

      return false;
    }
  });

  $('input[name="account[subdomain]"]').bind('keypress', function (event) {
    var key, regex;

    regex = new RegExp("[a-zA-Z0-9\\-]");
    key  = String.fromCharCode(!event.charCode ? event.which : event.charCode);

    if (event.charCode !== 0 && event.which != 0 && !regex.test(key)) {
      event.preventDefault();

      showError($(this));

      return false;
    }
  });

  _legacyBrowser = ($('#unsupported').length > 0);

  function domainTrail() {
    var shadow = $('.shadow'),
      phantom = $('#phantom'),
      target = $('input[name="account[subdomain]"]');

    if (!target.val().length) return shadow.hide();

    var distance = shadow.css('left');
    phantom.html(webutils.escapeHTML(target.val()));
    var width = webutils.calcTextWidth(phantom) + 20;

    if (distance.length >= 5 && Number(distance.substr(0, 3)) > 240) {
      shadow
        .show()
        .css({'left':width + 'px'})
        .hide();
    } else {
      shadow
        .show()
        .css({'left':width + 'px'});
    }
  }

  /**
   * Logic for handling redirect from the home page trial form, which points
   * directly to the second step.
   */
  var restoreFirstStep = function() {
    $('.step.step-1').show();
    webutils.pushStateFragment(states[0].title, states[0].fragment);
  };

  // Determine whether or not to retrieve account details based on state
  // stored in localStorage, at the key 'postedDetails'. We ignore if it
  // the timestamp held at the key is over 90s old
  var getDetails, posted;

  try {
    if (window.localStorage) {
      posted = parseInt(window.localStorage.getItem('postedDetails'), 10);
      if (posted > new Date().getTime() - 90 * 1000) {
        getDetails = true;
      }

      setTimeout(function() {
        window.localStorage.removeItem('postedDetails');
      }, 4000);
    }
  } catch (e) {
    // Could not get access localStorage
  }

  if (getDetails) {
    // Hide the first step and fire the Ajax request to get details
    // for the first step of the form
    $('.step.step-1').hide();

    $.ajax({
      url: '//www.zendesk.com/app/details.json',
      dataType: 'json',
      type: 'GET',
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      }
    }).done(function(res) {
      if (!res || !res.email || !res.pass) {
        return restoreFirstStep();
      }

      // Add the details, fade in the second step
      $('input[name="owner[email]"]').val(res.email);
      $('input[name="owner[password]"]').val(res.pass);
      webutils.pushStateFragment(states[1].title, states[1].fragment);

      var loadStep = nextHandler(1);
      loadStep();

    }).fail(function(xhr, status, err) {
      // Couldn't retrieve details, return to the first step
      webutils.track('Multistep Trial > Details API request failed', {
        error: JSON.stringify({status: status, error: err})
      });

      restoreFirstStep();
    });
  } else {
    // Wasn't redirected from the home page trial form
    restoreFirstStep();
  }

  /**
   * If on a mobile device, append the ".mobile" class to all
   * label.side-label.
   */
  if (webutils.isMobile()) {
    $('.reg').addClass('mobile');
  }

  $(window).load(function(){
    var visitor = webutils.gauge(), // retrieve json object of visitors activity on the site
        fields = '';

    if (visitor.first_touch_timestamp) { // see if we're getting json we expect
      // append first touch information to form
      fields += '<input type="hidden" name="trial_extras[Touch_' + escapeURL(visitor.first_touch_timestamp) + ']" value="' + escapeURL(visitor.first_landing_page) + '">';
      fields += '<input type="hidden" name="trial_extras[Referrer_' + escapeURL(visitor.first_touch_timestamp) + ']" value="' + escapeURL(visitor.first_referrer) + '">';

      // append last touch information to form if a second session was tracking
      if (visitor.last_landing_page !== 'none') {
        fields += '<input type="hidden" name="trial_extras[Touch_' + escapeURL(visitor.last_touch_timestamp) + ']" value="' + escapeURL(visitor.last_landing_page) + '">';
        fields += '<input type="hidden" name="trial_extras[Referrer_' + escapeURL(visitor.last_touch_timestamp) + ']" value="' + escapeURL(visitor.last_referrer) + '">';
      }

      $('.step-1 form').append(fields);

      // protect against XSS from stored cookie value
      function escapeURL(url) {
        var scrubbed = webutils.escapeHTML(url); // pull any nefarious charachters out of url
        return scrubbed.replace(/utm_/g, '&utm_'); // patch utm syntax since &s were stripped
      }
    }
  });

  try {
    window.addEventListener('popstate', popStateHandler);
  } catch (e) {}

  /**
   * A handler function for the popstate event, to be bound as a listener.
   * The function swaps the current visible step with the previous, or next
   * step.
   *
   * @params (Event) event The event corresponding to the popped state
   */

  /**
   * A handler function for the popstate event, to be bound as a listener.
   * The function swaps the current visible step with the previous, or next
   * step.
   *
   * @params (Event) event The event corresponding to the popped state
   */
  function popStateHandler(event) {
    var i, step, prevStep, curr, next, currProps, nextProps;

    state = event.state;

    // Find current step based on the returned state, which is also
    // the fragment itself
    for (i = 0; i < states.length; i++) {
      if (state === states[i].fragment) {
        step = i + 1;
        break;
      }
    }

    if (!step) return;

    next = $('.step.step-' + step);
    if (skippedCompanyStep && step === 1) {
      prevStep = 3;
    } else if (enablePersonalEmailSkip && personalEmail && step === 1) {
      prevStep = 4;
    } else {
      prevStep = step + 1;
    }
    curr = $('.step.step-' + prevStep);

    // Handle hitting forward
    if (!curr.is(':visible')) {
      if (skippedCompanyStep && step === 3) {
        prevStep = 1;
      } else if (enablePersonalEmailSkip && personalEmail && step === 2) {
        prevStep = 1;
        step = 4;
        next = $('.step.step-' + step);
      } else {
        prevStep = step - 1;
      }
      curr = $('.step.step-' + prevStep);
    }

    $('html, body').animate({ scrollTop: 0 }, 'slow');
    $('.check').css({'opacity':0, 'z-index':-1});

    // Animation direction depends on prevStep value
    if (prevStep < step) {
      currProps = {'margin-right':350, 'opacity':0, 'filter':'alpha(opacity=0)'};
      nextProps = {'opacity':0.5, 'margin-right':-200, 'display':'block'};
    } else {
      currProps = {'margin-left':350, 'opacity':0, 'filter':'alpha(opacity=0)'};
      nextProps = {'opacity':0.5, 'margin-left':-200, 'display':'block'};
    }

    curr.animate(currProps, 350, function(){
      curr.css({'display':'none'});
    });

    next.css(nextProps).animate({'margin-left':0, 'opacity':1}, 300);
  }

  /**
   * Set and display the correct currency based on existing cookies or IP geolcoation
   *
   * @params (Event) event The event corresponding to the popped state
   */
  function setCurrency() {
    var pricingPlans = ['starter', 'regular', 'plus', 'enterprise', 'elite']
      , currSymbol = 'USD'
      , dbaseCountry = ['US', 'UK', 'GB', 'IM', 'GI', 'JE', 'GG', 'AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'EL', 'IE', 'IT', 'LV', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'MC', 'VA', 'SM', 'ME', 'MC', 'LU', 'XK', 'KV', 'GR', 'AD']
      , dbaseCC = 'US'
      , arrayPos = 0
      , countryCurrency = false
      , host = location.hostname.substr(location.hostname.indexOf('.') + 1);

    // force USD for startup promo b/c EUR/GBP coupons not supported
    if (promotion) {
      countryCurrency = 'USD';
    } else {
      // i18n sites w/ specific currencies dont need geoip based selection
      switch (host) {
        case 'zendesk.fr':
          countryCurrency = 'EUR';
          break;
        case 'zendesk.it':
          countryCurrency = 'EUR';
          break;
        case 'zendesk.nl':
          countryCurrency = 'EUR';
          break;
        case 'zendesk.com.mx':
          countryCurrency = 'USD';
          break;
        case 'zendesk.com.br':
          countryCurrency = 'USD';
          break;
        case 'zendesk.co.jp':
          countryCurrency = 'USD';
          break;
        case 'zendesk.de':
          countryCurrency = 'EUR';
          break;
      }
    }

    // pull currency mapping, cookied currency, and geolocation data from demandbase
    $.getJSON('/public/assets/src/js/json-currency.js', function(data){
      if (!countryCurrency || host == 'zendesk.es') {
        if ($.cookie('currency')) {
          countryCurrency = String($.cookie('currency'));
        } else {
          arrayPos = $.inArray(dbase.registry_country_code, dbaseCountry);

          // match country code to supported currency
          if (arrayPos >= 7) { // EUR
            countryCurrency = 'EUR';
          } else if (arrayPos > 0 && arrayPos < 7) { // GBP - UK GB IM GI JE GG
            countryCurrency = 'GBP';
          } else { // USD
            countryCurrency = 'USD';
          }
        }
      }

      // select appropriate currency based on location
      switch (countryCurrency) {
        case 'GBP':
          currSymbol = data[0].GBP;
          break;
        case 'EUR':
          currSymbol = data[0].EUR;
          break;
        default:
          currSymbol = data[0].USD;
          countryCurrency = 'USD';
          break;
      }

      // Display preferred currency
      $('.starter').find('.price .point').html(currSymbol.symbol + '<span>' + currSymbol.annually.starter + '</span>');
      $('.regular').find('.price .point').html(currSymbol.symbol + '<span>' + currSymbol.annually.regular + '</span>');
      $('.plus').find('.price .point').html(currSymbol.symbol + '<span>' + currSymbol.annually.plus + '</span>');
      $('.enterprise').find('.price .point').html(currSymbol.symbol + '<span>' + currSymbol.annually.enterprise + '</span>');
      $('.elite').find('.price .point').html(currSymbol.symbol + '<span>' + currSymbol.annually.elite + '</span>');

      // Set currency in reg form
      $("#account\\[currency\\]").val(countryCurrency);

      // Store in cookie for quicker access later
      $.cookie('currency', countryCurrency, {expires: 730, path: '\/', domain: host});
    });
  }

  /**
   * Performs an AJAX request to retrieve the estimated LTV for a user given
   * their country and company size. The results are stored in the IIFE's rank
   * and country vars.
   */
  function updateLeadData() {
    var size = $fields.size.val();

    $.ajax({
      dataType: 'json',
      cache: false,
      type: 'get',
      url: '//www.zendesk.com/app/leaddata.json',
      data: {size: size}
    }).done(function(value) {
      rank = value.rank;
      country = value.country;
    }).fail(function() {
      console.log('Could not retrieve lead data');
    });
  }

  webutils.trackHomeTest('register');

  setTimeout(storeSubdomains, 0);
  setTimeout(preload, 2000);

  // Initial next button appears disabled until an input is clicked
  function removeDisabledState() {
    $('.step-1 .next').removeClass('btn-disabled');
  }

  $fields.email.one('click', removeDisabledState);
  $fields.password.one('click', removeDisabledState);

  // Highlight Google button if using a domain supporting it
  $fields.email.on('focusout blur input change', debounce(function() {
    var email = $fields.email.val();
    if (email.indexOf('gmail') !== -1 ||
        email.indexOf('google') !== -1 ||
        email.indexOf('outlook') !== -1 ||
        email.indexOf('office') !== -1 ||
        email.indexOf('hotmail') !== -1 ||
        email.indexOf('msn') !== -1 ||
        email.indexOf('zendesk.com') !== -1 ||
        email.indexOf('@') === -1 ||
        email.indexOf('.') === -1) {
      return;
    }

    var hostname = email.split('@')[1];
    if (hostname.indexOf('.') === -1) return;
    if (hostname.split('.')[1].length < 2) return;

    $.ajax({
      dataType: 'json',
      cache: false,
      type: 'get',
      url: '//www.zendesk.com/app/has-google-apps.json',
      data: {hostname: hostname}
    }).done(function(res) {
      if (!res || $('.login-tooltip').length) return;
      webutils.track('Multistep Trial > Google Tooltip');
      var tooltip = $('<span/>', {
        'class': 'login-tooltip google-tooltip',
        text: _lang.register.loginTooltip
      });

      $('.col-left ul li:first-child').append(tooltip);
      tooltip.animate({opacity: 1, top: '65px'}, 500);
    });

    $.ajax({
      dataType: 'json',
      cache: false,
      type: 'get',
      url: '//www.zendesk.com/app/has-office-365.json',
      data: {hostname: hostname}
    }).done(function(res) {
      if (!res || $('.login-tooltip').length) return;
      webutils.track('Multistep Trial > Office 365 Tooltip');
      var tooltip = $('<span/>', {
        'class': 'login-tooltip office-tooltip',
        text: _lang.register.loginTooltip
      });

      $('.col-left ul li:first-child').append(tooltip);
      tooltip.animate({opacity: 1, top: '130px'}, 500);
    });
  }, 50));

  function debounce(func, wait, immediate) {
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
  }

  function populateCrossSellFields() {
    var source = webutils.getURLParameter('source');

    var productSignupSources = ['zendesk_chat', 'zendesk_talk'];

    if (source === 'zopim') {
      // Special case: xsell coming from zopim dashboard.
      $fields.xsellSource.val('zendesk_chat');
    } else if (productSignupSources.indexOf(source) >= 0) {
      // Coming from the marketing page for the target product.
      $fields.productSignUp.val(source);
    }
  }

  populateCrossSellFields();

  $(function(){
    // Set correct currency
    setCurrency();
    window.setTimeout(function(){
      $('.lang-fr .pricing-choice-plan-price, .lang-fr .mo-price, .lang-fr article.reg .plan span.point').each(function(){
        var priceVal = $(this).html();
        if (priceVal.indexOf('€') != -1) {
          var priceValLength = priceVal.length
            , result = priceVal.substr(1) + priceVal.substr(0, 1);
          $(this).html(result);
        }
      });
    }, 1000);
  });
}(jQuery));
