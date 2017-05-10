$(function() {

  $('.slides li:first').css('z-index',2);

  // Give each slideshow it's own independent ID for targetting
  var i = 0;
  $('.slides').each(function(){
    i++;
    $(this).attr('id','slideshow-'+i);
    slideshow( $(this).attr('id'),500,3000 );
  });

});
