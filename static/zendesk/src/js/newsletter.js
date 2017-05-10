var NewsletterSignup = {

  successMessage: 'Welcome to the club!',

  init: function() {
    var self = this;

    $('#newsletter .register').on('click', function(evt){
      evt.preventDefault();

      var email = $("#newsletter .email").val();

      // validation
      if (email !== NewsletterSignup.successMessage && (email.length < 0 || !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email))) {
        $(this)
          .parent()
          .parent()
          .addClass('error')
          .find('label')
            .css({
              'display' : 'block',
              'margin-top' : '-25px'
            })
            .animate({
              'opacity' : 1,
              'margin-top' : '-8px'
            }, 300);
      } else {
        self.registerEmail();
      }
    });

    $('#newsletter .email').on('focus', function(evt){
      webutils.setMAVs(false);
    });

    $("#newsletter input").keypress(function(event) {
      if (event.which == 13) {
          event.preventDefault();
          $("#newsletter .register").trigger('click');
      }
    });

  },

  /*
   *
   * Submit to form handler
   *
   */
  registerEmail: function() {
    var form        = $('#newsletter');

    webutils.createLead('#newsletter');
    webutils.track('Marketing - Lead - Newsletter Subscription');

    // show success message
    form
      .find('.register')
      .addClass('success')
      .end()
      .find('.email')
      .attr('value', NewsletterSignup.successMessage)
      .css('color', '#ccc')
      .end()
      .find('ul label')
      .hide();

    // track lead
    $CVO.push([ 'trackEvent', { type: 'Lead - Newsletter' }]);

    ga('send', 'event', 'Lead - Newsletter', 'Registered');
    ga('send', 'pageview', '/lead/newsletter');

    window.optimizely = window.optimizely || [];
    window.optimizely.push(['trackEvent', 'newsletter_lead']);

    webutils.trackMarinContentConversion('1-9', 'Newsletter', 'newsletter_signup');
    if (window.dataLayer) {
      dataLayer.push({'event': 'newsletter_signup'});
    }
  }

};

$(function(){
  NewsletterSignup.init();
});
