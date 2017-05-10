/*
 * New homepage forms
 *
 * Optional dependency:
 * - /public/assets/js/bizo.js
 *
 * Custom events:
 * - `submit-executed` : when validation on all inputs pass and submit event executes.
 */

var HomeShapes = {

  // Form validation
  validateField: function(target) {
    var valid  = webutils.isFieldValid(target);
    var pin    = target.parent().find('label');
    var string = target.attr('value');
    var type   = target.attr('type');
    var fade   = !(pin.css('opacity') === '1');

    if (type === 'select') {
      pin = target.parent().parent().find('label');
      fade   = (pin.css('opacity') === '1') ? false : true;
    } else {
      pin = target.parent().find('label');
      fade   = (pin.css('opacity') === '1') ? false : true;
    }

    if (!valid || (type === 'select' && string === '')) {
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
  },
  // End form validation

  //start animations logic
  isElementInViewport: function(elem) {
    var $elem = $(elem);

    if ($elem.length === 0) return false;

    // Get the scroll position of the page.
    var scrollElem = ((navigator.userAgent.toLowerCase().indexOf('webkit') != -1) ? 'body' : 'html');
    var viewportTop = $(scrollElem).scrollTop();
    var viewportBottom = viewportTop + $(window).height();

    // Get the position of the element on the page.
    var elemTop = Math.round($elem.offset().top) + 250;
    var elemBottom = elemTop + $elem.height();

    return ((elemTop < viewportBottom) && (elemBottom > viewportTop));
  },

  // start animation when in viewort.
  checkAnimation: function(elem) {
    var $elem = $(elem);

    // If the animation has already been started
    if ($elem.hasClass('start')) return;

    if (HomeShapes.isElementInViewport($elem)) {
      // Start the animation
      $elem.addClass('start');
      $elem[0].play();
    }
  },

  /**
   * Registers handlers for all inputs, which includes basically validation,
   * error handling, and select formatting.
   */
  init: function() {
    var timeout;
    var DEFAULT_NAME = 'unknown';
    var geoResolved = false;

    HomeShapes.campaignName = 'Homepage Shapes';
    HomeShapes.type = 'Engagement';

    var keyupHandler = function () {
      var target = $(this);

      if (target.attr('data-state') !== 'active') return;

      clearTimeout(timeout);

      timeout = setTimeout(function() {
        HomeShapes.validateField(target);
      }, 800);
    };

    var blurHandler = function() {
      var target = $(this);

      target.attr('data-state', 'active');
      HomeShapes.validateField(target);

      // lookup geoip info once user starts filling out form so it's fetched
      // in time for form submission
      if (!geoResolved) {
        webutils.setMAVs(false);
        geoResolved = true;
      }
    };

    var nameHandler = function() {
      var name = webutils.escapeHTML($(this).val()) || '';
      var split = webutils.splitName(name);

      $(this.closest('section')).find('#FirstName').val(split[0] || DEFAULT_NAME);
      $(this.closest('section')).find('#LastName').val(split[1] || DEFAULT_NAME);
    };

    var selectHandler = function() {
      var target = $(this);

      target.attr('data-state', 'active');
      HomeShapes.validateField(target);

      var content = webutils.escapeHTML(target.val()) + '<span class="toggle"></span>';
      target.siblings('.select-label').html(content);
    };

    var submitHandler = function(e) {
      e.preventDefault();
      var $form = $(this).closest('form');

      // standard lead geneation
      HomeShapes.createLeadFromForm($form);
    };

    var animationHelpers = {
      appearDone: function(e) {
        $(e.currentTarget)
          .addClass("entrance-done")
          .off("animationend", animationHelpers.appearDone)
          .on("animationend", animationHelpers.hoverState);
        $(e.currentTarget).parent()
          .on("mouseover", animationHelpers.mouseOver);
      },
      hoverState: function(e) {
        $(e.currentTarget).removeClass("hover");
      },
      mouseOver: function(e){
        $(e.currentTarget).children(".feature-icon-common").addClass("hover");
      },
      curtainUp: function(e) {
        var curtainCall = animationHelpers.$family.offset().top;
        var windowOffset   = window.pageYOffset + window.innerHeight;

        if (curtainCall < windowOffset) {
          animationHelpers.$family.addClass("curtain-up");
          $(window).off("scroll", animationHelpers.curtainUp);
        }
      },
      $family: $(".zendesk-family-products")
    };

    webutils.lockTopNavigation(); // make top navigation sticky

    $(".product-link").children(".feature-icon-common").on("animationend", animationHelpers.appearDone);

    $(window).scroll(animationHelpers.curtainUp);
    animationHelpers.curtainUp();

    $(".guide-reveal").click(function() {
      $(".guide-box").toggleClass("open");
    });

    $(window).scroll(webutils.debounce(function() {
      HomeShapes.checkAnimation('.heart');
      HomeShapes.checkAnimation('.tower');
      HomeShapes.checkAnimation('.mushrooms');
    }, 30));

    $('.form-wrapper form')
      .on('keyup', 'input.required', keyupHandler)
      .on('blur', 'input.required', blurHandler)
      .on('blur', '[name="owner\\[name\\]"]', nameHandler)
      .on('change', 'select', selectHandler)
      .on('click', '.btn-submit', submitHandler);
  },

  // Create lead for content downloads
  createLeadFromForm: function(form) {
    var required = form.find('.required');

    for (var i = 0; i < required.length; i++) {
      HomeShapes.validateField($(required[i]));
    }

    // Grab heapid, gclid id and hiddenCampaignId
    webutils.paramsForEloqua();

    if (!HomeShapes.initialFieldsFilled) {
      HomeShapes.initialFieldsFilled = true;
      webutils.track('Marketing - Lead - '+ HomeShapes.type +' - Initial form submission', {campaign: HomeShapes.campaignName});
    }

    webutils.checkEmailType({
      email: form.find("[type='email']").val(),
      form:form,
      reveal:".enrichment",
      clearbitMatch: function() {
        webutils.track('Marketing - Lead - '+ HomeShapes.type +' - Clearbit match', {campaign: HomeShapes.campaignName});

        HomeShapes.nanTrack(['user', 'form_filled', HomeShapes.campaignName,
          {'clearbitMatch':true}
        ]);
      },
      notClearbitMatch: function() {
        form.find(".non-clearbit-enrichment-required").addClass("required").removeClass("non-clearbit-enrichment-required");
        form.find(".non-clearbit-enrichment").show();

        webutils.track('Marketing - Lead - '+ HomeShapes.type +' - Not Clearbit match', {campaign: HomeShapes.campaignName});

        HomeShapes.nanTrack(['user', 'form_filled', HomeShapes.campaignName,
          {'clearbitMatch':false}
        ]);
      },
      next: function() {
        HomeShapes.registerLead(form);
      },
      error: function() {
        // Show everything if stuff times out
        form.find(".enrichment-required").addClass("required").removeClass("enrichment-required");
        form.find(".enrichment").show();
        form.find(".non-clearbit-enrichment-required").addClass("required").removeClass("non-clearbit-enrichment-required");
        form.find(".non-clearbit-enrichment").show();
      }
    });
  },

  initialFieldsFilled: false,

  // registerLead
  registerLead: function(form) {
    var self     = this, names,
        $fields = {
          form:     form,
          name:     form.find('input#owner\\[name\\]').val(),
          wrapper:  form.parent(".form-wrapper")
        };
        $fields.required = $fields.form.find('.required');
        $fields.first    = $fields.form.find("#FirstName");
        $fields.last     = $fields.form.find("#LastName");
        $fields.spinner  = $fields.form.find(".loading-dots");

    // for(var i = 0; i < required.length; i++) {
    for (var i = 0; i < $fields.required.length; i++) {
      HomeShapes.validateField($($fields.required[i]));
    }

    var delay = setTimeout(function() {
      if (form.find('.error').length === 0) {

        HomeShapes.nanTrack(['user', 'form_complete', HomeShapes.campaignName]);

        $fields.spinner.show();

        enrichUtils.createLead({
          formName: '#' + form.attr('id'),
          handleSuccess: HomeShapes.createLeadSuccess,
          handleFail:    HomeShapes.createLeadFail,
          isMatch:       HomeShapes.isClearbitMatch
        });
        webutils.track('Marketing - Lead - '+ HomeShapes.type, {campaign: HomeShapes.campaignName});

        if (window.dataLayer) {
          dataLayer.push({'event': 'resources_form_submit'});
        }

        var size = $('select[name="account[help_desk_size]"]').val();
        if (size && size !== '-') {
          webutils.trackMarinContentConversion(size, 'Content', 'content_download');
        }

        setTimeout(function(){
          $fields.spinner.hide();
          form.find('.gated-resource-link')[0].click();
        }, 5000);
      }
    }, 210);
  },
  // End Register Lead

  // Shorten the check and NaN event push
  nanTrack: function(val) {
    if (window.NaN_api) NaN_api.push(val);
  },

  createLeadSuccess:function(data) {
    if (!$.cookie("lead-generated")) {
      $.cookie("lead-generated", "true", {expires: 365});
    }
  },

  createLeadFail:function() {
    if (!window.Bugsnag) return;
    window.Bugsnag.notify("Lead creation", "Lead creation failed", {
      special_info: { form: formName } // pass form name for error diagnostics
    });
  }
};

// Init form handler
HomeShapes.init();
