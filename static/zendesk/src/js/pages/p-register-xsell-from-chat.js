$(function() {

  /* Setup.
    Disable pushing states, b/c we don't support backwards navigation, i.e. we
    don't re-enable the Next button, to keep things simple.
    The initial pushing of the #getstarted state still happens before we can
    disable it. */
  webutils.pushStateFragment = $.noop;

  var elements = {
    root: $('.reg-xsell-from-chat'),

    /* Payloads for both account creation and eloqua are made by searching for
      inputs within `form.reg`. Any of them will do. */
    extraInputsParent: $('form.reg').first(),

    subdomainContainer: $('.domain'),
    passwordContainer: $('.password-row'),
    nextButton: $('.reg-xsell-from-chat-next')
  };

  var shownClass = 'reg-xsell-from-chat-shown';

  /* Data will be pushed from zopim. */
  var chatAccount;

  var currentStep = -1;

  /* Behaviors of the Next button at each step. */
  var nextButtonHandlers = [
    function() {
      var input = elements.subdomainContainer.find('input');

      function isValid() {
        return input.is('.set') &&
          Number(elements.subdomainContainer.find('label.error').css('opacity')) === 0 &&
          Number(elements.subdomainContainer.find('label.suggested').css('opacity')) === 0;
      }

      function toNextStep() {
        swapNextButtonHandler();

        $('.domain-ping').hide();
        elements.subdomainContainer.removeClass(shownClass);
        elements.passwordContainer.addClass(shownClass);
      }

      triggerNextActionOnValidatedUserInput(input, isValid, toNextStep);
    },
    function() {
      var input = elements.passwordContainer.find('input');

      function isValid() {
        return !elements.passwordContainer.is('.error') &&
          input.is('.set') &&
          Number(elements.passwordContainer.find('label.error').css('opacity')) === 0;
      }

      triggerNextActionOnValidatedUserInput(input, isValid, createAccount);
    }
  ];

  function swapNextButtonHandler() {
    ++currentStep;
    elements.nextButton
      .off('click')
      .on('click', nextButtonHandlers[currentStep]);
  }

  function triggerNextActionOnValidatedUserInput(input, isValid, nextAction) {
    var initVal = input.val();

    if (isValid()) {
      nextAction();
    } else {
      /* Just in case validation hasn't happened yet or the input was never
        focused on by the user at all (eg auto-populated by browser), force
        trigger validation.
        `isValid` is expected to return false when validation hasn't happened
        yet. */
      input.trigger('blur');

      disableNextButtonTillValidated(isValid, function() {
        var currVal = input.val();

        /* If the value that is now finally valid is different from the original
          invalid value when user tried to trigger the next action, then do not
          automatically trigger the next action but force the user to trigger
          it again.
          Eg when subdomain validation picks a different value, or when user
          corrects the password and blurs from the input, give user a chance to
          think about this new value, and force user to click on the Next button
          again. */
        if (initVal != currVal) {
          return;
        }

        nextAction();
      });
    }
  }

  function disableNextButtonTillValidated(isValid, whenValid) {
    var intervalId;

    function toggleDisable(disable) {
      elements.nextButton
        .prop('disabled', disable)
        .toggleClass('btn-disabled', disable);
    }

    toggleDisable(true);

    intervalId = setInterval(function() {
      if (isValid()) {
        clearInterval(intervalId);
        whenValid();
        toggleDisable(false);
      }
    }, 300);
  }

  function createAccount() {
    var subdomainInputName = 'account[subdomain]';
    var subdomainInput, subdomain;

    toggleLoading(true, 'loading-creating');

    /* Turn off further validation on subdomain while clearbit changes the value
      and we override it back. */
    subdomainInput = findInputElm(subdomainInputName)
      .off('keypress keyup keydown focus blur');

    /* Need to keep subdomain b/c it'll be overridden by clearbit. */
    subdomain = subdomainInput.val();

    /* Populate inputs to pass validation, so clearbit can run. */
    encodeChatAccountInDom();

    /* Hack this fn again, this time as a callback for clearbit completion. */
    webutils.pushStateFragment = function() {
      webutils.pushStateFragment = $.noop;

      /* Encode again to override clearbit. */
      encodeChatAccountInDom();
      setInputValue(subdomainInputName, subdomain);

      /* Hack. Prevent redirecting on current window. Also conveniently use it to
        attach a callback. */
      webutils.redirect = handleAccountCreationSuccess;

      window.handleAccountCreationFailure = handleAccountCreationFailure;

      /* Prob not needed since we took validation off subdomain, but just in case. */
      $('.domain-ping').hide();

      /* Note, this implements a retry logic (but is disabled atm). */
      $('.create-account').trigger('click');
    };

    /* Call clearbit. This is the earliest opportunity we have to do so.
      Validation must pass for all inputs within .step-1, which contains
      password and email. Password was filled in our 2nd step, and email was
      filled by `encodeChatAccountInDom`. */
    $('.step li.error').removeClass('error');
    $('.step-1 a.next').trigger('click');
  }

  /* The underlying implementation for account creation reads DOM to construct
    payload, so we have to dump a representation of agents into DOM first.
    The inputs can be children of any `form.reg`.

    number_employees is not available for older accounts.
    owner_phone is not available.
    currency is not available.
    (But leave the logic for population here anyway. Defaults are used to pass
    valiation.)  */
  function encodeChatAccountInDom() {
    setInputValue('owner[email]', chatAccount.owner_email);
    encodeCompanyName();
    setInputValue('account[help_desk_size]', chatAccount.number_employees || '1-9');
    setInputValue('owner[name]', chatAccount.owner_name);
    setInputValue('address[phone]', chatAccount.owner_phone || '000-000-0000');
    encodeLanguage();
    encodeCurrency();
    toggleEncodeAgents();
    encodeEloqua();
  }

  /* Pick the first non-empty value among those [
    provided by zopim,
    detected by clearbit which should already be encoded in dom,
    email host
  ]. */
  function encodeCompanyName() {
    var name = 'account[name]';

    function emailHost(email) {
      return email.match(/@(.+)\./)[1];
    }

    if (chatAccount.company_name) {
      setInputValue(name, chatAccount.company_name);
    } else if (!findInputElm(name).val()) {
      setInputValue(name, emailHost(chatAccount.owner_email));
    }
  }

  /* Attr `name=language` is changed to `name=account[language]` if using fast
    creation; let jquery find either.

    When setting <select>'s `value`, if it's not support by one of the <option>
    elements, then the `value` would be null. Then, the value would be defaulted
    to US English by Classic.

    To avoid this defaulting, set iff there is a match; otherwise, defer to the
    existing code which infers it from `location.host`.

    The list of Chat's language codes is at
    https://github.com/zopim/meshim-frontend/blob/master/src/meshim/dashboard/controllers/Language.js */
  function encodeLanguage() {
    var select = findInputElm('language').add(findInputElm('account[language]'));
    var options = select.children('option');

    var code = chatAccount.language.replace(/_/, '-').toLowerCase();
    var isCodeValid = hasOption(code);

    function hasOption(val) {
      return options.filter(function() {
        return this.value === val;
      }).length;
    }

    if (!isCodeValid) {
      code = code.replace(/-.*/, '');
      isCodeValid = hasOption(code);
    }

    if (isCodeValid) {
      setInputValue('language', code);
      setInputValue('account[language]', code);
    }
  }

  /* Supported values are the case-insensitive versions of the `CurrencyType`
    constants in
    https://github.com/zendesk/zendesk_types/blob/master/lib/zendesk/types.rb
    Other values including the empty value is defaulted to 'USD' by Classic.

    To avoid this defaulting, set iff value is supported; otherwise, defer to the
    existing code which infers it from `location.host`. */
  function encodeCurrency() {
    if (!chatAccount.currency) {
      return;
    }
    var currency = chatAccount.currency.toUpperCase();
    if (['USD','EUR','GBP','JPY'].indexOf(currency) >= 0) {
      setInputValue('account[currency]', currency);
    }
  }

  function toggleEncodeAgents() {
    var className = 'reg-xsell-from-chat-agent';

    var doPopulate = $('.include-agents input').prop('checked');
    var inputs;

    elements.extraInputsParent.find('.' + className).remove();

    if (doPopulate) {
      inputs = $();
      $.each(chatAccount.agents, function(i, agentData) {
        var namePrefix = 'agents[' + i + ']';
        agentData.role = 'Agent';
        $.each(['name', 'email', 'role'], function(j, prop) {
          inputs = inputs.add(
            $('<input type="hidden">')
              .addClass(className)
              .attr('name', namePrefix + '[' + prop + ']')
              .val(agentData[prop])
          );
        });
      });
      inputs.appendTo(elements.extraInputsParent);
    }
  }

  function encodeEloqua() {
    var chatPlanInputName = 'Chat_plan';
    var chatPlanInput = findInputElm(chatPlanInputName);

    if (!chatPlanInput.length) {
      // webutils.postToEloqua requries id and type attrs.
      chatPlanInput = $('<input type="text">')
        .attr('id', chatPlanInputName)
        .attr('name', chatPlanInputName)
        .appendTo(elements.extraInputsParent);
    }

    chatPlanInput.val(chatAccount.plan_name);

    /* Need to use a different eloqua form */
    setInputValue('elqFormName', 'chatxsell');
  }

  /* Defining a separate function for setting value, so that in case we want
    to e.g. trigger events before and after setting it, it'd be easy to write it
    here.
    Events that we might want include click, focus, keypress, change. These
    events are handled by the underlying code for various purposes including
    validation.
    But b/c the underlying code is really involved, it's probably safer to not
    trigger anything, and instead let `function register` call `validate`
    on each input, later. */
  function setInputValue(name, val) {
    findInputElm(name).val(val);
  }

  function findInputElm(name) {
    var selector = 'form.reg [name="' + name + '"]';
    return $(selector);
  }

  function handleAccountCreationSuccess(verificationUri) {
    postMessageToZopim('accountCreated', verificationUri);
  }

  function handleAccountCreationFailure() {
    elements.root.addClass('error');
    toggleLoading(false, 'loading-creating');
  }

  function translatedParagraph(clazz) {
    return elements.root.find('.translated').find('.' + clazz);
  }

  function postMessageToZopim(action, data) {
    window.top.postMessage(JSON.stringify({
      target: 'zdSignup',
      action: action,
      data: data
    }), '*');
  }

  function toggleLoading(isLoading, clazz) {
    clazz = (clazz || '') + ' loading';
    elements.root.toggleClass(clazz, isLoading);
  }

  /* Test with any of
    ```
    window.postMessage(JSON.stringify({
      owner_email: 'foo@bar.com',
      owner_phone: '123-123-1234',
      owner_name: 'first last',
      company_name: 'megacorp',
      number_employees: 234,
      language: 'fr',
      currency: 'EUR',
      agents: [
        {
          name: 'agent num0',
          email: 'agent+0@zendesk.com'
        },
        {
          name: 'agent num1',
          email: 'agent+1@zendesk.com'
        }
      ],
      plan_name: 'this is the plan name'
    }), window.location.origin)

    window.postMessage('{"owner_name":"Test Agent Owner","owner_email":"testagent@zopim.com","agents":[{"name":"Test Agent 1","email":"a1@z.com"},{"name":"Test Agent 2","email":"a2@z.com"},{"name":"Test Agent 3","email":"a3@z.com"},{"name":"Test Agent 4","email":"a4@z.com"},{"name":"Test Agent 5","email":"a5@z.com"}],"company_name":"testaccount","number_employees":"","language":"en"}', location.origin)

    ``` */
  $(window).on('message onmessage', function(e) {
    var chatAccount_ = e.data || (e.originalEvent && e.originalEvent.data);

    if (!chatAccount_) {
      return;
    }

    try {
      chatAccount_ = JSON.parse(chatAccount_);
    } catch (err) {
      return;
    }

    // Ignore a myriad of other kinds of valid `postMessage`s.
    if (!chatAccount_.owner_email) {
      return;
    }

    chatAccount = chatAccount_;

    if (chatAccount.agents && chatAccount.agents.length) {
      $('.include-agents').addClass(shownClass);
    }

    toggleLoading(false);
  });

  /* After onmessage handler is attached, let the embedding zopim page know
    it can postMessage to this reg form. */
  postMessageToZopim('formReady');

  $('.reg-xsell-from-chat-already-have').on('click', function() {
    postMessageToZopim('showIntegrate');
  });

  elements.subdomainContainer
    .addClass(shownClass)
    .find('input')
      .prop('placeholder', translatedParagraph('subdomain-placeholder').text());
  elements.passwordContainer
    .find('input')
      .prop('placeholder', translatedParagraph('password-placeholder').text());

  swapNextButtonHandler();

});
