$(document).ready(function() {
  /**
   * The demo form.
   *
   * @type {jQuery}
   */
  var $form = $('#demo-request');

  /**
   * Mapping of steps to their corresponding jQuery elements.
   *
   * @type {Object}
   */
  var $steps = {
    personal: $form.find('.step-1'),
    company:  $form.find('.step-2'),
    webinars: $form.find('.step-3')
  };

  /**
   * Default value for first and last name.
   *
   * @type {String}
   */
  var DEFAULT_NAME = 'unknown';

  /**
   * A mapping of profile field names to their inputs.
   *
   * @var {Object}
   */
  var $fields = {
    name:      $form.find('input[name="owner[name]"]'),
    email:     $form.find('input[name="owner[email]"]'),
    phone:     $form.find('input[name="address[phone]"]'),
    company:   $form.find('input[name="account[name]"]'),
    size:      $form.find('select[name="account[help_desk_size]"]'),
    firstName: $form.find('#FirstName'),
    lastName:  $form.find('#LastName'),
    mailing:   $form.find('#MailingCountry')
  };

  /**
   * Latest email used in fetching clearbit data. Can be compared to avoid
   * race conditions if the email field was changed just prior to submission.
   *
   * @type {String}
   */
  var emailUsed = '';

  /**
   * Whether or not a form event handler has been triggered and is currently
   * completing an animation/transition, ajax request, or some other operation
   * that should not be interrupted by UI interaction. Helps prevent collisions
   * and race conditions.
   *
   * @type {Boolean}
   */
  var processing = false;

  /**
   * Demo form setup.
   */
  webutils.setMAVs(false);
  registerClearbitHandler();
  registerFieldHandlers();
  registerSubmitHandler();
  registerWebinarClickHandler();

  /**
   * Registers a listener for changes to the email field, fetching clearbit
   * data and populating the remaining fields if available.
   */
  function registerClearbitHandler() {
    $fields.email.on('focusout blur change', webutils.debounce(function() {
      if (!validateField($fields.email)) return;
      populateClearbitFields(function(err) {
        emailUsed = $fields.email.val();
      });
    }));
  }

  /**
   * Populates the company name and size fields using the supplied email.
   * We don't propogate any error to the callback, since form behavior
   * should not be blocked on the request's failure.
   *
   * @param {Function} fn
   */
  function populateClearbitFields(fn) {
    fetchClearbitData($fields.email.val(), function(err, res) {
      if (err || !res.companyName) return fn();

      $fields.company.val(res.companyName);
      $fields.size.val(webutils.convertSizeToRange(res.companySize));
      $fields.size.change();
      fn();
    });
  }

  /**
   * Fetches clearbit data using the provided email.
   *
   * @param  {String}   email
   * @param  {Function} fn
   */
  function fetchClearbitData(email, fn) {
    $.ajax({
      url: '//www.zendesk.com/app/emailinfo.json?email=' + email,
      dataType: 'json',
      timeout: 2000
    }).done(function(data) {
      fn(null, data);
    }).fail(function() {
      return fn(new Error('Could not retrieve emailinfo'));
    });
  }

  /**
   * Registers handlers for all inputs, which includes basically validation,
   * error handling, and select formatting.
   */
  function registerFieldHandlers() {
    var timeout;

    var keyupHandler = function () {
      var target = $(this);
      if (target.attr('data-state') !== 'active') return;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        validateField(target);
      }, 800);
    };

    var blurHandler = function() {
      var target = $(this);
      target.attr('data-state', 'active');
      validateField(target);
    };

    var nameHandler = function() {
      var name = webutils.escapeHTML($(this).val()) || '';
      var split = webutils.splitName(name);
      $fields.firstName.val(split[0] || DEFAULT_NAME);
      $fields.lastName.val(split[1] || DEFAULT_NAME);
    };

    var selectHandler = function() {
      var target = $(this);
      target.attr('data-state', 'active');
      validateField(target);
      var content = webutils.escapeHTML(target.val()) +
        '<span class="toggle"></span>';
      target.siblings('.select-label').html(content);
    };

    $form
      .on('keyup', 'input.required', keyupHandler)
      .on('blur', 'input.required', blurHandler)
      .on('change', '[name="owner\\[name\\]"]', nameHandler)
      .on('change', 'select', selectHandler);
  }

  /**
   * Registers handlers for submission of the first two steps
   * of the form.
   */
  function registerSubmitHandler() {
    var handler = function(e) {
      e.preventDefault();

      var $step = getCurrentStep();
      var valid = allFieldsValid($step);

      if (!valid || processing) return;

      if ($fields.email.val() !== emailUsed) {
        // Email has been modified since the last clearbit fetch
        return populateClearbitFields(function() {
          handler(e);
        });
      }

      processing = true;

      if ($fields.company.val()) {
        // Had a clearbit match, or finished company step
        showTimeSelection();
      } else {
        // No clearbit match
        showCompanyStep();
      }
    };

    $form.on('submit', handler);
  }

  /**
   * Displays the company step.
   */
  function showCompanyStep() {
    transitionSteps(getCurrentStep(), $steps.company, function() {
      processing = false;
    });
  }

  /**
   * Attempts to display the webinar selection, otherwise shows a success
   * message.
   */
  function showTimeSelection() {
    showLoadingSpinner();
    if (canPickWebinar()) loadWebinars();

    registerLead($form, function(err) {
      hideLoadingSpinner();
      processing = false;
      if (err) {
        showError();
      } else if (canPickWebinar()) {
        transitionSteps(getCurrentStep(), $steps.webinars);
      } else {
        showSuccess();
      }
    });
  }

  /**
   * Validates all fields in the provided step, returning whether or not
   * they're all valid.
   *
   * @param   {jQuery}  $step
   * @returns {boolean}
   */
  function allFieldsValid($step) {
    return $step.find('.required').toArray().map(function(ele) {
      return validateField($(ele));
    }).every(function(ele) {
      return ele;
    });
  }

  /**
   * Hides the current step and animates the reveal of the next step.
   *
   * @param {jQuery}   curr
   * @param {jQuery}   next
   * @param {function} fn
   */
  function transitionSteps(curr, next, fn) {
    if (webutils.isMobile()) {
      $(window).scrollTop(0);
    }

    curr.css({'opacity': 1}).animate({'opacity': 0}, 200, function() {
      curr.hide();
      next.css({'opacity': 0.5, 'display': 'block'})
          .animate({'opacity': 1}, 400, fn);
    });
  }

  /**
   * Displays a loading spinner.
   */
  function showLoadingSpinner() {
    $('.demo-loading')
      .css({'display': 'block', 'opacity': 0.1})
      .animate({'opacity' : 1}, 300);
  }

  /**
   * Hides the loading spinner.
   */
  function hideLoadingSpinner() {
    $('.demo-loading').css({'display': 'none'});
  }

  /**
   * Returns the current step element.
   *
   * @return {jQuery}
   */
  function getCurrentStep() {
    return $('.step:visible');
  }

  /**
   * Display a success message on form completion.
   */
  function showSuccess() {
    transitionSteps(getCurrentStep(), $('.demo-success'));
  }

  /**
   * Display an error message in case of failure.
   */
  function showError() {
    transitionSteps(getCurrentStep(), $('.demo-error'));
  }

  /**
   * Validates the target field, showing the necessary error labels,
   * and returning whether or not the field was valid.
   *
   * @param  {jQuery}  target
   * @return {Boolean}
   */
  function validateField(target) {
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

    return valid;
  }

  /**
   * Returns whether or not the user can pick the webinar time themselves,
   * or if they need to be routed through SDRs. Only true for AMER with
   * size < 100. All other regions will simply be shown a success message.
   *
   * @returns {Boolean}
   */
  function canPickWebinar() {
    // Region is populated by setMAVs
    var region = $('input#trial_extras\\[Region__c\\]').val();
    var size = parseInt($fields.size.val(), 10);
    return (region === 'AMER' && size < 100);
  }

  /**
   * Registers the lead and fires all other tracking events.
   *
   * @param {jQuery}   form
   * @param {function} fn
   */
  function registerLead(form, fn) {
    webutils.createLead(form, fn);
    webutils.track('Marketing - Lead - Demo Request');

    if (window.dataLayer) {
      dataLayer.push({'event': 'demo_submit'});
    }

    var size = $fields.size.val();
    if (size && size !== '-') {
      webutils.trackMarinContentConversion(size, 'Demo', 'demo_request');
    }

    window.$CVO = window.$CVO || [];
    $CVO.push([ 'trackEvent', { type: 'Demo Request' }]);

    ga('send', 'event', 'Lead - Demo Request', 'Registered');
    ga('send', 'pageview', '/lead/demo');

    window.optimizely = window.optimizely || [];
    window.optimizely.push(['trackEvent', 'demo_lead']);
  }

  /**
   * Retrieves and displays available webinars.
   */
  function loadWebinars() {
    $.get('//www.zendesk.com/app/webinar/list')
      .done(function(body) {
        var content = body.map(getWebinarButton);
        var $webinars = $('.available-webinars');
        $webinars.html(content);
        webutils.track('Demo - Lead - Gotowebinar - List shown');
      })
      .fail(function () {
        showError();
        webutils.track('Demo - Lead - Gotowebinar - List failed');
      });
  }

  /**
   * Accepts an object representing a single webinar, and returns the HTML
   * source for rendering the corresponding button. Tries to render the
   * datetimes following this example: Wed De 09 11:00 PST. However, it
   * may vary by locale.
   *
   * @param   {object} webinar
   * @returns {string}
   */
  function getWebinarButton(webinar) {
    var datetime = new Date(webinar.times[0].startTime).toString();
    var timezone = datetime.match(/\(([A-Za-z\s].*)\)/)[1];
    var date = datetime.split(':00 GMT')[0].replace(/ \d{4}/, '');
    var formatted = date + ' ' + timezone;

    return '<a data-webinarId="' +
            webinar.webinarID + '" data-webinarKey="' +
            webinar.webinarKey + '" href="#" class="cta btn-gray">' +
            formatted + '</a>';
  }

  /**
   * Registers the click handler for the webinar buttons. This includes
   * logic for subscribing to individual webinars.
   */
  function registerWebinarClickHandler() {
    $('.available-webinars').on('click', 'a', function(evt) {
      evt.preventDefault();
      evt.stopPropagation();

      if (processing) return;
      processing = true;
      showLoadingSpinner();

      var key = evt.target.getAttribute('data-webinarKey');
      var date = evt.target.innerHTML;
      var body = {};

      $form.serializeArray().forEach(function(item) {
        body[item.name] = item.value;
      });

      $.post('//www.zendesk.com/app/webinar/subscribe', {
        webinarKey: key,
        body: body
      }).done(function () {
        hideLoadingSpinner();
        showSuccess();
        webutils.track('Demo - Lead - Gotowebinar - Subscribed');
      }).fail(function () {
        hideLoadingSpinner();
        showError();
        webutils.track('Demo - Lead - Gotowebinar - Subscription Failed');
      }).always(function() {
        processing = false;
      });
    });
  }
});
