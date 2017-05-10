$(document).ready(function() {
  var $CVO = window.$CVO || [];

  function registerLead() {
    var form     = $('#early-access'),
        required = form.find('.required');

    for (var i = 0; i < required.length; i++) {
      validateField($(required[i]));
    }

    var delay = setTimeout(function(){
      if ($('#early-access ul li.error').length === 0) {
        $('html, body').animate({
          scrollTop: $("#interestFormWrapper").offset().top
        }, 2000);

        $('#early-access .loading').css({ 'display': 'table' });
        $('#early-access ul').animate({ opacity: 0.1 }, 200);

        webutils.createLead('#early-access');
        webutils.track('Marketing - Lead - Message Beta');

        if (window.dataLayer) {
          dataLayer.push({'event': 'message_signup'});
        }

        setTimeout(function(){
          $('#early-access li').css('opacity', 0);
          $('#early-access .loading').addClass('success')
            .find('.loading-img')
            .css({'background-image':'url(//d1eipm3vz40hy0.cloudfront.net/images/signup/icon-checkmark.png)', 'background-repeat':'no-repeat', 'background-position':'50%','background-color':'#fff', 'height':'66px','width':'66px'})
            .parent()
            .find('p')
            .html(successMessage)
            .parent()
            .animate({
              'opacity':1,
              'width':205,
              'left':-1
            }, 200)
            .parent();
          $('#early-access li').animate({ height: 0 }, 1000);
        }, 10000);
      }
    }, 250);
  }

  function validateField(target) {
    var string = target.attr('value'),
        type   = target.attr('type'),
        holder = target.attr('placeholder'),
        pin    = target.parent().find('label'),
        fade   = (pin.css('opacity') === '1') ? false : true,
        valid  = false;

    if ((type === 'text' && (string == '' || string == holder || !/[一-龠]+|[ぁ-ん]+|[ァ-ヴー]+|[a-zA-Z0-9]+|[ａ-ｚＡ-Ｚ０-９]+/.test(string))) ||
      (type === 'email' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(string)) ||
      (type === 'select' && string === '-')) {

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
  }

  /*
   * Listeners
   *
   */

  // form employee faux select switching
  $('#interestFormWrapper select').change(function(){
    $(this).parent()
      .find('.select-label')
      .html(webutils.escapeHTML($(this).find('option:selected').text()) + '<span class="toggle"></span>')
      .addClass('set')
      .parent()
      .removeClass('error');
  });

  // form validation
  $('#interestFormWrapper form')
    .on('keyup', 'input.required', function(){
      if ($(this).attr('data-state') === 'active') {
        target = $(this);

        window.clearTimeout(timer);
        timer = setTimeout(function() {
        validateField(target);
      }, 800);
      }
    })
    .on('blur', 'input.required', function(){
      if ($(this).attr('data-state') != 'active') {
        $(this).attr('data-state', 'active');
      }
      validateField($(this));
    })
    .on('change', 'select', function(){
      if ($(this).attr('data-state') != 'active') {
        $(this).attr('data-state', 'active');
      }
      validateField($(this));
    });

  // form submission
  $('#message-submit').on('click', function(e){
    e.preventDefault();

    webutils.setMAVs(false);

    registerLead();
  });

  // Splits the full name into first and last name
  $('#owner\\[name\\]').on('blur', function(){
    var name = webutils.escapeHTML($(this).val())
      , first = 'unknown'
      , last = 'unknown';

    if (name.lastIndexOf(' ') !== -1) {
      first = name.substr(0, name.indexOf(' '));
      last  = name.substr(name.indexOf(' ') + 1);

      if (last.length === 0)
        last = name;
    } else {
      first = name;
    }

    $('#FirstName').val(first);
    $('#LastName').val(last);
  });
}); // end dom.ready
