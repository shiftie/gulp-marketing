 /*
  *
  * Form logic for resources lead gen
  *
  */

var ResourceLead = {
  init: function() {
    var self = this;
    var geoResolved = false;

    // Listeners
    $('#resource-lead')
      .on('keyup', '.required', function(){
        if($(this).attr('data-state') === 'active') {
          target = $(this);

          window.clearTimeout(timer);
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
      .on('change', 'select', function(){
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
      self.registerLead();
    });

    // Check for ungating param
    var ungated = (webutils.getURLParameter('ungated'));

    if(ungated === 'true') {
      self.showGatedContent();
    }
  },

  validateField: function(target) {
    var self   = this,
        string = target.attr('value'),
        type   = target.attr('type'),
        holder = target.attr('placeholder'),
        pin    = target.parent().find('label'),
        fade   = (pin.css('opacity') === '1') ? false : true,
        valid  = false;

    if((type === 'text' && (string == '' || string == holder || !/[一-龠]+|[ぁ-ん]+|[ァ-ヴー]+|[a-zA-Z0-9]+|[ａ-ｚＡ-Ｚ０-９]+/.test(string))) ||
      (type === 'email' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(string)) ||
      (type === 'select' && string === '-')) {

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

  showGatedContent: function() {
    $('#reg').hide();
    $('.download-it').removeClass('button-disabled');
    $('.resource-body-content').css('margin-top',0).show();
    $('#see-all').hide();
  },

  registerLead: function() {
    var self     = this,
        form     = $('#resource-lead'),
        required = form.find('.required'),
        name     = form.find('#owner\\[name\\]').val();

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
        $('#resource-lead .loading').css({'display':'table'});
        $('#resource-lead ul').animate({ opacity: 0.1 }, 200);

        webutils.createLead('#resource-lead', false);
        webutils.track('Marketing - Lead - Content Download');

        self.tagUser();

        if (window.dataLayer) {
          dataLayer.push({'event': 'resources_form_submit'});
        }

        var size = $('select[name="account[help_desk_size]"]').val();
        if (size && size !== '-') {
          webutils.trackMarinContentConversion(size, 'Content', 'content_download');
        }

        setTimeout(function(){
          $('.download-it').attr('class','download-it button button-white');
          $('.form-lead .loading')
            .parent() // form
            .parent() // div.form-wrap
            .parent() // div.reg
            .hide();

          $('.resource-body-teaser')
            .css('opacity','.3')
            .siblings('.resource-body-content')
            .show()
            .css({
              'opacity' : '0',
              'border-top' : '1px solid #dfdfdf',
              'padding-top' : '30px'
            })
            .animate({
              'opacity':'1',
              'margin-top':'0px'
            }, 600, 'swing');

        }, 10000);
      }
    }, 250);
  },

  tagUser: function() {
    var self      = this,
        form      = $('.form-lead'),
        employees = form.find('#zd_num_employees__c').val(),
        host      = location.hostname.substr(location.hostname.indexOf('.') + 1),
        segment   = webutils.convertRangeToSegment(employees),
        visitor;

    if(window.location.href.indexOf('webinar') != -1) {
      $CVO.push([ 'trackEvent', { type: 'Webinar Reg-Download' }]);

      ga('send', 'event', 'Lead - Webinar', 'Registered');
      ga('send', 'pageview', '/lead/webinar');

      if (window.dataLayer) {
        dataLayer.push({'event': 'webinar_signup'});
      }

      window.optimizely = window.optimizely || [];
      window.optimizely.push(['trackEvent', 'webinar_lead']);
    } else {
      $CVO.push([ 'trackEvent', { type: 'Whitepaper Download' }]);

      ga('send', 'event', 'Lead - Whitepaper', 'Registered');
      ga('send', 'pageview', '/lead/whitepaper');

      if (window.dataLayer) {
        dataLayer.push({'event': 'resources_form_submit'});
      }

      window.optimizely = window.optimizely || [];
      window.optimizely.push(['trackEvent', 'whitepaper_lead']);
    }
  }
}; // end module
