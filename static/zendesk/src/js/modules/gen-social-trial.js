/*
 * Trial social lead
 *
 *
 *
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
            clearTimeout(ResourceLead.timer);
          }

          ResourceLead.timer = setTimeout(function() {
            self.validateField(target);
          }, 800);
        }
      })
      .on('blur', '.required', function(){
        $(this).attr('data-state', 'active');

        self.validateField($(this));
      })
      .on('change', 'select.required', function(){
        // Store selection
        var $thisOption = $(this).find("option:selected").val();

        $(this).attr('data-state', 'active');

        self.validateField($(this));

        $(this)
          .siblings('.select-label')
          .find('.txt')
          .text($thisOption)
          .addClass('set');
    });

    // Form submitted
    $('#resource-lead .btn-submit').on('click', function(e){
      e.preventDefault();

      if (!ResourceLead.initialFieldsFilled) {
        ResourceLead.initialFieldsFilled = true;
        webutils.track('Marketing - Lead - Trial Enriched - Initial Form Submission');
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

        webutils.track('Marketing - Lead - Trial Enriched - Details API Request');

        retries = 0;
        maxRetries = 2;
        qualScore = 100; // Nanigans prefers things in cents

        if (ResourceLead.companySize > 50) {
          qualScore = 300;
        }

        if (ResourceLead.isClearbitMatch) {
          qualScore = 2*qualScore;
        }

        NaN_api.push(['user', 'trial_form_complete', qualScore.toString(),
          {
            'clearbitMatch':ResourceLead.isClearbitMatch
          }
        ]);

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

            webutils.track('Marketing - Lead - Trial Enriched - Details API Request Failed', {
              error: JSON.stringify({status: status, error: err})
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
          email: form.find("#owner-email").val(),
          form:form,
          clearbitMatch: function(data) {
            ResourceLead.companySize = data.companySize;

            webutils.track('Marketing - Lead - Trial Enriched - Clearbit Match');
            ResourceLead.isClearbitMatch = true;
            ResourceLead.nanTrack(['user', 'form_filled', 'lead_trial',
              {'clearbitMatch':true}
            ]);
          },
          notClearbitMatch: function() {
            webutils.track('Marketing - Lead - Trial Enriched - Not Clearbit Match');
            ResourceLead.isClearbitMatch = false;
            ResourceLead.nanTrack(['user', 'form_filled', 'lead_trial',
              {'clearbitMatch':false}
            ]);
          },
          next:redirect,
        })
      }, 210);

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
      (type === 'select' && string === '') || (type === 'password' && string.length < 5)) {

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

  // Shorten the check and NaN event push
  nanTrack: function(val) {
    if (window.NaN_api) NaN_api.push(val);
  }

};

// Init form handler
ResourceLead.init();
