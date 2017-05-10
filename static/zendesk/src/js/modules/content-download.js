var ResourceLead = {
  init: function() {
    var self = this;
    var geoResolved = false;

    // Listeners
    $('#resource-lead')
      .on('keyup', '.required', function(){
        if($(this).attr('data-state') === 'active') {
          target = $(this);

          if (window.timer) {
            window.clearTimeout(timer);
          }

          timer = setTimeout(function() {
            self.validateField(target);
          }, 800);
        }
      })
      .on('blur', '.required', function(){
        if($(this).attr('data-state') != 'active') {
          $(this).attr('data-state', 'active');
        }

        self.validateField($(this));

        // lookup geoip info once user starts filling out form so it's fetched
        // in time for form submission
        if(!geoResolved) {
          webutils.setMAVs(false);
          geoResolved = true;
        }
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
        webutils.track('Marketing - Lead - TAP - Initial Form Submission');
      }

      var form = $("#resource-lead");
      webutils.checkEmailType({
        email: form.find("[type='email']").val(),
        form:form,
        reveal:".enrichment",
        clearbitMatch: function() {
          webutils.track('Marketing - Lead - TAP - Clearbit Match');
          ResourceLead.nanTrack(['user', 'form_filled', 'content-download',
            {'clearbitMatch':true}
          ]);
          ResourceLead.isClearbitMatch = true;
        },
        notClearbitMatch: function() {
          $(".non-clearbit-enrichment-required").addClass("required").removeClass("non-clearbit-enrichment-required");
          $(".non-clearbit-enrichment").show();
          ResourceLead.nanTrack(['user', 'form_filled', 'content-download',
            {'clearbitMatch':false}
          ]);
          ResourceLead.isClearbitMatch = false;
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
      })
    });
  },

  initialFieldsFilled: false,

  // Form validation
  validateField: function(target) {
    var self   = this,
        string = target.attr('value'),
        type   = target.attr('type'),
        holder = target.attr('placeholder'),
        pin,
        fade,
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
        $("#loading-spinner").show();

        webutils.createLead('#resource-lead');
        webutils.track('Marketing - Lead - TAP - Content Download');

        ResourceLead.nanTrack(['user', 'form_complete', 'content-download']);

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
        }, 4000);

      }
    }, 210);
  },
  // End Register Lead

  // Shorten the check and NaN event push
  nanTrack: function(val) {
    if (window.NaN_api) NaN_api.push(val);
  },
};

// Init form handler
ResourceLead.init();

$(document).ready(function(){
  // Overload createLead for v2
  webutils.createLead = function(formName, handleDone) {
    var theForm = $(formName);
    var clearbitFieldAssociation = {};
    var clearbitFieldURI = "";

    theForm.find("[data-clearbit]").each(function(i,ele) {
      clearbitFieldAssociation[$(ele).attr('name')] = $(ele).attr('data-clearbit');
    });

    if (Object.keys(clearbitFieldAssociation).length) {
      clearbitFieldURI = "&clearbitFieldAssociation="+JSON.stringify(clearbitFieldAssociation);
      $.post('/app/v2/lead', theForm.serialize() + clearbitFieldURI) // serialize form and post to lead creation endpoint
        .fail(function() { // on failure trigger bugsnag event that includes form name
          window.bugsnag = Bugsnag || {};
          window.bugsnag.notify("Lead creation", "Lead creation failed", {
            special_info: { form: formName } // pass form name for error diagnostics
          });
        }).success(function(data) {
          $(".form-wrapper").hide();
          $(".pitch").hide();
          $(".resource-body-content").show();
          $(".resource-body-content").animate({ opacity: 1 }, 200);

          if(typeof fbq !== 'undefined') {
            fbq('track', 'Lead');
          }
          var qualScore = 100;
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
        });
    } else {
      $.post('/app/lead', theForm.serialize()) // serialize form and post to lead creation endpoint
        .fail(function() { // on failure trigger bugsnag event that includes form name
          window.bugsnag = Bugsnag || {};
          window.bugsnag.notify("Lead creation", "Lead creation failed", {
            special_info: { form: formName } // pass form name for error diagnostics
          });
        });
    }

  };
})
