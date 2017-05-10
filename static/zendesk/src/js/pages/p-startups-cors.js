$(document).ready(function(){

  var label = $('form.startup-application label'),
      input = $('form.startup-application input'),
      textarea = $('form.startup-application textarea'),
      select = $('form.startup-application select'),
      $button = $('.submit-application'),
      where = window.location.pathname.split('/'),
      leadType = where[2]; // get lead type from URL for GA event tracking

  $(".radio-other input[type='radio']").on('click', function(){
    if ($(this).is(":checked")){
      $(this).next().next().focus();
    }
  });

  var rainbow = $('.cozy-company').offset().top - 250,
      $window = $(window);

  rainbowInit = false;

  window.setInterval(function(){
    if ($window.scrollTop() >= (rainbow)) {

      if (rainbowInit!==true){
        rainbowInit = true;

        $('.ray1').fadeTo(200, 1, function() {
          $('.ray2').fadeTo(200, 1, function() {
            $('.ray3').fadeTo(200, 1, function() {
              $('.ray4').fadeTo(200, 1, function() {
                $('.ray5').fadeTo(200, 1);
              });
            });
          });
        });
      }
    }
  }, 250);

  unicornInit = false;
  $(".unicorn-feed").click(function() {
    $('html, body').animate({
        scrollTop: $("#apply").offset().top
    }, 1100);
  });

  $("#grab-growth a button").on('mouseover', function(){
    if (unicornInit!==true){
      unicornInit = true;

      $("#unicorn2").fadeTo(200, 1, function(){
        $("#unicorn3").fadeTo(200, 1, function(){
          $("#unicorn4").fadeTo(200, 1, function(){
            $("#unicorn5").fadeTo(200, 1);
          });
        });
      });

    }
  });

  if ($("html").hasClass('ie9')){
    $("input[type='text']").each(function(){
      if ($(this).attr('placeholder').length>0){
        var ph = $(this).attr('placeholder');
        $(this).val(ph);
      }
    });
  }

  // Make sure user tagged as promo in reg flow
  $('.buy-button').attr('href', '/register?promo=startups');

  // Select interaction
  $('form')
      .on('keyup', '.required', function(){
        if ($(this).attr('data-state') === 'active') {
          target = $(this);

          window.clearTimeout(timer);
          timer = setTimeout(function() {
              validateField(target);
          }, 800);
        }
      })
      .on('blur', '.required', function(){
        if ($(this).attr('data-state') != 'active') {
          $(this).attr('data-state', 'active');
        }
        validateField($(this));
      })
      .on('change', 'select', function(){
        var $thisOption = $(this).find("option:selected").val();

        if ($(this).attr('data-state') != 'active') {
          $(this).attr('data-state', 'active');
        }
        validateField($(this));
        $(this)
          .siblings('.select-label')
          .find('.txt')
          .text($thisOption)
          .addClass('set');
      });

    // Form submitted
    $button.click(function(e){
      e.preventDefault();
      setMarketoValuesLeadGen();
      registerLead();
    });

});

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
        // Animate error message
        // Use position for animation to prevent jumping on multi-column forms
        pin.css({
                'opacity' : ((fade === false) ? 1 : 0),
                'left' : '20px',
                'display' : 'block'
            })
            .animate({
                'opacity' : 1,
                'left' : '0px'
            }, 300);

        target.removeClass('set');
        target
            .parent()
            .addClass('error')
            ;
    } else {

        pin.animate({
            'opacity' : 0,
            'margin-left' : '1em'
        }, 200, function(){
            $(this).hide();
            target
                .parent()
                .removeClass('error')
            ;
        });

        target.addClass('set');
    }
}

function registerLead() {
  var form = $('.startup-application'),
      required = form.find('.required');

  for (var i = 0; i < required.length; i++) {
    validateField($(required[i]));
  }

  var delay = setTimeout(function(){
    var form = $('.startup-application');

    if (form.find('.error').length === 0) {
      var region   = $('#region').val(),
          photo    = $('#photo').val(),
          register = false;

      var form = $('.startup-application');

      form.find('.app')
        .animate({ opacity: 0 }, 200)
        .end()
        .find('.loading')
        .show()
        .end();

      $.ajax({
        url: '//www.zendesk.com/app/startups',
        data: form.serialize(),
        type: 'POST',
        complete: function(xhr, textStatus) {
            function showMsg(msg,icon){
              setTimeout(function(){
                var loading = $('.form-startup .loading');

                $('.form-startup ul').css('opacity', 0);

                loading
                    .find('.loading-img')
                    .css({'background-image':icon, 'background-repeat':'no-repeat'})
                    .parent()
                    .find('p')
                    .css({'padding':'20px 20px 0', 'font':'13px/1.35 DNRR'})
                    .html(msg)
                    .parent()
                    .animate({ 'top':11, 'height':240}, 200);
              }, 2000);
            }

            var response = $.parseJSON(xhr.responseText);

            // Run conditional
            if (response.success === true) {
              form.animate({'height':700})
                  .find('.app')
                  .remove()
                  .end()
                  .find('.loading')
                  .animate({ opacity: 0 }, 200);

              $('.promo-code').html(response.coupon);
              $('.success').show();
            } else {
              form.animate({'height':390})
                  .find('.app')
                  .remove()
                  .end()
                  .find('.loading')
                  .animate({ opacity: 0 }, 200, function(){
                      $('.form-startup .loading').remove();
                  });

              $('.failed').show();
            }
          }
        });

        tagUser();

        webutils.createLead('form.startup-application');
        webutils.track('Marketing - Lead - Startup Application');
    }
  }, 200);
}

function setMarketoValuesLeadGen() {
    var visitor  = (typeof activity != 'undefined') ? activity : new Object(),
        frstDate = (typeof activity != 'undefined') ? new Date(visitor.stamp) : new Date(),
        currDate = new Date(),
        db = (typeof dbase != 'undefined') ? dbase : new Object();

    $('input#trial_extras\\[Convertro_SID__c\\]').val($CVO.sid);
    $('input#trial_extras\\[Session_Landing__c\\]').val(visitor.landing);
    $('input#trial_extras\\[Session_Last__c\\]').val(currDate);
    $('input#trial_extras\\[Behavioral_1__c\\]').val(db.industry + '|' + db.sub_industry); // industry | sub industry
    $('input#trial_extras\\[Behavioral_2__c\\]').val(db.revenue_range); // revenue
    $('input#trial_extras\\[Partner_ID__c\\]').val(visitor.ptnr);
    $('input#trial_extras\\[DB_City__c\\]').val(db.city);
    $('input#trial_extras\\[DB_State__c\\]').val(db.state);
    $('input#trial_extras\\[DB_CName__c\\]').val(db.company_name);
    $('input#trial_extras\\[DB_CCode__c\\]').val(db.country);
    $('input#trial_extras\\[DB_Zip__c\\]').val(db.zip);
}

function tagUser() {
  $CVO.push([ 'trackEvent', { type: 'Startup Reg' }]);

  window.optimizely = window.optimizely || [];
  window.optimizely.push(['trackEvent', 'startup_lead']);

  heap.track('Startup App > Applied');

}
