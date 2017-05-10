/*
 * Gartner 2016 Magic Quadrant Lead
 *
 * Optional dependency:
 * - /public/assets/js/bizo.js
 *
 * Custom events:
 * - `submit-executed` : when validation on all inputs pass and submit event executes.
 */

var ResourceLead = {
  init: function() {
    var self = this;

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
    $('#resource-lead .btn-submit').on('click', function(e){
      e.preventDefault();

      // Grab heapid, gclid id and hiddenCampaignId
      webutils.paramsForEloqua();

      if (!ResourceLead.initialFieldsFilled) {
        ResourceLead.initialFieldsFilled = true;
        webutils.track('Marketing - Lead - Gartner - Initial Form Submission');
      }

      var form = $("#resource-lead");
      webutils.checkEmailType({
        email: form.find("[type='email']").val(),
        form:form,
        reveal:".enrichment",
        clearbitMatch: function() {
          webutils.track('Marketing - Lead - Gartner - Clearbit Match');

          ResourceLead.nanTrack(['user', 'form_filled', 'gartner',
            {'clearbitMatch':true}
          ]);
        },
        notClearbitMatch: function() {
          $(".non-clearbit-enrichment-required").addClass("required").removeClass("non-clearbit-enrichment-required");
          $(".non-clearbit-enrichment").show();

          ResourceLead.nanTrack(['user', 'form_filled', 'gartner',
            {'clearbitMatch':false}
          ]);
        },
        next: function() {

          webutils.setMAVs(false);
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

    });

    // Check for ungating param
    var ungated = (webutils.getURLParameter('ungated'));

    if(ungated === 'true') {
      self.showGatedContent();
    }

    // Check for stored form data
    enrichUtils.leadFromStorage({
      formSelector: "#resource-lead",
      preFire: function(){
        webutils.paramsForEloqua();
      },
      success: ResourceLead.createLeadFromStore,
      fail:    ResourceLead.createLeadFail,
      notStored: function() {
        $(".form-wrapper").css({display:"block", opacity: 1});
      }
    });
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

    if((type === 'text' && (string == '' || string == holder || !/[一-龠]+|[ぁ-ん]+|[ァ-ヴー]+|[a-zA-Z0-9]+|[ａ-ｚＡ-Ｚ０-９]+/.test(string))) ||
      (type === 'email' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(string)) ||
      (type === 'select' && string === '')) {

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
    var self     = this,
        form     = $('#resource-lead'),
        required = form.find('.required'),
        name     = $('input#owner\\[name\\]').val();

    names = name.indexOf(' ');

    if(names === -1) {
      $('#FirstName').attr('value', name);
      $('#LastName').attr('value', name);
    } else {
      $('#FirstName').attr('value', name.substr(0, names));
      $('#LastName').attr('value', name.substr(names + 1, name.length));
    }

    for(var i = 0; i < required.length; i++) {
      self.validateField($(required[i]));
    }

    var delay = setTimeout(function() {
      if($('#resource-lead .error').length === 0) {

        ResourceLead.nanTrack(['user', 'form_complete', 'gartner',
        ]);

        $("#loading-spinner").show();

        enrichUtils.createLead({
          formName: '#resource-lead',
          handleSuccess: ResourceLead.createLeadSuccess,
          handleFail:    ResourceLead.createLeadFail,
          isMatch:       ResourceLead.isClearbitMatch
        });
        webutils.track('Marketing - Lead - Gartner - Content Download');

        if (window.dataLayer) {
          dataLayer.push({'event': 'resources_form_submit'});
        }

        var size = $('select[name="account[help_desk_size]"]').val();
        if (size && size !== '-') {
          webutils.trackMarinContentConversion(size, 'Content', 'content_download');
        }

        setTimeout(function() {
          $('.form-wrapper').animate({ opacity: 0.1 }, 200);
        }, 4500);

        setTimeout(function(){
          $(".form-wrapper").hide();
          $("#loading-spinner").hide();
          $(".resource-body-content").show();
          $(".resource-body-content").animate({ opacity: 1 }, 200);
        }, 5000);

      }
    }, 210);
  },
  // End Register Lead

  showGatedContent: function() {
    $(".form-wrapper").hide();
    $(".resource-body-content").show();
    $(".resource-body-content").animate({ opacity: 1 }, 200);
  },

  // Shorten the check and NaN event push
  nanTrack: function(val) {
    if (window.NaN_api) NaN_api.push(val);
  },

  createLeadSuccess:function(data) {
    var qualScore = 100;
    if (!$.cookie("lead-generated")) {
      if (data.account.help_desk_size.match(/(50-249|250-499|500-999|1000-4999|5000\+)/)) {
        qualScore = 300;
      }

      if (ResourceLead.isClearbitMatch) {
        qualScore = 2*qualScore;
      }
      ResourceLead.nanTrack(['user', 'content_form_complete', qualScore.toString(),
        {
          'clearbitMatch':ResourceLead.isClearbitMatch
        }
      ]);
      $.cookie("lead-generated", "true", {expires: 365});
    }
    window.location.href = window.location.protocol + "//" + window.location.host+"/gartner-report/thanks/";
  },

  createLeadFromStore: function(data) {
    if (localStorage) {
      if (data && data.NaN_user_id) {
        localStorage.setItem("NaN_user_id", data.NaN_user_id);
      }

      if (localStorage.getItem("NaN_user_id")) {
        window.NaN_api = [[503579, localStorage.getItem("NaN_user_id")]];
      }

      // Grab isMatch if it is defined
      var enrichedFormData = localStorage.getItem("enrichedFormData");
      if (JSON.parse(enrichedFormData).isMatch) {
        ResourceLead.isClearbitMatch = JSON.parse(enrichedFormData).isMatch;
      }

    }

    if (data && data.account && data.account.help_desk_size) {
      var qualScore = 100;
      if (data.account.help_desk_size.match(/(50-249|250-499|500-999|1000-4999|5000\+)/)) {
        qualScore = 300;
      }
      $(".form-wrapper").hide();
      $(".resource-body-content").css({display:"block", opacity:1});

      if (ResourceLead.isClearbitMatch) {
        qualScore = 2*qualScore;
      }

      ResourceLead.nanTrack(['user', 'demo_form_complete', qualScore.toString(),
        {
          'clearbitMatch':ResourceLead.isClearbitMatch
        }
      ]);

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
ResourceLead.init();
