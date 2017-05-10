/*
 * New smb forms
 *
 * Optional dependency:
 * - /public/assets/js/bizo.js
 *
 * Custom events:
 * - `submit-executed` : when validation on all inputs pass and submit event executes.
 */

var smbForm = {

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


  /**
   * Registers handlers for all inputs, which includes basically validation,
   * error handling, and select formatting.
   */
  init: function() {
    var timeout;
    var DEFAULT_NAME = 'unknown';

    webutils.lockTopNavigation(); // make top navigation sticky

    smbForm.campaignName = 'SMB Page';
    smbForm.type = 'Multichannel';

    var keyupHandler = function () {
      var target = $(this);

      if (target.attr('data-state') !== 'active') return;

      clearTimeout(timeout);

      timeout = setTimeout(function() {
        smbForm.validateField(target);
      }, 800);
    };

    var blurHandler = function() {
      var target = $(this);

      target.attr('data-state', 'active');
      smbForm.validateField(target);
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
      smbForm.validateField(target);

      var content = webutils.escapeHTML(target.val()) + '<span class="toggle"></span>';
      target.siblings('.select-label').html(content);
    };

    var submitHandler = function(e) {
      e.preventDefault();
      var $form = $(this).closest('form');

      // standard lead geneation
      smbForm.createLeadFromForm($form);
    };

    smbForm.animRamp = {
      container: document.getElementById('half-pipe'),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      rendererSettings: {
          progressiveLoad:false
      },
      path: 'https://d1eipm3vz40hy0.cloudfront.net/json/animations/solutions-smb-ramp-min.json'
    },
    smbForm.animSquare = {
      container: document.getElementById('square-tires'),
      renderer: 'svg',
      loop: false,
      autoplay: true,
      rendererSettings: {
          progressiveLoad:false
      },
      path: 'https://d1eipm3vz40hy0.cloudfront.net/json/animations/data%20%281%29.json'
    };

    if ($("#half-pipe").length && !_isMobile) {
      smbForm.anim = bodymovin.loadAnimation(smbForm.animRamp);
      smbForm.anim = bodymovin.loadAnimation(smbForm.animSquare);
    }


    webutils.lockTopNavigation(); // make top navigation sticky

    $(".guide-reveal").click(function() {
      $(".guide-box").toggleClass("open");
    });

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
      smbForm.validateField($(required[i]));
    }

    // Grab heapid, gclid id and hiddenCampaignId
    webutils.paramsForEloqua();

    if (!smbForm.initialFieldsFilled) {
      smbForm.initialFieldsFilled = true;
      webutils.track('Marketing - Lead - '+ smbForm.type +' - Initial form submission', {campaign: smbForm.campaignName});
    }

    webutils.checkEmailType({
      email: form.find("[type='email']").val(),
      form:form,
      reveal:".enrichment",
      clearbitMatch: function() {
        webutils.track('Marketing - Lead - '+ smbForm.type +' - Clearbit match', {campaign: smbForm.campaignName});

        smbForm.nanTrack(['user', 'form_filled', smbForm.campaignName,
          {'clearbitMatch':true}
        ]);
      },
      notClearbitMatch: function() {
        form.find(".non-clearbit-enrichment-required").addClass("required").removeClass("non-clearbit-enrichment-required");
        form.find(".non-clearbit-enrichment").show();

        webutils.track('Marketing - Lead - '+ smbForm.type +' - Not Clearbit match', {campaign: smbForm.campaignName});

        smbForm.nanTrack(['user', 'form_filled', smbForm.campaignName,
          {'clearbitMatch':false}
        ]);
      },
      next: function() {
        webutils.setMAVs(false);
        smbForm.registerLead(form);
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

    for (var i = 0; i < $fields.required.length; i++) {
      smbForm.validateField($($fields.required[i]));
    }

    var delay = setTimeout(function() {
      if (form.find('.error').length === 0) {

        smbForm.nanTrack(['user', 'form_complete', smbForm.campaignName]);

        $fields.spinner.show();

        enrichUtils.createLead({
          formName: '#' + form.attr('id'),
          handleSuccess: smbForm.createLeadSuccess,
          handleFail:    smbForm.createLeadFail,
          isMatch:       smbForm.isClearbitMatch
        });
        webutils.track('Marketing - Lead - '+ smbForm.type, {campaign: smbForm.campaignName});

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


