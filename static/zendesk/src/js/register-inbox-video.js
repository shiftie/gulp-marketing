/**
 * Global variables, including translation keys and strings.
 *
 * @var {object}
 */
var _target,
    _activity,
    _suggested = '',
    _errorTimer,
    _domainTimer,
    _lang = {
      selected: 'en',
      register: {
        domaintaken: 'URL Already Taken',
        checking: 'Checking domain availability...',
        domaininvalid: 'Enter only letters and numbers',
        emailinvalid: 'Enter a valid email address',
        supportemail: "Please don't use your support address to signup",
        langselect: 'Your Inbox account will be hosted here, in',
        password: 'Enter at least 5 characters',
        passwordchars: 'Password can contain letters, numbers,<br>and any of the following: !@#$^&amp;*()_+.-',
        creationFailed: "Sorry! Something went wrong and we couldn't setup your Inbox account.",
        creationFailedSecondary: "We've notified our support team of the issue.",
        prohibited: 'You appear to be in a Prohibited Jurisdiction under our ' +
          '<a href="https://www.zendesk.com/company/terms-inbox/">Terms of Service</a>. ' +
          'If this is an error, please email legal@zendesk.com.'
      }
    };

(function($) {

  /**
   * Whether or not the visitor is a lead. If false, they're a Zendesk employee
   * This is determined on the second step, after which both their email
   * and company name have been entered.
   *
   * @var {boolean}
   */
  var lead = true;

  /**
   * The form that is the parent of the input fields
   *
   * @var {object}
   */
  var parentForm = '';

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
      if(string === '' || string === holder) {
        if (target.parent().hasClass('error')) return;

        pin.css({
            'display' : 'block',
            'opacity' : ((fade === false) ? 1 : 0),
            'margin-top' : '-51px'
          })
          .animate({
            'opacity' : 1,
            'margin-top' : '-12px'
          }, 300);

        target.removeClass('set');
        target.parent().addClass('error');
      }
    } else {
      if ((type === 'text' && (string === '' || string === holder || !/[一-龠]+|[А-Яа-я]+|[ぁ-ん]+|[ァ-ヴー]+|[a-zA-Z0-9\-]+|[ａ-ｚＡ-Ｚ０-９]+/.test(string))) ||
      (type === 'email' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(string)) ||
      (type === 'select' && target.find('option:selected').val() === '-') ||
      (type === 'password' && string.length < 5)  ||
      (type === 'email' && webutils.isSupportEmail(string))) {
        // Prevent invocation when already displayed
        if (target.parent().hasClass('error')) return;

        // Email field has two possible errors: emailinvalid and supportemail
        var supportFlag, emailLangKey,
            form_height = $(".form-fields-container").height();

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
            'opacity' : ((fade === false) ? 1 : 0),
            'margin-top' : '-51px'
          })
          .animate({
            'opacity' : 1,
            'margin-top' : '-12px'
          }, 300);

        target.removeClass('set');
        target.parent().addClass('error');

          $(".orig-contain").animate({
            "height": form_height + 148
          },
          250);

          $(".form-contain").animate({
            "height": form_height + 246
          },
          250);

          console.log(form_height);

        if(type === 'password') {
          pin.html('<span></span>' + _lang.register.password);
          pin.attr('class','error');
        }

        if(target.attr('placeholder') === 'company.zendesk.com') {
          $('label.suggested').hide();
        }

        if (!supportFlag) {
          // Could track this
        }
      } else {
        pin.animate({
          'opacity' : 0,
          'margin-top' : '-51px'
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

    $.ajax({
      url: '/wp-content/themes/zendesk-twentyeleven/lib/domain-check.php?domain=' + domain,
      type: 'POST',
      data: 'domain=' + domain,
      cache: false,
      success: function(data) {
        if(typeof data.available != 'undefined') {
          if(data.available === 'true') {

            var address = parentForm.find('.subdomain'),
                root = address.val(),
                pin = parentForm.find('label.suggested');

            clearTimeout(_domainTimer);
            address.val(domain);

            if(pin.html().substr(26) === _lang.register.checking || _suggested != root.substr(0, _suggested.length)) {
              pin.animate({
                'opacity' : 0,
                'margin-top' : '-51px'
              }, 200, function(){
                pin.parent().removeClass('error');
              });

              address.addClass('set');
            }

            parentForm.find('.domain-ping').hide();
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

                if(!isNaN(parseFloat(num)) && isFinite(num)) {
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
        setTimeout(function(){
          domainLookup(domain);
        }, 5000);
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
    var name = webutils.escapeHTML(parentForm.find('.name').val())
      , first = 'unknown'
      , last = 'unknown';

    if(name.lastIndexOf(' ') !== -1) {
      first = name.substr(0, name.indexOf(' '));
      last  = name.substr(name.indexOf(' ') + 1);

      if(last.length === 0)
        last = name;
    } else {
      first = name;
    }

    parentForm.find('#FirstName').val(first);
    parentForm.find('#LastName').val(last);
  }

  /**
   * Track and limit account creation retries.
   */
  var registerRetries, maxRegisterRetries;

  registerRetries = 0;
  maxRegisterRetries = 2;

  function register(form) {

    var timeOffset = (new Date()).getTimezoneOffset() / 60 * (-1)
      , domain     = parentForm.find('.subdomain')
      , company    = parentForm.find('.company');

    domain.val(domain.val().replace(/www./g,''));
    domain.val(domain.val().replace(/http:\/\//g,''));
    domain.val(domain.val().replace(/[^\w\-]/g,''));

    // Shows a failure message after the set number of failures
    var showFailure = function(res, prohibited) {
      var reason, span;

      $('a.create-account')
          .find('.loader')
            .hide()
            .end()
          .find('span').html('start your team inbox');

      reason = _lang.register[(prohibited) ? 'prohibited' : 'creationFailed'];
      //creationFailed(res);

      parentForm.siblings('.alert').fadeIn().find('.alert-text').html(reason);

      if (!prohibited) {
        span = $('<span />')
          .addClass('secondary-info')
          .text(_lang.register.creationFailedSecondary);
        parentForm.siblings('.alert').fadeIn().find('.alert-text').append(span);
      }
    };

    var baseRegUrl
      , reqOptions
      , formData;

    baseRegUrl = '/app/v2/accounts.json';

    // account.json uses x-www-form-urlencoded, while accounts_fast.json
    // uses application/json
    reqOptions = {
      url: baseRegUrl,
      data: form.serializeJSON(),
      type: 'POST',
      contentType: 'application/json',
      cache: false
    };

    $.ajax(reqOptions).done(function(res) {
      registerRetries++;

      if (res.success) {
        // Request actually succeeded
        parseResponse(res);
      } else if (res.errors instanceof Array) {
        // Response was 200, but when passed an array of errors, the API
        // is always indicating that the subdomain was taken, so we return
        // them to the first step
        //creationFailed(res);
        parseResponse(res);
      } else if (res.message && res.message.indexOf('Prohibited') !== -1) {
        showFailure(res, true);
      } else if (registerRetries <= maxRegisterRetries) {
        // Can still retry
        register($('form.reg-inbox'));
      } else {
        // A non-subdomain error occurred with a 200 response code
        showFailure(res);
      }
    }).fail(function(xhr, status, err) {
      var error = {error: JSON.stringify({status: status, error: err})};

      registerRetries++;
      if (registerRetries <= maxRegisterRetries) {
        register($('form.reg-inbox'));
      } else {
        // Likely no way to recover if it's failed this many times. The
        // API is probably unavailable
        showFailure();
      }
    });
  }

  function parseResponse(response) {
    var form = $('form.reg-inbox'),
        href = location.href.split('/');

    if (response.success) {
      try {
        webutils.addTrialHomeCookie();
      } catch(e) { }

      // Old and new endpoints use different properties for redirects
      var verification;

      if (response.owner_verification_link) {
        verification = response.owner_verification_link;
      } else {
        verification = response.right_away_link
      }

      setTimeout(function(){
        window.location = verification;
      }, 2000); // Small buffer to make sure tracking pixels have fired
    } else {
      $.each(response.errors, function (index, value) {
        var ident  = ['subdomain', 'company', 'name', 'email', 'password'],
            len    = ident.length;

        if(value.toLowerCase().indexOf('jurisdiction') === -1) {
          for(var i = 0; i < len; i++) {
            if(value.toLowerCase().indexOf(ident[i]) === 0) {
              if(ident[i] === 'subdomain') {
                $('label.suggested').hide();

                if(value.indexOf('3') != -1) {
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
   * Lead event triggers and syncing for Optimizely and behavioral
   * cookies.
   */
  function broadcast(formTarget) {
    // Ignore employees
    if (!lead) return;

    webutils.createLead(formTarget);

    if(typeof dataLayer !== 'undefined') {
      dataLayer.push({'event': 'inbox_complete'});
    }

    webutils.trackMarinContentConversion('1-9', 'Inbox', 'inbox_signup');
    webutils.track('Inbox Converted');
    formTarget.find('#created').val('true');
  }

  var inputCompany = $('.reg-inbox .company'),
      inputDomain  = $('.reg-inbox .subdomain'),
      inputFullName = $('.reg-inbox .name'),
      inputEmail = $('.reg-inbox .email'),
      modal = $('form.reg-inbox');

  // form submission;
  var broadcastedEvents;

  $('.alert .close').on('click', function() {
    $(this).parent('.alert').fadeOut();
  });

  $('a.create-account').click(function(){
    var required, i;

    parentForm = $(this).parents('form');

    if (parentForm.find('.domain-ping').is(':visible')) return;

    required = parentForm.find('.required');
    for (i = 0;i < required.length; i++) {
      validate($(required[i]));
    }

    setTimeout(function() {
      if(parentForm.find('li.error').length === 0) {
        webutils.parseCookies();

        formatName();

        $('a.create-account')
          .find('.loader')
            .show()
            .end()
          .find('span').html('creating your inbox');

        parentForm.find('input[name="trial_extras[features]"]').val($.cookie('features'));

        if (!broadcastedEvents && lead) {
          broadcast(parentForm);
          broadcastedEvents = true;
        }

        register(parentForm);
      }
    }, 210);

    return false;
  });

  $('.reg-inbox input').on('change', function(){
    parentForm = $(this).parents('form');
  });

  inputDomain
    .on('keyup', function(){ parentForm = $(this).parents('form'); } )
    .on('focus', function(){
      $('.domain-ping').hide();
    })
    .on('blur', function(){
      if ($(this).val() === '') return;

      var ping = $(this).siblings('label.suggested');

      $(this).siblings('.domain-ping').show();

      $(this).siblings('label.error').hide();

      ping
        .html('<span class="info"></span>' + _lang.register.checking)
        .css({
          'display' : 'block',
          'opacity' : 0,
          'margin-top' : '-51px'
        })
        .animate({
          'opacity' : 1,
          'margin-top' : '-12px'
        }, 300);

      // Subdomains may contain multiple consecutive dashes, but must start with
      // an alphanumeric char. E.g. "a---valid---subdomain".
      var scrubbedDomain = $(this).val().toLowerCase()
        .replace(/[^a-z0-9\-]/g, '').replace(/^[\-]*/, '');
      domainLookup(webutils.escapeHTML(scrubbedDomain));
    });

  inputCompany.blur(function () {
    webutils.setMAVs(false); // pull the geographic location details in background

    var curr = parentForm.find('.subdomain');

    if (curr.val().length && curr.attr('placeholder') !== curr.val()) return;

    var domain = (webutils.escapeHTML($(this).val()).toLowerCase()
      .replace(/[^a-zA-Z0-9\-]/g,'')).replace(' ', '');

    if (domain === '' || domain.length < 3) return;

    var pin = curr.siblings('label.suggested');
    curr
      .siblings('label.error')
      .hide();

    _suggested = domain;

    setTimeout(function() {
      curr.val(_suggested);
    }, 150);

    pin.css({
      'opacity' : 0,
      'display' : 'block',
      'margin-top' : '-51px',
      'margin-bottom' : '-35px'
    })
    .animate({
      'opacity' : 1,
      'margin-top' : '-12px',
      'margin-bottom' : '10px'
    }, 300);
  });

  /* Listeners */
  if($('html.no-pass-type').length > 0) {
    $('.ie-password-label').show().css('text-indent','0').on('click', function(){
        $(this).hide();
        modal.find('.password').trigger('focus');
      });

      modal.find('.password').on('focus', function(){
        $('.ie-password-label').hide();
      });
  }
    $('select[name="trial_extras[Partner_ID__c]"]').change(function(){
      $('#select-agents')
        .html(webutils.escapeHTML($(this).val()) + ' ' + 'people support our customers<span></span>')
        .addClass('set')
        .parent()
        .attr('class','');

      validate($(this));
    });

    $('form.reg-inbox')
      .on('keyup', 'input.required', function(){
        if($(this).attr('data-state') === 'active') {
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
        if($(this).attr('data-state') != 'active') {
          $(this).attr('data-state', 'active');
        }

        $(this).removeClass('focus');

        validate($(this));
      });

  $('.reg-inbox .email').bind('keypress', function (event) {
    var key, regex;

    regex  = new RegExp("[a-zA-Z0-9@+._-]");
    key  = String.fromCharCode(!event.charCode ? event.which : event.charCode);

    if (event.charCode != 0 && event.which != 0 && !regex.test(key)) {
      event.preventDefault();

      showError($(this));

      return false;
    }
  });

  $('.reg-inbox .subdomain').bind('keypress', function (event) {
    var key, regex;

    regex = new RegExp("[a-zA-Z0-9\\-]");
    key  = String.fromCharCode(!event.charCode ? event.which : event.charCode);

    if (event.charCode !== 0 && event.which != 0 && !regex.test(key)) {
      event.preventDefault();

      showError($(this));

      return false;
    }
  });

  /**
   * If on a mobile device, append the ".mobile" class to all
   * label.side-label.
   */
  if (webutils.isMobile()) {
    $('.reg').addClass('mobile');
  }

  setTimeout(storeSubdomains, 0);

}(jQuery));
