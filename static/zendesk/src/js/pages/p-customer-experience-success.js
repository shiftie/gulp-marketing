var CustExpMicrosite = {

  init: function() {
    var self = this,
        isIE8 = $('html').hasClass('ie8');

    // send cust domain to Heap
    webutils.trackIntent('CustExpSuccess');

    // if not a mobile device, make these available
    if (!_isMobile && !isIE8) {
      var s = skrollr.init({
        forceHeight: false
      });
    }

    // for the sticky nav
    $(window).scroll(function() {
      var offsetter = $('.nav-offsetter').offset().top
        , viewportHeight = $(window).height()
        , topper = $(document).scrollTop()
        , scroll = offsetter-viewportHeight-topper
        , menu_height = - $('.nav-sticky-menu').height();

      if (scroll < menu_height) {
        $('.nav-sticky-menu').addClass('nav-scroll');
      } else {
        $('.nav-sticky-menu').removeClass('nav-scroll');
      };
      if (topper > offsetter) {
        $('.nav-sticky-menu').addClass('nav-fixed').removeClass('nav-scroll');
      } else {
        $('.nav-sticky-menu').removeClass('nav-fixed');
      };
    });

    $(window).scroll();

    function registerLead() {
    var form     = $('#form-customer-experience'),
        required = form.find('.required');

    for (var i = 0; i < required.length; i++) {
      validateField($(required[i]));
    }

    var delay = setTimeout(function(){
      if ($('#form-customer-experience ul li.error').length === 0) {
        $('html, body').animate({
          scrollTop: $("#interest").offset().top
        }, 2000);

        $('#form-customer-experience .loading').css({ 'display': 'table' });
        $('#form-customer-experience ul').animate({ opacity: 0.1 }, 200);

        webutils.createLead('#form-customer-experience');
        webutils.track('Marketing - Lead - Customer Experience');

        setTimeout(function(){
          $('#form-customer-experience li').css('opacity', 0);
          $('#form-customer-experience .loading').addClass('success')
            .find('.loading-img')
            .css({'background-image':'url(//d1eipm3vz40hy0.cloudfront.net/images/signup/icon-checkmark.png)', 'background-repeat':'no-repeat', 'background-position':'50%','background-color':'#fff', 'height':'66px','width':'66px'})
            .parent()
            .find('p')
            .html($("#form-customer-experience-success > span"))
            .parent()
            .animate({
              'opacity':1,
              'width':205,
              'left':-1
            }, 200)
            .parent();
          $('#interest .reach-text').hide();
          $('#form-customer-experience li').animate({ height: 0 }, 1000);
        }, 10000);
      }
    }, 250);
  }

  function resetField(target) {
    var pin    = target.parent().find('label');
    pin.animate({
      'opacity' : 0,
      'margin-left' : '1em'
    }, 200, function(){
      $(this).hide();
      target
        .parent()
        .removeClass('error');
    });
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
      resetField(target);
      target.addClass('set');
    }
    // only show subdomain field if they're a customer/trialer
    if (target.hasClass('customer')) {
      var selected = target.children('option:selected').val();
      if (selected !== 'No' && selected !== '-') {
        $('.extended-field').hide();
        $('.extended-input').removeClass('required');
        resetField($('.extended-input'));
        $('.subdomain-field').show();
        $('.company-subdomain').addClass('required');
      }
      else {
        $('.subdomain-field').hide();
        $('.company-subdomain').removeClass('required');
        resetField($('.company-subdomain'));
        if (selected === '-') {
          $('.extended-field').hide();
          $('.extended-input').removeClass('required');
          resetField($('.extended-input'));
          return;
        }
        $('.extended-field').show();
        $('.extended-input').addClass('required');
      }
    }
  }

  /*
   * Listeners
   *
   */

  // form employee faux select switching
  $('#interest select').change(function(){
    $(this).parent()
      .find('.select-label')
      .html(webutils.escapeHTML($(this).find('option:selected').text()) + '<span class="toggle"></span>')
      .addClass('set')
      .parent()
      .removeClass('error');
  });

  // form validation
  $('#interest form')
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
    $('#cust-exp-submit').on('click', function(e){
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

    $('.anchor-link').on('click', function(event){
      var element = this;
      var elementClick = $(element).attr('href');
      var destination = $(elementClick).offset().top;
      $('html,body').animate({ scrollTop: destination}, 650);
      //Stop links default events
      event.preventDefault();
      return false;
    });
  }
};
