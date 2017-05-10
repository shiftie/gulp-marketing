 /*
  *
  * Form logic for gated content lead gen
  *
  */

var ResourceLead = {
  init: function() {
    var self = this;

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
      webutils.setMAVs(activity, $CVO, false);
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
        $('#resource-lead .loading').css({'display':'table'});
        $('#resource-lead ul').animate({ opacity: 0.1 }, 200);

        webutils.createLead('#resource-lead');
        webutils.track('Marketing - Lead - Content Download');

        if (window.dataLayer) {
          dataLayer.push({'event': 'resources_form_submit'});
        }

        var size = $('select[name="account[help_desk_size]"]').val();
        if (size && size !== '-') {
          webutils.trackMarinContentConversion(size, 'Content', 'content_download');
        }

        setTimeout(function(){
          $('#resource-lead .loading-inner').css({'display':'none'});
          $('#resource-lead .loading .success').css({'display':'table-cell'});
        }, 10000);

      }
    }, 210);
  },

  showGatedContent: function() {
    $('#resource-lead .loading').css({'display':'table'});
    $('#resource-lead ul').animate({ opacity: 0.1 }, 200);
    $('#resource-lead .loading-inner').css({'display':'none'});
    $('#resource-lead .loading .success').css({'display':'table-cell'});
  },

  tagUser: function() {
    var self      = this,
        form      = $('.form-lead'),
        employees = form.find('select[name="account[help_desk_size]"]').val(),
        host      = location.hostname.substr(location.hostname.indexOf('.') + 1),
        segment   = webutils.convertRangeToSegment(employees),
        visitor;

    $CVO.push([ 'trackEvent', { type: 'Landing Page - Download' }]);

    //_gaq.push(['_trackEvent', 'Lead - Landing Page', 'Registered']);
    //_gaq.push(['_trackPageview', '/lead/landing-page-download']);
    ga('send', 'event', 'Lead - Landing Page', 'Registered');
    ga('send', 'pageview', '/lead/landing-page-download');

    window.optimizely = window.optimizely || [];
    window.optimizely.push(['trackEvent', 'landing_page_download']);
  }
}; // end module

// Init form handler
ResourceLead.init();
