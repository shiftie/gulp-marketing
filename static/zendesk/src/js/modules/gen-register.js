var TrialLead = {
  _global: {
    target: '',
    activity: '',
    legacyBrowser: false,
    errorTimer: '',
    domainAttempts: 0,
    lang: {
      selected: 'en',
      register: {
        domaintaken: 'URL Already Taken',
        employees: 'employees',
        checking: 'Checking domain availability...',
        domaininvalid: 'Enter only letters and numbers',
        langselect: 'Your Zendesk will be hosted here, in',
        password: 'Enter at least 5 characters',
        passwordchars: 'Password can contain letters, numbers,<br>and any of the following: !@#$^&amp;*()_+.-'
      }
    }
  },

  /*
   *
   * Validate form elements
   *
   * @params (target:dom element) form element to validate
   *
   */

  validate: function(target) {
    var self = this;
    var string = target.val(),
      type   = target.attr('type'),
      holder = target.attr('placeholder'),
      pin    = target.parent().find('label.error'),
      fade   = (pin.css('opacity') === '1') ? false : true,
      valid  = false;

    if(holder === 'company.zendesk.com') {
      if(string === '' || string === holder) {
        pin.css({
            'display' : 'block',
            'width' : '100%',
            'opacity' : ((fade === false) ? 1 : 0),
            'margin-top' : '-48px'
          })
          .animate({
            'opacity' : 1,
            'margin-top' : '-5px'
          }, 300);

        target.removeClass('set');
        target.parent().addClass('error');
      }
    } else {
      if ((type === 'text' && (string === '' || string === holder || !/[一-龠]+|[ぁ-ん]+|[ァ-ヴー]+|[a-zA-Z0-9]+|[ａ-ｚＡ-Ｚ０-９]+|[АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя]+/.test(string))) ||
      (type === 'email' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(string)) ||
      (type === 'select' && target.find('option:selected').val() === '-') ||
      (type === 'password' && string.length < 5)) {
        pin.css({
            'display' : 'block',
            'width' : '100%',
            'opacity' : ((fade === false) ? 1 : 0),
            'margin-top' : '-48px'
          })
          .animate({
            'opacity' : 1,
            'margin-top' : '-5px'
          }, 300);

        target.removeClass('set');
        target.parent().addClass('error');

        if(type === 'password') {
          pin.html('<span></span>' + self._global.lang.register.password);
          pin.attr('class','error');
        }

        if(target.attr('placeholder') === 'company.zendesk.com') {
          $('label.suggested').hide();
        }
      } else {
        pin.animate({
          'opacity' : 0,
          'margin-top' : '-48px'
        }, 200, function(){
          target.parent().removeClass('error');
        });

        target.addClass('set');
      }
    }
  },

  /*
   *
   * Check if domain is available
   *
   * @params (domain: string)
   * @params (retry: boolean) try to suggest alternative
   *
   */

  domainLookup: function(domain, retry) {
    var self = this;

    $('.create-account').addClass('disabled');

    $.ajax({
      url: '/wp-content/themes/zendesk-twentyeleven/lib/domain-check.php',
      type: 'POST',
      data: 'domain=' + domain,
      cache: false,
      success: function(data) {
        if(typeof data.available != 'undefined' && data.available === 'true') {
          $('input[name="account[subdomain]"]')
            .val(domain)
            .addClass('set');

          $('.shadow').show();
          $('.domain-ping').hide();

          $('.create-account').removeClass('disabled');
          $('.long').removeClass('disabled');

          setTimeout(function(){
            self.domainTrail();
          }, 300);
        } else {
          if(retry) {
            var altDomain = self.domainSuggest(domain);

            if(domain != false) {
              setTimeout(function(){
                self.domainLookup(altDomain, true);
              }, 1000);
            }
          } else {
            var target = $('li.domain');

            $('.long').addClass('disabled');

            target
              .find('label.error')
              .html('<span></span>' + self._global.lang.register.domaintaken);

            self.showError(target);
            $('.domain-ping').hide();
          }
        }
      }
    });
  },

  /*
   *
   * Suggest an available domain name
   *
   * @params (company: string)
   *
   */

  domainSuggest: function(company) {
    var self = this;

    if(self._global.domainAttempts < 4) {
      var num = company.substr(company.length - 1);

      if(!isNaN(parseFloat(num)) && isFinite(num)) {
        company = company.substr(0, company.length - 1) + Math.floor(Math.random()*100+1);
      } else {
        company += '1';
      }
    } else {
      company = false;
    }

    self._global.domainAttempts++;

    return company;
  },

  /*
   *
   * Show error for targeted form field
   *
   * @params (target:dom element) form field
   *
   */

  showError: function(target) {
    var self = this,
        pin  = target.parent().find('label'),
        fade = (pin.css('opacity') === '1') ? false : true;

    pin.css({
        'display' : 'block',
        'width' : '100%',
        'opacity' : ((fade === false) ? 1 : 0),
        'margin-top' : '-48px'
      })
      .animate({
        'opacity' : 1,
        'margin-top' : '-5px'
      }, 300);

    target.removeClass('set');
    target.parent().addClass('error');
  },

  register: function(form) {
    var self  = this,
        name  = $('input#owner\\[name\\]').val(),
        names = name.indexOf(' ');

    if(names === -1) {
      $('#FirstName').attr('value', name);
      $('#LastName').attr('value', name);
    } else {
      $('#FirstName').attr('value', name.substr(0, names));
      $('#LastName').attr('value', name.substr(names + 1, name.length));
    }

    var timeOffset = (new Date()).getTimezoneOffset() / 60 * (-1),
        domain     = $('input[name="account[subdomain]"]'),
        phone      = $('input[name="address[phone]"]');

    domain.val(domain.val().replace(/www./g,''));
    domain.val(domain.val().replace(/http:\/\//g,''));

    phone.val(phone.val().replace(/[^0-9]/g, ''));

    if (phone.val() === '')
      phone.val('Unknown');

    if ($("input[name='account[utc_offset]']").length == 0) {
      form.prepend('<input type="hidden" name="account[utc_offset]" value="' + timeOffset + '" />');
    }

    $.ajax({
      url: '/app/accounts.json' + ((self._global.legacyBrowser) ? '?force_classic=true&' : '?'),
      data: form.serialize(),
      type: 'POST'
    }).done(
      function(data) {
        self.parseResponse(data);
      }
    );
  },

  parseResponse: function(response) {
    var self = this;
    var form = $('form.reg'),
        href = location.href.split('/'),
        plan = (href[href.length-1] === '') ? href[href.length-2] : href[href.length-1];

    plan = (plan.indexOf('register') === -1) ? plan : 'trial';

    if(response.success) {
      try{
          webutils.addTrialHomeCookie(); // check if user came from homepage
          webutils.postToEloqua('form.reg'); // send form data to eloqua
          webutils.track('Landing Page Trial > Converted'); // track conversion
      } catch(e) { }

      form.after('<iframe style="display:none;" src="/public/assets/html/account-creation-tracking.html"></iframe>');

      // redirect timer
      setTimeout(function() {
        if(plan === 'starter#details') {
          window.location = response.right_away_link + '?plan_redirect=small';
        } else if(plan === 'regular#details') {
          window.location = response.right_away_link + '?plan_redirect=medium';
        } else if(plan === 'plus#details') {
          window.location = response.right_away_link + '?plan_redirect=large';
        } else if(plan === 'enterprise#details') {
          window.location = response.right_away_link + '?plan_redirect=extra_large';
        } else {
          window.location = response.right_away_link;
        }
      }, 4000);

      ga('send', 'pageview', '/lead/trial'); // send page view for path analysis
    } else {
      setTimeout(function(){
        var curr = $('.step.step-4'),
            next = $('.step.step-1');

        $('.check').css('opacity', 0);

        curr.animate({ 'opacity': 0 }, 300, function(){
          $(this).hide();
        });

        next.css({'opacity':0.5, 'margin-left':250, 'display':'block'})
            .animate({'margin-left':0, 'opacity':1}, 400, 'easeInCirc');
      }, 1000);

      $.each(response.errors, function (index, value) {
        var ident  = ['subdomain', 'company', 'name', 'email', 'password'],
            len    = ident.length,
            errors = [];

        if(value.toLowerCase().indexOf('jurisdiction') === -1) {
          for(var i = 0; i < len; i++) {
            if(value.toLowerCase().indexOf(ident[i]) === 0) {
              if(ident[i] === 'subdomain') {
                $('label.suggested').hide();

                if(value.indexOf('3') != -1) {
                  $('label.url').html(self._global.lang.register.domaininvalid);
                } else {
                  $('label.url').html(self._global.lang.register.domaintaken);
                }
              }

              var target = form.find('.' + ident[i]),
                pin = target.parent().find('label.error');

              target.parent().addClass('error');

              pin.css({
                  'display' : 'block',
                  'width' : '100%',
                  'opacity' : 0,
                  'margin-left' : '1em'
                })
                .animate({
                  'opacity' : 1,
                  'margin-left' : '0'
                }, 300);

              target.parent().addClass('error');
            }
          }
        } else {
          $('form').html('<h1 style="font: 22px/1 DNRM; text-transform: uppercase; color: rgb(199, 19, 19); margin-top:10px;">Unable to create account</h1><h3 style="margin-bottom:22px;">In compliance with U.S. economic sanctions laws and regulations, we are unable to set up a Zendesk account for visitors in your region. If you feel like you\'ve recieved this notification in error please contact our support department <a href="mailto:support@zendesk.com">support@zendesk.com</a>');
        }
      });
    }
  },

  /*
   *
   * Set the default help desk language in the signup form
   * based on the accept-language headers
   *
   */

  setLang: function() {
    var self = this;

    $.ajax({
      url: '/wp-content/themes/zendesk-twentyeleven/lib/lang.php',
      dataType: 'jsonp',
      success:  function(data) {
        var lang = $('#' + data.lang);

        lang.attr('selected', true);

        $('#selected-lang a').html(lang.text() + '<span></span>');
      }
    })
  },

  updateContent: function(state) {
    var self = this;

    if(state === 'company') {
      var curr = $('.step.step-2'),
          next = $('.step.step-1');

      $('html, body').animate({ scrollTop: 0 }, 'slow');
      $('.step-1 .check').css({'opacity':0, 'z-index':-1});

      curr.animate({'margin-left':350, 'opacity':0, 'filter':'alpha(opacity=0)'}, 350, function(){
        curr.css({'display':'none'});
      });

      next.css({'opacity':0.5, 'margin-left':-200, 'display':'block'})
        .animate({'margin-left':0, 'opacity':1}, 300);

      $('.js-progress span.active').html('1');
    }
  },

  init: function() {
    $CVO = window.$CVO || [];

    var self = this,
        trial = $('#trial'),
        marketo = false,
        modal = $('form.reg');

    // form submission;
    $('.create-account').click(function(){
      var plan = $(this).attr('data-plan'),
          required = $('.required');

      if(!$(this).hasClass('disabled')) {
        for(var i = 0;i < required.length; i++) {
          self.validate($(required[i]));
        }

        if($('.reg li.error').length === 0) {

          $('.pitch, .step.step-3').animate({
            'opacity': 0
          }, 300, function(){
            $(this).hide();

            var next = $('.step.step-4'),
                path = $('span.path');

            path.html($('input[name="account[subdomain]"]').val() + '.zendesk.com');

            next.css({'opacity':0.5, 'display':'block'})
              .animate({ 'opacity':1 }, 400, 'easeInCirc');
          });

          //register account
          webutils.setMAVs(self._global.activity, $CVO, true);
          self.register($('form.reg'));
        }
      }

      return false;
    });

    // second page of reg form
    $('a.next').click(function(){
      var target = $('div.' + $(this).attr('data-parent')),
          required = target.find('.required');

      for(var i = 0;i < required.length; i++) {
        self.validate($(required[i]));
      }

      var delay = setTimeout(function(){
        if($('.reg li.error').length === 0) {
          var checks = target.find('.check'),
              delay = 150;

          target.find('li:nth-child(1) .check')
            .css({'top':33, 'opacity':0, 'z-index':2})
            .animate({'opacity':1, 'top':28}, 50);

          for(var i = 2;i < (checks.length + 1); i++) {
            target.find('li:nth-child(' + i + ') .check')
              .delay(delay*i)
              .css({'top':33, 'opacity':0, 'z-index':2})
              .animate({'opacity':1, 'top':28}, 100);

            delay += 50;
          }

          self.domainTrail();

          setTimeout(function(){
            var curr = target,
                next = target.next();

            curr.animate({'margin-left':-550, 'opacity':0}, 350, function(){
              $(this).hide(); // ie8
            });

            next.css({'opacity':0.5, 'margin-left':200, 'display':'block'})
              .animate({'margin-left':0, 'opacity':1}, 300);

            $('.js-progress span.active').html('2');
          },1500);
        }
      }, 210);

      return false;
    });

    $("input#account\\[subdomain\\]")
      .on('input', function(){
        self.domainTrail();
      })
      .on('focus', function(){
        $('.domain-ping').hide();
        $('.create-account').addClass('disabled');
      })
      .on('blur', function(){
        var domain = $(this).val();

        if(domain != '' && domain.length > 2) {
          var available = self.domainLookup(domain),
              ping = $(this).parent().find('label.suggested');

          $(this).parent().find('label.error').hide();

          $('.domain-ping').show();
        }
      });

    $('input#account\\[name\\]').blur(function () {
      var domain = (webutils.escapeHTML($(this).val()).toLowerCase().replace(/[^a-zA-Z0-9]/g,'')).replace(/20/g, '');

      if(domain != '' && domain.length > 2) {
        self.domainLookup(domain, true);
      }
    });

    if(self._global.lang.selected === 'en') {
      self.setLang();
    }

    if($('html.no-pass-type').length > 0) {
      $('.ie-password-label').show().css('text-indent','0').on('click', function(){
        $(this).hide();
        modal.find('.password').trigger('focus');
      });

      modal.find('.password').on('focus', function(){
        $('.ie-password-label').hide();
      })
    }

    $('select[name="account[help_desk_size]"]')
      .hover(function(){
        $(this).parent().find('span.select').addClass('hover');
      }, function(){
        $(this).parent().find('span.select').removeClass('hover');
      })
      .on('focus', function(){
        $(this).parent().find('span.select').addClass('focus');
      })
      .on('blur', function(){
        $(this).parent().find('span.select').removeClass('focus');
      })
      .change(function(){
        $('#select-employees')
          .html(webutils.escapeHTML($(this).val()) + ' ' + self._global.lang.register.employees + '<span></span>')
          .addClass('set')
          .parent()
          .attr('class','');

        self.validate($(this));
      });

      $('#language').change(function(){
        $('#selected-lang a').html($(this).find('option:selected').text() + '<span></span>');
      });

      $('#refer').change(function(){
        $('#selected-refer a').html($(this).find('option:selected').text() + '<span></span>');
      });

      $('form.reg')
        .on('keyup', 'input.required', function(){
          if($(this).attr('data-state') === 'active') {
            _target = $(this);

            window.clearTimeout(self._global.errorTimer);
            self._global.errorTimer = setTimeout(function() {
              self.validate(_target);
            }, 800);
          }
        })
        .on('focus', 'input.required', function(){
          $(this).addClass('focus');
        })
        .on('blur', 'input.required', function(){
          if($(this).attr('data-state') != 'active') {
            $(this).attr('data-state', 'active');
          }

          $(this).removeClass('focus');

          self.validate($(this));
        });

      $('.phone').on('blur', function(){
        if($(this).val() != '' && $(this).val() != 'Phone')
          $(this).addClass('set');
        else
          $(this).removeClass('set');
      });

      $('.shadow').on('click', function(){
        $(this).parent().find('input').focus();
      });

    $('input#owner\\[email\\]').bind('keypress', function (event) {
      var regex  = new RegExp("[a-zA-Z0-9@+._-]"),
        key    = String.fromCharCode(!event.charCode ? event.which : event.charCode),
        spec   = (event.charCode != event.which);

      if (event.charCode != 0 && event.which != 0 && !regex.test(key)) {
        event.preventDefault();

        self.showError($(this));

        return false;
      }
    });

    $('input#account\\[subdomain\\]').bind('keypress', function (event) {
      var regex = new RegExp("[a-zA-Z0-9]"),
          key = String.fromCharCode(!event.charCode ? event.which : event.charCode),
          spec   = (event.charCode != event.which);

      if (event.charCode != 0 && event.which != 0 && !regex.test(key)) {
        event.preventDefault();

        self.showError($(this));

        return false;
      }
    });

    self._global.legacyBrowser = ($('#unsupported').length > 0);

    $(window).load(function(){
      setTimeout(function(){
        self._global.activity = webutils.gauge();
      }, 4000);
    });
  }, //end init

  domainTrail: function() {
    var self    = this,
        shadow  = $('.shadow'),
        target  = $('input[name="account[subdomain]"]');

    $('#phantom').html(webutils.escapeHTML(target.val()));

    if(target.val().length > 0) {
      var width = webutils.calcTextWidth($('#phantom')) + 20,
          distance = shadow.css('left'),
          offset = width + 'px';

      if(distance.length >= 5 && Number(distance.substr(0, 3)) > 240) {
        shadow
          .show()
          .css({'left': offset })
          .hide();
      } else {
        shadow
          .show()
          .css({'left': offset});
      }
    } else {
      shadow.hide();
    }
  }
};

$(function(){
  TrialLead.init();
})
