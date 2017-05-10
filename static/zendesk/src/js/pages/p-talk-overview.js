$(function(){

  if ($('.keep-in-touch').length>0){

    var screenshot = $('.keep-in-touch').offset().top - 400,
      $window = $(window);
      window.setInterval(function(){
        if ($(window).width()>1084){
          if ($window.scrollTop() >= (screenshot)) {
            $(".screenshot").animate({
              'right':'40%'
            }, 400);
          }
        }
      }, 250);
  }
});
