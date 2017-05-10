/**
 * Provides form submission and validation for the contact page
 *
 */


/**
 * Variables for captcha validation and form submission retry logic.
 */
var _attemptedCaptchaSubmission = false,
    _grecaptchaResponse,
    _submitFormHandler;

/**
 * The form submission handler passed to the "data-callback" attribute
 * of Google's ReCAPTCHA
 */
function recaptchaSubmitHandler(token) {
  _grecaptchaResponse = token;

  if (_attemptedCaptchaSubmission && _submitFormHandler) {
    _submitFormHandler();
  }
}

$(document).ready(function() {
  /**
   * The demo form.
   *
   * @type {jQuery}
   */
  var $form = $('.form-contact');

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
    company:   $form.find('input[name="account[name]"]'),
    size:      $form.find('select[name="account[help_desk_size]"]'),
    subject:   $form.find('#subject'),
    firstName: $form.find('#FirstName'),
    lastName:  $form.find('#LastName')
  };

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
  * Google Maps API Interaction
  *
  * @method googleMapBuilder
  * @return void
  */
  function googleMapBuilder() {
    var mapOptions = {
        zoom: 18,
        center: new google.maps.LatLng(37.7816943,-122.4105217)
      }
      , map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions)
      , offices = [
        ['Zendesk HQ', 37.7816943,-122.4105217, 4]
      ];

    setMarkers(map, offices);
  };

  /**
  * Add markers to the map
  *
  * @method setMarkers
  * @param {object} map: google's map object that will have markers added to it
  * @param {array} locations: an array representing the title and coordinates of where to set the marker
  * @return void
  */
  function setMarkers(map, locations) {
    var office = locations[0]
      , myLatLng = new google.maps.LatLng(office[1], office[2])
      , marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        title: 'Zendesk Headquarters'
      });
  };

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
  };

  /**
   * Confirms whether a grecaptcha response has been received from Google API
   * and fetches if none has been received yet
   *
   * @return {bool}
   */
  function isRecaptchaValidated() {
    return !!_grecaptchaResponse;
  }

  /**
  * Register Form Lead through ajax call to contact.php and display success
  * or failure messages, push data to convertro,
  * and push to google analytics
  *
  * @method registerLead
  * @return void
  */
  function registerLead() {
    var required = $form.find('.required');

    for (var i = 0; i < required.length; i++) {
      validateField($(required[i]));
    }

    if (!isRecaptchaValidated()) {
      _attemptedCaptchaSubmission = true;
      return;
    }

    var delay = setTimeout(function(){
      if ($form.find('.error').length === 0) {
        $('.form-contact .loading').css({'display':'table'});
        $('.form-contact ul').animate({ opacity: 0.1 }, 200);

        $.ajax({
          url: '//www.zendesk.com/app/contact',
          data: $form.serialize(),
          type: 'POST',
          complete: function(xhr, textStatus) {
            var msg, icon;

            // show msg overlay ui
            function showMsg(msg,icon){
              setTimeout(function(){
                var loading = $('.form-contact .loading');

                $('.form-contact ul').css('opacity', 0);

                loading
                  .find('.loading-img')
                  .css({'background-image':icon, 'background-repeat':'no-repeat', 'background-position':'50%'})
                  .parent()
                  .find('p')
                  .css({'padding':'20px 20px 0', 'font':'13px/1.35 DNRR'})
                  .html(msg)
                  .parent()
                  .animate({ 'top':11, 'height':240}, 200);
              }, 2000);
            }

            // Run conditional
            if (xhr.responseText === 'success') {
              msg = $form.find('.success').html();
              icon = 'url(//d1eipm3vz40hy0.cloudfront.net/images/signup/icon-checkmark.png)';

              showMsg(msg, icon);
              broadcast(); // fire off tracking pixels
            } else {
              msg = $form.find('.failed').html();
              icon = 'url(//d1eipm3vz40hy0.cloudfront.net/images/error-icon.png)';

              processing = false;
              showMsg(msg, icon);
            }
          }
        });

        webutils.createLead('form.form-contact');
      } else {
        processing = false; // show error messages and enable for submission
      }
    }, 250);
  };

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

      var content = webutils.escapeHTML(target.val()) + '<span class="toggle"></span>';
      target.siblings('.select-label').html(content);
    };

    var subjectHandler = function() {
      var $thisOption = $(this).find("option:selected").val();
      var salesStr = $(this).find("option:nth-child(2)").val();
      var partnershipStr = $(this).find("option:nth-child(5)").val();

      webutils.setMAVs(false); // populate geographic information since they updated the form

      var hideSalesFields = function() {
        if (!$('.input-short').is(':visible')) return;
        $('.input-short').fadeOut();
        $('.input-short select, .input-short input').removeClass('required')
          .parent().removeClass('error');
      };

      var hidePartnershipFields = function() {
        if (!$('.select-partnership').is(':visible')) return;
        $('.select-partnership').fadeOut();
        $('.select-partnership select').removeClass('required')
          .parent().removeClass('error');
      };

      // If it's a sales question, show all fields and make them required
      if ($thisOption == salesStr) {
        $('.input-short').fadeIn();
        $('.input-short select, .input-short input').addClass('required');
        hidePartnershipFields();
      } else if ($thisOption == partnershipStr) {
        $('.select-partnership').fadeIn();
        $('.select-partnership select').addClass('required');
        hideSalesFields();
      } else {
        hidePartnershipFields();
        hideSalesFields();
      }
    };

    var submitHandler = function(){
      if (!processing) {
        registerLead();
      }

      processing = true;
    };
    _submitFormHandler = registerLead;

    $form
      .on('keyup', 'input.required', keyupHandler)
      .on('blur', 'input.required', blurHandler)
      .on('blur', '[name="owner\\[name\\]"]', nameHandler)
      .on('change', 'select', selectHandler)
      .on('change', '#subject', subjectHandler)
      .on('click', '.btn-submit', submitHandler);
  };


  /**
   * Track form submissions
   */
   function broadcast() {
    $CVO.push([ 'trackEvent', { type: 'Contact Us' }]);

    window.optimizely = window.optimizely || [];
    window.optimizely.push(['trackEvent', 'contact_lead']);

    var size = $fields.size.val();

    if (size && size !== '-') {
      webutils.trackMarinContentConversion(size, 'Contact', 'contact_us');

      if (window.dataLayer) {
        dataLayer.push({'event': 'contact_us'});
      }
    }

    ga('send', 'event', 'Lead - Contact', 'Registered');
    ga('send', 'pageview', '/lead/contact');

    webutils.track('Marketing - Lead - Contact Form', {
      subject: $fields.subject.val()
    });
  };

  // add listeners on form fields
  registerFieldHandlers();

  // if not a mobile device, make these available
  if (!_isMobile) {
    googleMapBuilder(); // Initialize google maps API interaction

    $('.g-maps-static').on('click', function(){
      $(this).fadeOut();
    });
  }
});
