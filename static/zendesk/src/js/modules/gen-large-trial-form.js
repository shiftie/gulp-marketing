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
     * Validate form elements
     *
     * @params (target:dom element) form element to validate
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
                if (target.parent().hasClass('error')) return;

                pin.css({
                    'display' : 'block',
                    'width' : 'auto',
                    'opacity' : ((fade === false) ? 1 : 0),
                    'margin-top' : '-40px'
                }).animate({
                    'opacity' : 1,
                    'margin-top' : '-5px'
                }, 300);

                target.removeClass('set');
                target.parent().addClass('error');
            }
        } else {
            if ((type === 'text' && (string === '' || string === holder || !/[一-龠]+|[А-Яа-я]+|[ぁ-ん]+|[ァ-ヴー]+|[a-zA-Z0-9]+|[ａ-ｚＡ-Ｚ０-９]+/.test(string))) ||
            (type === 'email' && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(string)) ||
            (type === 'select' && target.find('option:selected').val() === '-') ||
            (type === 'password' && string.length < 5)) {
                if (target.parent().hasClass('error')) return;

                pin.css({
                    'display' : 'block',
                    'width' : 'auto',
                    'opacity' : ((fade === false) ? 1 : 0),
                    'margin-top' : '-40px'
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
                    'margin-top' : '-40px'
                }, 200, function(){
                    target.parent().removeClass('error');
                });

                target.addClass('set');
            }
        }
    },

    /*
     * Check if domain is available
     *
     * @params (domain: string)
     * @params (retry: boolean) try to suggest alternative
     */
    domainLookup: function(domain, retry) {
        var self = this;

        $('.create-account').addClass('disabled');

        var successHandler = function(data) {
            if(typeof data.available === 'undefined') return;

            if (data.available === 'true') {
                $('input[name="account[subdomain]"]')
                    .val(domain)
                    .addClass('set');

                $('.shadow').show();
                $('.domain-ping').hide();

                $('.create-account').removeClass('disabled');
                $('.long').removeClass('disabled');
                $('li.domain').removeClass('error');

                self.domainTrail();
            } else {
                if(retry) {
                    if (!domain) return;

                    setTimeout(function(){
                        self.domainLookup(self.domainSuggest(domain), true);
                    }, 1000);
                } else {
                    var target = $('li.domain');

                    $('.long').addClass('disabled');

                    target
                        .find('label.error')
                        .html('<span></span>' + self._global.lang.register.domaintaken);

                    self.showError($('li.domain input'));
                    $('.domain-ping').hide();
                }
            }
        };

        var errorHandler = function() {
            setTimeout(function(){
                self.domainLookup(domain);
            }, 5000);
        };

        $.ajax({
            url: '/wp-content/themes/zendesk-twentyeleven/lib/domain-check.php',
            type: 'POST',
            data: 'domain=' + domain,
            cache: false,
            success: successHandler,
            error: errorHandler
        });
    },

    /*
     * Suggest an available domain name
     *
     * @params (company: string)
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
     * Show error for targeted form field
     *
     * @params (target:dom element) form field
     */
    showError: function(target) {
        var pin  = target.parent().find('label'),
            fade = (pin.css('opacity') === '1') ? false : true;

        pin.css({
            'display' : 'block',
            'width' : 'auto',
            'opacity' : ((fade === false) ? 1 : 0),
            'margin-top' : '-40px'
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
            phone.val('-');

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

        if (response.success) {
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
                                    'width' : 'auto',
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
     * Determine if it's currently DST
     *
     * @returns (boolean) TRUE for DST
     */
    isDST: function() {
        var self = this;
        var today = new Date(),
            jan = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0),
            jul = new Date(today.getFullYear(), 6, 1, 0, 0, 0, 0),
            temp = jan.toGMTString(),
            jan_local = new Date(temp.substring(0, temp.lastIndexOf(" ")-1)),
            temp = jul.toGMTString(),
            jul_local = new Date(temp.substring(0, temp.lastIndexOf(" ")-1)),
            hoursDiffStdTime = (jan - jan_local) / (1000 * 60 * 60),
            hoursDiffDaylightTime = (jul - jul_local) / (1000 * 60 * 60);

       return hoursDiffDaylightTime != hoursDiffStdTime;
    },

    /*
     * Set the default help desk language in the signup form
     * based on the accept-language headers
     */
    setLang: function() {
        $.ajax({
            url: '/wp-content/themes/zendesk-twentyeleven/lib/lang.php',
            dataType: 'jsonp',
            success:  function(data) {
                var lang = $('#' + data.lang);

                lang.attr('selected', true);

                $('#selected-lang a').html(lang.text() + '<span></span>');
            }
        });
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

                if($('#register li.error').length === 0) {
                    var next = $('.building'),
                        path = $('span.path');

                    path.html($('input[name="account[subdomain]"]').val() + '.zendesk.com');

                    next.css({'opacity':0.5, 'display':'block'})
                        .animate({ 'opacity':1 }, 400, 'easeInCirc');

                    //register account
                    webutils.setMAVs(self._global.activity, $CVO, true);
                    self.register($('form.reg'));
                }
            }

            return false;
        });

        $('input[name="account[subdomain]"]').on('input', function(){
            self.domainTrail();
        }).on('focus', function(){
            $('.domain-ping').hide();
            $('.create-account').addClass('disabled');
        }).on('blur', function(event) {
            var domain = $(this).val();

            if (domain != '' && domain.length > 2) {
                var available = self.domainLookup(domain);

                $(this).parent().find('label.error').hide();

                $('.domain-ping').show();
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

        $('input[name="owner[email]"]').bind('keypress', function (event) {
            var regex  = new RegExp("[a-zA-Z0-9@+._-]"),
                key    = String.fromCharCode(!event.charCode ? event.which : event.charCode),
                spec   = (event.charCode != event.which);

            if (event.charCode != 0 && event.which != 0 && !regex.test(key)) {
                event.preventDefault();

                self.showError($(this));

                return false;
            }
        });

        $('input[name="account[subdomain]"]').bind('keypress', function (event) {
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
            var distance = shadow.css('left'),
                offset = (webutils.calcTextWidth($('#phantom')) + 14) + 'px';

            if(distance.length >= 5 && Number(distance.substr(0, 3)) > 140) {
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
});
