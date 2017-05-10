/**
 * Homepage trial form code. Global language strings are defined outside
 * of the IIFE.
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

(function() {
  var form, emailField, passwordField, submitHandler, errorTimeout;

  form = $('form.reg');
  if (!form.length) return;

  emailField = form.find('input[name="owner[email]"]');
  passwordField = form.find('input[name="owner[password]"]');

  /**
   * Listener to be used on form submission. Validates the form fields, and
   * on success, submits the details via AJAX prior to redirecting the user
   * to the form.
   */
  submitHandler = function(event) {
    var required, i, redirect, redirectUrls;

    event.preventDefault();

    required = $('form#register .required');
    for (i = 0; i < required.length; i++) {
      validate($(required[i]));
    }

    redirectUrls = {
      success: '/register/',
      error: '/register/free-trial/'
    };

    redirect = function() {
      var data, postData, retries, maxRetries;

      data = JSON.stringify({
        email: emailField.val(),
        pass: passwordField.val()
      });

      webutils.track('Home Reg > Details API Request');

      retries = 0;
      maxRetries = 2;

      postData = function() {
        $.ajax({
          url: '/app/details.json',
          contentType: 'application/json',
          data: data,
          type: 'POST'
        }).done(function() {
          if (!document.cookie.length) {
            // Immediately redirect if cookies are disabled
            webutils.redirect(redirectUrls.error);
            return;
          }

          // Add a timestamp in localStorage identifying that we've POSTed
          // to details.json. The timestamp, versus a flag, allows us to
          // ignore old values
          try {
            if (window.localStorage) {
              window.localStorage.setItem('postedDetails', new Date().getTime());
            }
          } catch (e) {
            // Could not write to localStorage
          }

          webutils.redirect(redirectUrls.success);
        }).fail(function(xhr, status, err) {
          // Retry a max of 2 times
          retries++;
          if (retries <= maxRetries) {
            return postData();
          }

          webutils.track('Home Reg > Details API Request Failed', {
            error: JSON.stringify({status: status, error: err})
          });

          // Slight delay to allow tracking events to async fire
          setTimeout(function() {
            webutils.redirect(redirectUrls.error);
          }, 1000);
        });
      };

      postData();
    };

    setTimeout(function() {
      if ($('form#register li.error').length) return;

      // Form inputs are valid
      $('html, body').animate({ scrollTop: 0 }, 'slow');
      var switchDelay = showChecks('form#register');

      setTimeout(redirect, switchDelay);
    }, 210);

    return false;
  };

  /**
   * Validate the email and password form elements, showing and hiding
   * the error labels as necessary.
   *
   * @params (target:dom element) form element to validate
   */
  function validate(target) {
    var string = target.val(),
      type   = target.attr('type'),
      pin    = target.parent().find('label.error'),
      fade   = (pin.css('opacity') === '1') ? false : true;

    if ((type === 'email' && !webutils.isValidEmail(string)) ||
        (type === 'password' && string.length < 5)  ||
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
      }).animate({
        'opacity' : 1,
        'margin-top' : '-5px'
      }, 300);

      target.removeClass('set');
      target.parent().addClass('error');

      if (type === 'password') {
        pin.html('<span></span>' + _lang.register.password);
        pin.attr('class','error');
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

    window.clearTimeout(errorTimeout);
    errorTimeout = setTimeout(function() {
      validate(target);
    }, 900);
  }

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
  function showChecks(step) {
    var checks, delay, i;

    // Only look at checks for visible inputs
    checks = $(step + ' li:visible .check');
    delay = 150;

    for (i = 0; i < checks.length; i++) {
      $(checks[i])
        .delay(delay*i)
        .css({'top':40, 'z-index':2})
        .animate({'opacity':1, 'top':31}, 100);

      delay += 100;
    }

    // Calculate the final delay generated by the loop below
    return (100 * (checks.length - 1) + 150) * checks.length;
  }

  /**
   * Registers all necessary listeners for the inputs as well as
   * "GET STARTED" button.
   */
  $('form#register a.next').click(submitHandler);

  $('form.reg')
  .on('keyup', 'input.required', function() {
    var target = $(this);
    if (target.attr('data-state') !== 'active') return;

    window.clearTimeout(errorTimeout);
    errorTimeout = setTimeout(function() {
      validate(target);
    }, 800);
  })
  .on('focus', 'input.required', function(){
    $(this).addClass('focus');
  })
  .on('blur', 'input.required', function(){
    var target = $(this);
    if (target.attr('data-state') != 'active') {
      target.attr('data-state', 'active');
    }

    target.removeClass('focus');
    validate(target);
  });

  $('input[name="owner[email]"]').bind('keypress', function (event) {
    var key, regex;

    regex = new RegExp("[a-zA-Z0-9@+._-]");
    key = String.fromCharCode(!event.charCode ? event.which : event.charCode);

    if (!event.charCode || !event.which || regex.test(key)) return;

    event.preventDefault();
    showError($(this));
    return false;
  });
}());
