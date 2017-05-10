$(function(){

  var step1     = $('#step1 .screen img').offset().top - 900,
    step1_init  = false,
    step2     = $('#step2 .screen img').offset().top - 900,
    step2_init  = false,
    step3     = $('#step3 .screen img').offset().top - 900,
    step3_init  = false,
    $window   = $(window);

  window.setInterval(function(){
    if ($window.scrollTop() >= (step1)) {
          if (step1_init!==true){
            step1_init = true;
            $('#step1 .screen img').animate({
              'top':98
            }, 250);
          }
      }
    if ($window.scrollTop() >= (step2)) {
          if (step2_init!==true){
            step2_init = true;
            $('#step2 .screen img').animate({
              'top':17
            }, 250);
          }
      }
    if ($window.scrollTop() >= (step3)) {
          if (step3_init!==true){
            step3_init = true;
            $('#step3 .screen img').animate({
              'top':10
            }, 250);
          }
      }
  }, 250);


});
