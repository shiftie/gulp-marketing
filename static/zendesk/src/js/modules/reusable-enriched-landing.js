/*
 * Golion style ads
 *
 * Optional dependency:
 * - /public/assets/js/bizo.js
 *
 * Custom events:
 * - `submit-executed` : when validation on all inputs pass and submit event executes.
 */

var ResourceLead = {
  geoResolved: false,
  init: function() {
    var self = this;

    // Grab adSetup properties, otherwise default to trial_form_complete
    if (window.adSetup) {
      ResourceLead.nanConversion = adSetup.nanCampaignTag ? adSetup.nanCampaignTag : "trial_form_complete";
      ResourceLead.campaignName = adSetup.campaignName ? adSetup.campaignName: 'Customer Landing';
      ResourceLead.type = adSetup.type ? adSetup.type : "Lead";

      // If a custom eloqua form name is specified
      if (adSetup.elqFormName) {
        $("#elqFormName").val(adSetup.elqFormName);
      }

      if (adSetup.successRedirect && adSetup.successRedirect.match(/^\/register\/?$/)) {
        // The form is being used for /register, show the Password field and remove the Name field
        $("#lead-name-field").remove();
        $("#register-pasword-field").show();
      } else {
        // It is a lead gen, Remove the password field
        $("#register-pasword-field").remove();
      }
    }


    // Listeners
    $('#resource-lead')
      .on('keyup', '.required', function(){
        if($(this).attr('data-state') === 'active') {
          target = $(this);

          if (ResourceLead.timer) {
            window.clearTimeout(ResourceLead.timer);
          }

          ResourceLead.timer = setTimeout(function() {
            self.validateField(target);
          }, 800);
        }
      })
      .on('blur', '.required', function(){
        if($(this).attr('data-state') != 'active') {
          $(this).attr('data-state', 'active');
        }
        if (!ResourceLead.geoResolved) {
          webutils.setMAVs(false);
          ResourceLead.geoResolved = true;
        }

        self.validateField($(this));
      })
      .on('change', 'select.required', function(){
        // Store selection
        var $thisOption = $(this).find("option:selected").val();

        if($(this).attr('data-state') != 'active') {
          $(this).attr('data-state', 'active');
        }

        self.validateField($(this));

        $(this)
          .siblings('.select-label')
          .find('.txt')
          .text($thisOption)
          .addClass('set')
    });

    // Form submitted
    $('#resource-lead .btn-content-cta').on('click', function(e){
      e.preventDefault();

      $('#resource-lead').find("input.required").each(function() {
        self.validateField($(this));
      });

      if (adSetup.successRedirect && adSetup.successRedirect.match(/^\/register\/?$/)) {
        // If the adSetup redirects to /register/, then we will prepopulate the form with data
        ResourceLead.handleRegisterUser();
      } else {
        // Otherwise, consider it a standard lead geneation
        ResourceLead.createLeadFromForm();
      }

    });

    // Check for ungating param
    var ungated = (webutils.getURLParameter('ungated'));

    if(ungated === 'true') {
      self.showGatedContent();
    }

    if ($.cookie("lead-generated")) {
      ResourceLead.showGatedContent();
    }

    if (window.adSetup) {
      if (adSetup.ctaName) {
        $(".btn-content-cta").html(adSetup.ctaName);
      }

    }
    // All set, reveal the page content
    $(".page-content").css({opacity:1});
  },

  // Create lead for content downloads
  createLeadFromForm: function() {
    // Grab heapid, gclid id and hiddenCampaignId
    webutils.paramsForEloqua();

    if (!ResourceLead.initialFieldsFilled) {
      ResourceLead.initialFieldsFilled = true;
      webutils.track('Marketing - Lead - '+ ResourceLead.type +' - Initial form submission', {campaign: ResourceLead.campaignName});
    }

    var form = $("#resource-lead");

    webutils.checkEmailType({
      email: form.find("[type='email']").val(),
      form:form,
      reveal:".enrichment",
      clearbitMatch: function() {
        webutils.track('Marketing - Lead - '+ ResourceLead.type +' - Clearbit match', {campaign: ResourceLead.campaignName});

        ResourceLead.nanTrack(['user', 'form_filled', ResourceLead.campaignName,
          {'clearbitMatch':true}
        ]);
      },
      notClearbitMatch: function() {
        $(".non-clearbit-enrichment-required").addClass("required").removeClass("non-clearbit-enrichment-required");
        $(".non-clearbit-enrichment").show();

        webutils.track('Marketing - Lead - '+ ResourceLead.type +' - Not Clearbit match', {campaign: ResourceLead.campaignName});

        ResourceLead.nanTrack(['user', 'form_filled', ResourceLead.campaignName,
          {'clearbitMatch':false}
        ]);
      },
      next: function() {
        ResourceLead.registerLead();
      },
      error: function() {
        // Show everything if stuff times out
        $(".enrichment-required").addClass("required").removeClass("enrichment-required");
        $(".enrichment").show();
        $(".non-clearbit-enrichment-required").addClass("required").removeClass("non-clearbit-enrichment-required");
        $(".non-clearbit-enrichment").show();
      }
    });
  },

  // Handle redirects to /register differently
  handleRegisterUser: function() {
    if (!ResourceLead.initialFieldsFilled) {
      ResourceLead.initialFieldsFilled = true;
      webutils.track('Marketing - Lead - '+ ResourceLead.type +' - Initial Form Submission', {campaign: ResourceLead.campaignName});
    }

    // Stuff from homepage-trial.js
    var required, i, redirect, redirectUrls, form;

    form = $('#resource-lead');
    if (!form.length) return;

    emailField = form.find('input[name="owner[email]"]');
    passwordField = form.find('input[name="owner[password]"]');

    redirectUrls = {
      success: '/register/',
      error: '/register/free-trial/'
    };

    redirect = function() {
      var data, postData, retries, maxRetries, qualScore;

      data = JSON.stringify({
        email: emailField.val(),
        pass: passwordField.val()
      });

      webutils.track('Marketing - Lead - '+ ResourceLead.type +' - Details API Request', {campaign: ResourceLead.campaignName});

      retries = 0;
      maxRetries = 2;
      qualScore = 100; // Nanigans prefers things in cents

      ResourceLead.calculateQualScore({
        size: ResourceLead.companySize,
        isMatch: ResourceLead.isClearbitMatch,
        convert: 'trial_form_complete'
      });

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

          webutils.track('Marketing - Lead - '+ ResourceLead.type +' - Details API Request Failed', {
            error: JSON.stringify({status: status, error: err}),
            campaign: ResourceLead.campaignName
          });

          // Slight delay to allow tracking events to async fire
          setTimeout(function() {
            webutils.redirect(redirectUrls.error);
          }, 1000);
        });
      };

      setTimeout(postData, 210);
    };

    setTimeout(function() {
      var self     = this,
          form     = $('#resource-lead'),
          required = form.find('.required'),
          name     = $('input#owner\\[name\\]').val();

      for(var i = 0; i < required.length; i++) {
        ResourceLead.validateField($(required[i]));
      }

      if (form.find('.error').length) return;

      webutils.checkEmailType({
        email: form.find("input#owner\\[email\\]").val(),
        form:form,
        clearbitMatch: function(data) {
          ResourceLead.companySize = data.companySize;

          webutils.track('Marketing - Lead - '+ ResourceLead.type +' - Clearbit Match', {campaign: ResourceLead.campaignName});

          ResourceLead.isClearbitMatch = true;
          ResourceLead.nanTrack(['user', 'form_filled', 'lead_trial',
            {'clearbitMatch':true}
          ]);
        },
        notClearbitMatch: function() {
          webutils.track('Marketing - Lead - '+ ResourceLead.type +' - Not Clearbit Match', {campaign: ResourceLead.campaignName});
          ResourceLead.isClearbitMatch = false;
          ResourceLead.nanTrack(['user', 'form_filled', 'lead_trial',
            {'clearbitMatch':false}
          ]);
        },
        next:redirect,
      })
    }, 210);
  },

  initialFieldsFilled: false,

  // Form validation
  validateField: function(target) {
    var self   = this,
        string = target.attr('value'),
        type   = target.attr('type'),
        holder = target.attr('placeholder'),
        pin, //    = target.parent().find('label'),
        fade, //fade   = (pin.css('opacity') === '1') ? false : true,
        valid  = false;
    if (type === 'select') {
      pin = target.parent().parent().find('label');
      fade   = (pin.css('opacity') === '1') ? false : true;
    } else {
      pin = target.parent().find('label');
      fade   = (pin.css('opacity') === '1') ? false : true;
    }

    if((type === 'text' && (string == '' || string == holder || !webutils.utf8AlphaNum.test(string))) ||
      (type === 'email' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(string)) ||
      (type === 'select' && string === '') ||
      (type === 'password' && string.length < 5)) {

      // Animate error message
      pin.css({
        'opacity' : ((fade === false) ? 1 : 0),
        'left' : '20px',
        'display' : 'block'
      })
      .animate({
        'opacity' : 1,
        'left' : '0px'
      }, 300);

      target
        .removeClass('set')
        .parent()
        .addClass('error');
    } else {
      pin.animate({
        'opacity' : 0,
        'margin-left' : '1em'
      }, 200, function(){
        $(this).hide();
        target
          .parent()
          .removeClass('error');
      });

      target.addClass('set');
    }
  },
  // End form validation

  // registerLead
  registerLead: function() {
    var self     = this, names,
        $fields = {
          form:     $('#resource-lead'),
          name:     $('input#owner\\[name\\]').val(),
          wrapper:  $(".form-wrapper"),
          resource: $(".resource-body-content")
        }
        $fields.required = $fields.form.find('.required');
        $fields.first    = $fields.form.find("#FirstName");
        $fields.last     = $fields.form.find("#LastName");
        $fields.spinner  = $fields.form.find("#loading-spinner");

    names = $fields.name.indexOf(' ');

    if(names === -1) {
      $fields.first.attr('value', $fields.name);
      $fields.last.attr('value', $fields.name);
    } else {
      $fields.first.attr('value', $fields.name.substr(0, names));
      $fields.last.attr('value', $fields.name.substr(names + 1, $fields.name.length));
    }

    // for(var i = 0; i < required.length; i++) {
    for(var i = 0; i < $fields.required.length; i++) {
      self.validateField($($fields.required[i]));
    }

    var delay = setTimeout(function() {
      if($('#resource-lead .error').length === 0) {

        ResourceLead.nanTrack(['user', 'form_complete', ResourceLead.campaignName,
        ]);

        // $("#loading-spinner").show();
        $fields.spinner.show();

        enrichUtils.createLead({
          formName: '#resource-lead',
          handleSuccess: ResourceLead.createLeadSuccess,
          handleFail:    ResourceLead.createLeadFail,
          isMatch:       ResourceLead.isClearbitMatch
        });
        webutils.track('Marketing - Lead - '+ ResourceLead.type, {campaign: ResourceLead.campaignName});

        if (window.dataLayer) {
          dataLayer.push({'event': 'resources_form_submit'});
        }

        var size = $('select[name="account[help_desk_size]"]').val();
        if (size && size !== '-') {
          webutils.trackMarinContentConversion(size, 'Content', 'content_download');
        }

        setTimeout(function() {
          // $('.form-wrapper').animate({ opacity: 0.1 }, 200);
          $fields.wrapper.animate({ opacity: 0.1 }, 200);
        }, 4500);

        setTimeout(function(){
          $fields.wrapper.hide();
          $fields.spinner.hide();
          $fields.resource.show();
          $fields.resource.animate({ opacity: 1 }, 200);
        }, 5000);

      }
    }, 210);
  },
  // End Register Lead

  showGatedContent: function() {
    $(".form-wrapper").hide();
    $(".hide-thanks").hide();
    $("#thanks").show();
    $("#thanks").animate({ opacity: 1 }, 200);
  },

  // Shorten the check and NaN event push
  nanTrack: function(val) {
    if (window.NaN_api) NaN_api.push(val);
  },

  createLeadSuccess:function(data) {
    if (!$.cookie("lead-generated")) {

      ResourceLead.calculateQualScore({
        size: data.account.help_desk_size,
        isMatch: ResourceLead.isClearbitMatch,
        convert: ResourceLead.nanConversion
      });
      $.cookie("lead-generated", "true", {expires: 365});
    }
    if (adSetup && adSetup.successRedirect) {
      setTimeout(function(){
        window.location.href = adSetup.successRedirect;
      }, 1500);
    } else {
      // just reveal the content
      ResourceLead.showGatedContent();
    }

  },

  createLeadFail:function() {
    if (!window.Bugsnag) return;
    window.Bugsnag.notify("Lead creation", "Lead creation failed", {
      special_info: { form: formName } // pass form name for error diagnostics
    });
  },

  /**
   * Calculates the quality score of the targeted ads
   * size: String or Number, can be a range, e.g. '50-249' or a number, 1234
   * isMatch: if Clearbit Matched them
   * convert: string for reporting purposes to NaN
   */
  calculateQualScore: function(params) {
    var qualScore = 100;

    if (params.size && params.size.split) {
      params.size = parseInt(params.size.replace("+", "").split("-").shift());
    }
    if (params.size >= 50) {
      qualScore = 300;
    }

    if (params.isMatch) {
      qualScore = 2*qualScore;
    }

    ResourceLead.nanTrack(['user', params.convert, qualScore.toString(),
      {
        'clearbitMatch': params.isMatch
      }
    ]);
    return qualScore;
  }

};

// Init form handler
ResourceLead.init();
