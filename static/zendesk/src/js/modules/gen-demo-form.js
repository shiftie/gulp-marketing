/*
 * Register demo lead
 *
 * Optional dependency:
 * - /public/assets/js/bizo.js
 *
 * Custom events:
 * - `submit-executed` : when validation on all inputs pass and submit event executes.
 */

$(document).ready(function() {
  var $CVO = window.$CVO || [];
  window.dbase = window.dbase || {};

  webutils.setMAVs(false);

  function registerLead(form) {
    webutils.createLead(form);
    webutils.track('Marketing - Lead - Demo Request');

    if (window.dataLayer) {
      dataLayer.push({'event': 'demo_submit'});
    }

    var size = $('select[name="account[help_desk_size]"]').val();
    if (size && size !== '-') {
      webutils.trackMarinContentConversion(size, 'Demo', 'demo_request');
    }

    $CVO.push([ 'trackEvent', { type: 'Demo Request' }]);

    ga('send', 'event', 'Lead - Demo Request', 'Registered');
    ga('send', 'pageview', '/lead/demo');

    window.optimizely = window.optimizely || [];
    window.optimizely.push(['trackEvent', 'demo_lead']);

    form.find('.loading').css({ 'display': 'table' });
    form.find('ul').animate({ opacity: 0.1 }, 200);
  }

  function validateField(target) {
    var string = target.attr('value'),
        type   = target.attr('type'),
        holder = target.attr('placeholder'),
        pin    = target.parent().find('label'),
        fade   = (pin.css('opacity') === '1') ? false : true
        isInvalid = (type === 'text' && (string == '' || string == holder || !webutils.utf8AlphaNum.test(string))) ||
          (type === 'email' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(string)) ||
          (type === 'select' && string === '-');

    if(isInvalid) {

      pin.css({
        'opacity' : ((fade === false) ? 1 : 0),
        'display' : 'block'
      })
      .animate({
        'opacity' : 1
      }, 300);

      target
        .removeClass('set')
        .parent()
        .addClass('error');
    } else {
      pin.animate({
        'opacity' : 0
      }, 200, function(){
        $(this).hide();
        target
          .parent()
          .removeClass('error');
      });

      target.addClass('set');
    }

    return ! isInvalid;
  }

  function collapse(form) {
    setTimeout(function(){
      form.find('li').css('opacity',0);
      form.find('.loading')
        .find('.loading-img')
        .css({'background-image':'url(//d1eipm3vz40hy0.cloudfront.net/images/signup/icon-checkmark.png)', 'background-repeat':'no-repeat', 'background-position':'50%','background-color':'transparent', 'height':'66px','width':'66px'})
        .parent()
        .find('p')
        .html('')
        .parent()
        .animate({
          'opacity':1,
          'width':205
        }, 200)
        .parent();
    }, 3000);

    setTimeout(function(){
      form.closest('article').animate({height: "0"}, 800);
    }, 4000);
  }

  /*
   * Listeners
   *
   */

  // Safari and IE color gradient hack
  if( (document.all && window.XMLHttpRequest) || (!!navigator.userAgent.match(/safari/i) && !navigator.userAgent.match(/chrome/i) && typeof document.body.style.webkitFilter !== "undefined")) {
    $('body').addClass('safari');
  }

  // Demo form validation
  $('#demo-request')
    .on('keyup', 'input.required', function(){
      if($(this).attr('data-state') === 'active') {
        target = $(this);

        window.clearTimeout(timer);
        timer = setTimeout(function() {
        validateField(target);
      }, 800);
      }
    })
    .on('blur', 'input.required', function(){
      if($(this).attr('data-state') != 'active') {
        $(this).attr('data-state', 'active');
      }
      validateField($(this));
    })
    .on('change', '[name="owner\\[name\\]"]', function(){
      // Splits the full name into first and last name
      var name = webutils.escapeHTML($(this).val())
        , first = 'unknown'
        , last = 'unknown';

      if(name.lastIndexOf(' ') !== -1) {
        first = name.substr(0, name.indexOf(' '));
        last  = name.substr(name.indexOf(' ') + 1);

        if(last.length === 0)
          last = name;
      } else {
        first = name;
      }

      $('#FirstName').val(first);
      $('#LastName').val(last);
    })
    .on('change', 'select', function(){
      if($(this).attr('data-state') != 'active') {
        $(this).attr('data-state', 'active');
      }
      validateField($(this));

      $(this)
        .siblings('.select-label')
        .html(webutils.escapeHTML($(this).find('option:selected').text()) + '<span class="toggle"></span>')
    })
    .on('submit', function(e) {
      e.preventDefault();

      var form = $(this);

      var isValid = true;
      form.find('.required').each(function() {
        isValid = validateField($(this)) && isValid; // don't reverse operands
      })
      if (! isValid) {return}

      registerLead(form);

      collapse(form);

      form.trigger('submit-executed'); // custom event
    });

}); // end dom.ready
