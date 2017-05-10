/**
* @author  Herbert Siojo
* @since   12/08/16
*/

window.loginStrings = {
  /*<sl:translate_html>*/
  checkingRecords: "Thanks! We're checking our records and if you have an account you should receive an email within a few minutes.",
  errorTryAgain: "Whoops. An error occurred. Try again later?"
  /*</sl:translate_html>*/
};

$(document).ready(function() {
  /**
   * Tracks the state of the login form to manage the history API.
   *
   * @type {String}
   */
  var loginFormState = null;

  /**
   * Mapping of login form transition states to strings.
   *
   * @type {Object}
   */
  var LOGIN_FORM_HISTORY = {
    INITIAL: null,
    SUPPORT: 'support',
    REMINDER: 'loginReminder',
    previous: function(state) {
      var index = LOGIN_FORM_STATES.indexOf(state) - 1;
      return LOGIN_FORM_STATES[index];
    },
    next: function(state) {
      var index = LOGIN_FORM_STATES.indexOf(state) + 1;
      return LOGIN_FORM_STATES[index];
    }
  };

  var LOGIN_FORM_STATES = [LOGIN_FORM_HISTORY.INITIAL, LOGIN_FORM_HISTORY.SUPPORT, LOGIN_FORM_HISTORY.REMINDER];

  /**
   * The duration of slide & fade transitions for the Support login forms.
   *
   * @type {String}
   */
  var ANIMATION_DURATION = '0.4s';

  /**
   * The "Don't remember your company's url?" link under the Login button
   * of the Zendesk Support login form
   *
   * @type {jQuery}
   */
  var $reminderLink = $(".reminder-link");

  /**
   * The Zendesk Support login form containing the subdomain input field
   *
   * @type {jQuery}
   */
  var $loginForm = $('.login-form');

  /**
   * The login reminder form containing an email address input, for when
   * the user has forgotten their subdomain
   *
   * @type {jQuery}
   */
  var $loginReminderForm = $('.login-remind');

  /**
   * The div containing the two login buttons, Support and Chat
   *
   * @type {jQuery}
   */
  var $loginOptions = $('.login-options');

  /**
   * The subdomain input field of the Support login form
   *
   * @type {jQuery}
   */
  var $subdomainInput = $("#customerUrl");

  /**
   * The Login button of the Support login form
   *
   * @type {jQuery}
   */
  var $supportLoginBtn = $('#support-login');

  /**
   * The button for the Zendesk Support login option
   *
   * @type {jQuery}
   */
  var $supportButton = $('#support-button');

  /**
   * The error label that appears if a user inputs an empty subdomain in the
   * subdomain input field.
   *
   * @type {jQuery}
   */
  var $loginErrorLabel = $('.form-login').find('label');


  /**
   * The reminder form for users who've forgotten their subdomain.
   *
   * @type {jQuery}
   */
  var $reminderForm = $('.form-remind');

  /**
    * A mapping of reminder form fields;
    *
    * @var {Object}
   */
  var $reminderFormFields = {
    input: $reminderForm.find('input'),
    error: $reminderForm.find('label'),
    submit: $reminderForm.find('a.cta')
  };

  /**
   * The Remind Me button in the reminder form.
   *
   * @type {jQuery}
   */
  var $remindMeButton = $('#send-reminder');

  /**
   * The div that contains the checkmark and results of Remind Me GET request.
   *
   * @type {jQuery}
   */
  var $remindResultDiv = $('.remind-me-result');

  /**
   * The p tag with the result text of the Remind Me GET request.
   *
   * @type {jQuery}
   */
  var $remindResultParagraph = $remindResultDiv.find('p.result');

  /**
   * The "New to Zendesk?" link in the reminder form. Needs to be hidden
   * after submitting the reminder form.
   *
   * @type {jQuery}
   */
  var $newToZendeskLink = $('.login-remind a.login-opt');

  /**
   * The footer tag of the page.
   *
   * @type {jQuery}
   */
  var $footer = $("footer");

  /**
   * Hides the $hideEl by setting the opacity to 0, then slides in the $slideEL
   * by adding a CSS class with a transition animation
   *
   * @param {jQuery} $hideEl
   * @param {jQuery} $slideEl
   */
  function hideAndSlideIn($hideEl, $slideEl) {
    // Return early if the elements have already been moved
    if ($hideEl.css('opacity') === '0' && $slideEl.css('opacity') === '1') {
      return;
    }

    $hideEl.css({ opacity: 0, transition: 'opacity ' + ANIMATION_DURATION });

    $slideEl.css({
      visibility: 'visible',
      transition: 'margin-left ' + ANIMATION_DURATION + ' ease-in-out',
      'margin-left': 0,
      opacity: 1
    });
  }

  /**
   * Reveals the $revealEl by setting the opacity to 1, then slides out
   * the $slideEL by adding a CSS class with a transition animation
   *
   * @param {jQuery} $revealEl
   * @param {jQuery} $slideEl
   */
  function revealAndSlideOut($revealEl, $slideEl) {
    if ($revealEl.css('opacity') === '1' && $slideEl.css('opacity') === '0') {
      return;
    }

    $revealEl.css({ opacity: 1, transition: 'opacity ' + ANIMATION_DURATION });

    $slideEl.css({
      transition: 'margin-left ' + ANIMATION_DURATION +
        ' ease-in-out, opacity ' + ANIMATION_DURATION,
      'margin-left': '490px',
      opacity: 0
    }).on('transitionend', function() {
      $slideEl.css({ visibility: 'hidden' });
      $slideEl.off('transitionend');
    });
  }

  /**
   * Pushes state to history API, with an object containing a "form" key
   * with value equal to the formName parameter.
   * formName should be the current form visible.
   *
   * @param {string} formName
   */
  function pushHistoryState(formName) {
    if (history.state && history.state.form === formName) {
      return;
    }
    var state = { form: formName };
    if (history.state) {
      state.previous = history.state.form;
    }
    var url = '//' + location.host + location.pathname + location.search + '#' + formName;
    history.pushState(state, '', url);
    loginFormState = formName;
  }

  /**
   * Advances the history to the next state based on the input current state,
   * and updates the loginFormState variable.
   *
   * @param {string} state - The login form state
   * @returns {string} nextState - The next login form state
   */
  function advanceHistoryState(state) {
    var index = LOGIN_FORM_STATES.indexOf(state);
    if (index === -1 || index === LOGIN_FORM_STATES.length - 1) {
      return;
    }
    var nextState = LOGIN_FORM_STATES[index + 1];
    pushHistoryState(nextState);
    return nextState;
  }

  /**
   * Restores state of the login form based on current state of the history API
   * or based on an existing URL fragment.
   * Relevant when a user clicks on "New to Zendesk?" and navigates back, or
   * when a user navigates directly to a URL with a fragment, e.g.
   * www.zendesk.com/login/#support
   */
  function restoreHistoryState() {
    var restoreState;
    var shouldPushState = false;
    if (!history.state) {
      var fragments = webutils.parseFragment();
      restoreState = Object.keys(fragments).pop();
      shouldPushState = true;
    } else {
      restoreState = history.state.form;
    }

    var stateNum = LOGIN_FORM_STATES.indexOf(restoreState);
    if (!restoreState || stateNum === -1) {
      return;
    }

    for (var i = 0; i < stateNum; i++) {
      var currentState = LOGIN_FORM_STATES[i];
      if (currentState === LOGIN_FORM_HISTORY.INITIAL) {
        hideAndSlideIn($loginOptions, $loginForm);
      } else if (currentState === LOGIN_FORM_HISTORY.SUPPORT) {
        hideAndSlideIn($loginForm, $loginReminderForm);
      }
      if (shouldPushState) {
        loginFormState = advanceHistoryState(loginFormState);
      }
    }
  }

  /**
   * Registers a handler for clicks on the $reminderLink, toggling visibility
   * of the email login reminder form and hiding the subdomain login form.
   * Also pushes state to history API.
   */
  function registerReminderLinkClickHandler() {
    $reminderLink.click(function(e) {
      e.preventDefault();
      loginFormState = advanceHistoryState(loginFormState);
      hideAndSlideIn($loginForm, $loginReminderForm);
    });
  }

  /**
   * Registers a keypress handler on the subdomain input, submitting the
   * form if user presses enter
   */
  function registerSubdomainKeypressHandler() {
    $subdomainInput.keypress(function(e) {
      if (e.which === 13) {
        e.preventDefault();
        $supportLoginBtn.click();
      }
    });
  }

  /**
   * Registers a change handler on the subdomain input that adjusts the href
   * of the login button link
   */
  function registerSubdomainInputChangeHandler() {
    $subdomainInput.change(function() {
      var newUrl = $subdomainInput.val();
      $supportLoginBtn.find('a').attr("href", "https://" + newUrl + ".zendesk.com/agent");
    });
  }

  /**
   * The click handler for the Zendesk Support login option, which
   * animates the login form in and pushes state to the history API
   */
  function supportClickHandler(event) {
    event.preventDefault();
    loginFormState = advanceHistoryState(loginFormState);
    hideAndSlideIn($loginOptions, $loginForm);
  }

  /**
   * Registers the above click handler for the Zendesk Support login option
   */
  function registerSupportClickHandler() {
    $supportButton.click(supportClickHandler);
  }

  /**
   * Deregisters the above click handler for the Zendesk Support login option
   * when the user has an existing subdomain stored in cross-storage.
   * Note: that we have to specifically remove supportClickHandler and not all
   * click handlers, otherwise the handler added by webutils.showCTA will
   * also be removed.
   */
  function deregisterSupportClickHandler() {
    $supportButton.off('click', supportClickHandler);
  }

  /**
   * Registers an onpopstate handler for managing browser history and login form
   * transitions triggered by both back & forward buttons.
   * Also removes the url fragment for the case when the user
   * navigates directly to a URL with a fragment (e.g. /login/#loginReminder)
   * and presses back and reaches the initial login form state.
   */
  function registerHistoryHandlers() {
    window.onpopstate = function(event) {
      if (!event.state) {
        revealAndSlideOut($loginOptions, $loginForm);
        loginFormState = null;
        // Remove the original url fragment
        if (window.location.href.indexOf('#') !== -1) {
          history.replaceState(null, '', ' ');
        }
      } else {
        var newState = event.state.form;
        var previousState = loginFormState;
        if (newState === LOGIN_FORM_HISTORY.SUPPORT) {
          if (previousState === LOGIN_FORM_HISTORY.previous(newState)) {
            hideAndSlideIn($loginOptions, $loginForm);
          }
          else if (previousState === LOGIN_FORM_HISTORY.next(newState)) {
            revealAndSlideOut($loginForm, $loginReminderForm);
          }
        } else if (newState === LOGIN_FORM_HISTORY.REMINDER) {
          hideAndSlideIn($loginForm, $loginReminderForm);
        }
        loginFormState = event.state.form;
      }
    };
  }

  /**
   * Animates an error label into view by modifying
   * the label's opacity and margin-left attributes
   *
   * @param {jQuery} $label
   */
  function animateErrorLabel($label) {
    $label
      .css('margin-left', 20)
      .addClass("error")
      .animate({ opacity: 1, 'margin-left': 0}, 200);
  }

  /**
   * Registers the login button click handler, which presents an error
   * if the user-inputted subdomain is empty; otherwise, updates window
   * location to go to the Support instance
   */
  function registerLoginButtonClickHandler() {
    $supportLoginBtn.click(function(e) {
      e.preventDefault();
      var subdomain = $subdomainInput.val();
      if (!subdomain || !subdomain.length) {
        animateErrorLabel($loginErrorLabel);
        return false;
      } else {
        window.location = "https://" + subdomain + ".zendesk.com/agent";
      }
    });
  }

  /**
   * Registers the email input keypress handler, which clicks on the remind
   * me button programmatically when Enter is pressed
   */
  function registerEmailInputKeypressHandler() {
    $reminderFormFields.input.keypress(function(e) {
      if (e.which == 13) {
        e.preventDefault();
        $remindMeButton.click();
      }
    });
  }

  /**
   * Registers the Remind Me button click handler that sends a reminder email
   * to the user.
   * Presents a results div with text notifying the user if the email is
   * not found, or success text if the email was found.
   */
  function registerRemindMeButtonClickHandler() {
    $remindMeButton.click(function(){
      var email = $reminderFormFields.input.val();

      if (!email.length || email === 'me@example.com' || !webutils.isValidEmail(email)) {
        animateErrorLabel($reminderFormFields.error);
      } else {
        $remindResultDiv.show().css({ opacity: 1 });
        $newToZendeskLink.hide();
        sendReminderEmail(email);
      }

      return false;
    });
  }

  /**
   * Performs a GET request to the Z1 reminder email API endpoint.
   * On error, displays a text
   * and a different error label is shown if the email was not found.
   *
   * @param {String} email
   */
  function sendReminderEmail(email) {
    var url = 'https://support.zendesk.com/accounts/reminder?email=' + email + '&callback=?';

    $.getJSON(url, function(data) {
      // Note: data.success is always true, regardless of the email. Only false if the calls fails somehow?
      if (data.success) {
        $remindResultParagraph.text(loginStrings.checkingRecords);
      } else {
        $remindResultDiv.find('img').fadeOut('fast');
        $remindResultParagraph.text(loginStrings.errorTryAgain);
      }
    });
  }

  /**
   * Groups the registration of handlers associated with the Support login form.
   * Also shows a list of existing customer subdomains under the Support login
   * button if applicable, otherwise registers a click handler
   */
  function setupSubdomainLoginForm() {
    registerReminderLinkClickHandler();
    registerSubdomainKeypressHandler();
    registerSubdomainInputChangeHandler();
    registerLoginButtonClickHandler();
    registerSupportClickHandler();

    webutils.showCTA(null, '/', { truncationLength: 40 }).then(function() {
      webutils.getFormattedSubdomains().then(function(subdomains) {
        if (subdomains && subdomains.length) {
          deregisterSupportClickHandler();
          return;
        }
      });
    });
  }

  /**
   * Groups the registration of handlers associated with the Remind Me form
   */
  function setupRemindForm() {
    registerEmailInputKeypressHandler();
    registerRemindMeButtonClickHandler();
  }

  /**
   * Performs the necessary setup of handlers, DOM manipulation, and webutils
   * calls
   */
  function setupLoginPage() {
    setupSubdomainLoginForm();
    setupRemindForm();
    registerHistoryHandlers();
    restoreHistoryState();

    // Tracking for A/B testing
    webutils.trackHomeTest('login');

    // Hides footer because its presentation isn't needed, but the included
    // JS is still required
    $footer.hide();
  }

  setupLoginPage();
});
