/**
 *
 * Animate a slide pin from the correct direction
 *
 * @params (pin:element) document element
 */
function animatePin(pin){
  var cls   = pin.attr('class'),
    dir   = cls.substr(cls.lastIndexOf(' ') + 1),
    start,
    end;

  if(dir === 'popover-pos-top' || dir === 'popover-pos-bottom') {
    if(dir === 'popover-pos-top') {
      start = '+=20';
      end   = '-=20';
    }

    if(dir === 'popover-pos-bottom') {
      start = '-=20';
      end   = '+=20';
    }

    setTimeout(function(){
      pin
        .css({'top':start, 'opacity':0})
        .show()
        .animate({'top':end, 'opacity':1}, 300)
    }, 300)


  } else if(dir === 'popover-pos-left' || dir === 'popover-pos-right') {
    if(dir === 'popover-pos-left') {
      start = '+=20';
      end   = '-=20';
    }

    if(dir === 'popover-pos-right') {
      start = '-=20';
      end   = '+=20';
    }

    setTimeout(function(){
      pin
        .css({'left':start, 'opacity':0})
        .show()
        .animate({'left':end, 'opacity':1}, 300)
    }, 300)
  }
}

/**
 * Scroll through slides using nav arrows
 *
 * @params (button:element) button that was clicked
 */
function setScreen(button) {
  var parent = button.parent().parent(),
    active = parent.find('.active'),
    index  = active.index() + 2,
    count  = parent.find('li').length,
    target;

  if(button.attr('class') === 'carousel-paddles-lt')
    index = index - 2;

  if(index > count)
    index = 1;
  else if(index < 1)
    index = count;

  target = parent.find('li:nth-child(' + index + ')');

  active
    .css({'opacity':0})
    .removeClass('active')
    .find('.popover')
    .hide();

  target
    .css({'opacity':1})
    .addClass('active')
          .find('.popover')
      .show();


  animatePin(target.find('.popover'));

  var menu = parent.parent().parent().find('.carousel-tabs');

  menu
    .find('.active').removeClass('active')
    .end()
    .find('ul li:nth-child(' + index + ') a')
    .addClass('active');
}

/**
 * Set slide from menu
 *
 * @params (button:element) button that was clicked
 */
function setMenu(button) {
  var parent = button.parent(),
      active = parent.find('.active'),
      index  = button.parent().index() + 1,
      target,
      wrapper;


    wrapper = parent.parent().parent().parent();
    target  = wrapper.find('.carousel-content li:nth-child(' + index + ')');

    wrapper
      .find('.carousel-content li.active')
      .css({'opacity':0})
      .removeClass('active')
      .find('.popover')
      .hide();

    target
      .css({'opacity':1})
      .addClass('active')
      .find('.popover')
      .show();
    animatePin(target.find('.popover'));

    button.parent().parent().find('.active').removeClass('active');
    button.addClass('active');
}

$('.carousel-content .carousel-paddles a')
  .on('click', function(){
    setScreen($(this));
  });
$('.carousel-tabs a')
  .on('click', function(){
    setMenu($(this));
  });
$(document).on('keydown', function(e) {

    var code = ( e.keyCode ? e.keyCode : ( e.which ? e.which : e.charCode ) );

  // Check for carousel in the viewport
  if ( $('.screenshot-carousel:in-viewport').length ) {

      if ( code == 37 ) {
        setScreen( $('.carousel-paddles-lt') );
      }

      if ( code == 39 ) {
      setScreen( $('.carousel-paddles-rt') );
      }
    }
  });

setInterval(function(){
  var scrollerTop = $(window).scrollTop();
  var triggeredCarouselSlide = false;
  var scrnModuleTop = $('.screenshot-carousel').offset().top;

  if ( scrollerTop > scrnModuleTop - 300 && $('.carousel-content .first').hasClass('active') && triggeredCarouselSlide == false ) {
      $('.carousel-content .first').children('.popover').fadeIn();
      triggeredCarouselSlide = true;
  }
}, 400);



