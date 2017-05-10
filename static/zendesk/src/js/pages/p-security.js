$(document).ready(function(){

  // ----------------------------------------------------------------
  // quote fader
  function changeSlide(slide){
    $("#perspectives li.active")
      .fadeTo(250, 0)
      .removeClass('active');
    $("#perspectives li")
      .eq(slide)
      .fadeTo(250, 1)
      .addClass('active');
  }
  $('.customer-perspectives .prev').on('click', function(){
    var slides = $("#perspectives li").length;
    var curSlide = $("#perspectives li.active").index();
    var goToSlide = 0;
    if ((curSlide - 1) > 0){
      goToSlide = curSlide - 1;
    }
    changeSlide(goToSlide);
  });

  $('.customer-perspectives .next').on('click', function(){
    var slides = $("#perspectives li").length;
    var curSlide = $("#perspectives li.active").index();
    var goToSlide = 0;
    if ((curSlide + 1) < slides){
      goToSlide = curSlide + 1;
    }
    changeSlide(goToSlide);
  });

  // ----------------------------------------------------------------
  // sticky nav treatment
  // borrowed and modified from /product/innovative-customer-service/
    var stickyNav = $('.sticky').offset().top - 75,
          $window = $(window);

    window.setInterval(function(){
      if ($window.scrollTop() >= stickyNav) {
        if (!($('nav.sticky').hasClass('stuck'))) {
          $('nav.sticky').addClass('stuck').animate({'background-color': 'white'});
          $('nav.sticky section').animate({'padding-bottom':'15px', 'padding-top':'25px'});
          $('nav.sticky section ul li a').animate({'padding-top': "85px", 'background-size': '60% auto!important'});
        }
      } else if ($window.scrollTop() < stickyNav && $('nav.sticky').hasClass('stuck')) {
        $('nav.sticky').removeClass('stuck').css({'background-color': 'transparent'});
        $('nav.sticky section').animate({'padding-bottom':'40px', 'padding-top':'40px'});
        $('nav.sticky section ul li a').animate({'padding-top': "150px", 'background-size': '100% auto!important'});
      }
    }, 250);

  // ----------------------------------------------------------------
  // sticky nav jump nav
  $("nav.sticky a").on('mouseup', function(e){
    // if the nav is not stuck, we need to add a little more scrolling to the jump to account for the shift in padding
    var isStuck = ($(this).parent().parent().parent().hasClass('stuck')?true:false);
    var anchor = $(this).parent().attr('class');
    var modifier = 0;
    if (!isStuck){
      modifier = 200;
    }
    if (anchor == 'data-security'){
      modifier = 50;
    }
    anchor = '#anchor-'+anchor;
        $('html,body').animate({
          scrollTop: $(anchor).offset().top - modifier
        }, 500);
        e.preventDefault();
  });

  // ----------------------------------------------------------------
  // security cams

  var appSecurity = $('#anchor-app-security').offset().top - 404,
    $window = $(window);

  $(".cam.left").css({
    'top':(appSecurity + 480)+'px'
  });

  var additionalSecurity = $('#anchor-additional-security').offset().top - 620,
    $window = $(window);

  $(".cam.right").css({
    'top':(additionalSecurity + 85) +'px'
  });

    window.setInterval(function(){
        if ($window.scrollTop() >= (appSecurity - 300)) {
          $(".cam.left").animate({
            'left':0
      }, 250);
    }
        if ($window.scrollTop() >= (additionalSecurity - 500)) {
          $(".cam.right").animate({
            'right':0
      }, 250);
    }
    }, 250);

});
