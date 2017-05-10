
var ConnectPage = {

  init: function() {
    var self = this
      , isIE8 = $('html').hasClass('ie8');


    // if not a mobile device, make these available
    if (!_isMobile && !isIE8) {
      var s = skrollr.init({
        forceHeight: false
      });
    }

    // Make the right touch static for iPads
    if (_isMobile && window.innerWidth >= 768) {
      $(".arms-still").css("display", "block");
      $(".arms-container-inner").css("display", "none");
    }

    if ($("#bodymovin").length && !_isMobile) {
      ConnectPage.bodymovinTop = $(".right-place-right-time").offset().top - (window.innerHeight/3);
      ConnectPage.anim = bodymovin.loadAnimation(ConnectPage.animData);

      ConnectPage.flyBird = function(){
        if (window.pageYOffset >= ConnectPage.bodymovinTop) {
          ConnectPage.animBird = bodymovin.loadAnimation(ConnectPage.animBirdData);
          $(window).off("scroll", ConnectPage.flyBird);
        }
      };
      $(window).on("scroll", ConnectPage.flyBird);
    }

    // for the sticky nav
    $(window).scroll(function() {
      var topper = $(document).scrollTop()
        , offsetter = $('.nav-offsetter').offset().top;

      if (topper > offsetter) {
        $('.nav-sticky-menu').addClass('nav-fixed');
      } else {
        $('.nav-sticky-menu').removeClass('nav-fixed');
      }
    });

    function registerLead() {
    var form     = $('#early-access-connect'),
        required = form.find('.required');

    for (var i = 0; i < required.length; i++) {
      validateField($(required[i]));
    }

    var delay = setTimeout(function(){
      if ($('#early-access-connect ul li.error').length === 0) {
        $('html, body').animate({
          scrollTop: $("#interest").offset().top
        }, 2000);

        $('#early-access-connect .loading').css({ 'display': 'table' });
        $('#early-access-connect ul').animate({ opacity: 0.1 }, 200);

        webutils.createLead('#early-access-connect');
        webutils.track('Marketing - Lead - Connect Beta');

        if (window.dataLayer) {
          dataLayer.push({'event': 'connect_signup'});
        }

        setTimeout(function(){
          $('#early-access-connect li').css('opacity', 0);
          $('#early-access-connect .loading').addClass('success')
            .find('.loading-img')
            .css({'background-image':'url(//d1eipm3vz40hy0.cloudfront.net/images/signup/icon-checkmark.png)', 'background-repeat':'no-repeat', 'background-position':'50%','background-color':'#fff', 'height':'66px','width':'66px'})
            .parent()
            .find('p')
            .html($("#connect-early-access-success > span"))
            .parent()
            .animate({
              'opacity':1,
              'width':205,
              'left':-1
            }, 200)
            .parent();
          $('#interest .access-description').hide();
          $('#early-access-connect li').animate({ height: 0 }, 1000);
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
    // only show subdomain field if they're a customer/trialer
    if (target.hasClass('customer')) {
      if (target.children('option:selected').val() !== 'No') {
        $('.subdomain-field').show();
        $('.company-subdomain').addClass('required');
      }
      else {
        $('.subdomain-field').hide();
        $('.company-subdomain').removeClass('required').parent().removeClass('error');
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
    $('#connect-submit').on('click', function(e){
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

    function getTargetTop(target){
      var id = target.attr("href"),
        offset = 90;

      return $(id).offset().top - offset;
    }

    $('.btn-sign-up').click(function(e) {
      e.preventDefault();
      var target = getTargetTop($(this));
      $('html, body').animate({scrollTop:target + 55}, 650);
      setTimeout(function() {
        document.getElementById("owner\[name\]").focus();
      }, 651);
    });
  }
};
