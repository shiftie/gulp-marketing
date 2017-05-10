/**
* Carousel interactions
* @author  Alden Aikele
* @since   11/14/14
* @class   VoicePage
*/

var LoginPageRefresh = {

  init: function() {

    // Return random header greeting
    var random = Math.floor(Math.random() * $('.header-random').length);
    $('.header-random').hide().eq(random).show();

    //email reminder module appear
    $(".reminder-link").click(function(e) {
      e.preventDefault();
      $(".login-remind, .form-login").fadeToggle(
        300);
    });

    // Show login if customer
    if (window.webutils) {

      //submit login if press enter
      $("#customerUrl").keypress(function(e) {
        if (e.which == 13) {
          e.preventDefault();
          $('.free-trial').click();
        }
      });

      //adjust destination of login button if input is added
      $('#customerUrl').change(function() {
        var newUrl = $('#customerUrl').val();
        $('a.free-trial').attr("href", "https://" +newUrl + ".zendesk.com/agent");
      });

      webutils.updateFeaturePriorities('login');
      webutils.trackHomeTest('login');

      $('.login-form').hide();
      webutils.showCTA('.login-form', '/');
    } else {
      $('.login-form').show();
    }

    //validate login url
    var formLogin = $('.form-login')
    , LoginError  = formLogin.find('label');

    function validateForm() {
      var LoginValue = document.forms["form-login"]["customerUrl"].value;
      if (LoginValue == null || LoginValue == "") {
        LoginError
          .css('margin-left', 20)
          .addClass("error")
          .animate({'opacity': 1, 'margin-left':0}, 200);
        return false;
      }
      else {
        var newUrl = $('#customerUrl').val();
        window.location = "https://" +newUrl + ".zendesk.com/agent";
      }
    }

    $('a.free-trial').click(validateForm);

    //Send reminder email

    var formRemind   = $('.form-remind')
    , remindInput  = formRemind.find('input')
    , remindError  = formRemind.find('label')
    , remindSubmit = formRemind.find('a.cta');

    $("#email").keypress(function(e) {
      if (e.which == 13) {
        e.preventDefault();
        $('#send-reminder').click();
      }
    });

    $('#send-reminder').on('click', function(){
      var email = $("#email").val(),
        url = 'https://support.zendesk.com/accounts/reminder?email=' + email + '&callback=?',
        top = $('.login-remind h2').outerHeight(),
        height = $('.login-remind').innerHeight();
      if (email.length < 0 || email == 'me@example.com' || !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
        remindError
          .css('margin-left', 20)
          .addClass("error")
          .animate({'opacity': 1, 'margin-left':0}, 200);
      } else {
        $('.loading')
          .css({'opacity':1, 'display':'block'});

        $.getJSON(url, function(data) {
          var result = data.success,
            res = $('formRemind span.res');

          if (result == true) {
            res.show().removeClass('bad').html('<span class="good"><?php _e("Thanks! We\'re checking our records and if you have an account you should receive an email within a few minutes.") ?></span>');
            $('img#loading').fadeOut('fast');
          } else {
            $('.loading').fadeOut('fast');
            res.show().addClass('bad').html('<?php _e("Whoops.  We can\'t find that email address. Did you spell it correctly?") ?>');
          }
        });
      }

      return false;
    });

    //hide footer so that scroll bar doesn't appear
    $("footer").hide();

  }
};
