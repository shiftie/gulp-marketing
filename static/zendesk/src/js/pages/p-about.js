 /*
  *
  * Fetch Bizo profile data and add it to lead gen forms
  *
  */

var About = {
  interval: null,

  init: function() {
    var self = this,
        delta = 0,
        index = 0,
        threshold = 30,
        paused = false,
        sections = [
          $('#intro'),
          $('#creation'),
          $('#simple'),
          $('#relationships'),
          $('#quality'),
          $('#experience'),
          $('#quote'),
          $('#roots'),
          $('.mastfoot')
        ];

    if (!_isMobile) {
      $(window).on('DOMMouseScroll mousewheel', function(e) {
        if (!paused) {
          var lapse = (index === 3) ? 1500 : 800;

          if (e.originalEvent.detail < 0 || e.originalEvent.wheelDelta > 0) {
            delta--;

            if (Math.abs(delta) >= threshold) {
              paused = true;

              if (index !== 0) {
                index--;
                delta = 0;

                self.prevSlide(index, sections[index], sections[index + 1]);

                $('html, body').animate({ scrollTop: sections[index].offset().top - 70 }, lapse, "easeInOutCubic", function(){
                  paused = false;
                  delta = 0;
                });
              } else {
                paused = false;
              }
            }
          } else {
            delta++;

            if (Math.abs(delta) >= threshold) {
              paused = true;

              if (index !== (sections.length - 1)) {
                index++;
                delta = 0;

                self.nextSlide(index, sections[index], sections[index - 1]);

                $('html, body').animate({ scrollTop: sections[index].offset().top - 70 }, lapse, "easeInOutCubic", function(){
                  paused = false;
                  delta = 0;
                });
              } else {
                paused = false;
              }
            }
          }
        }

        return false;
      });
    } else {
      var dragThreshold = 0.15, // "percentage" to drag before engaging
          dragStart = null, // used to determine touch / drag distance
          percentage = 0,
          previousTarget,
          handheld = (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

      $('.swipe').on({
        touchstart: function(event) {
          if (dragStart !== null) { return; }

          if (event.originalEvent.touches) {
            event = event.originalEvent.touches[0];
          }

          // where in the viewport was touched
          dragStart = event.clientY;
        },

        touchmove: function(event) {
          if (dragStart === null) { return; }

          if (event.originalEvent.touches) {
            event = event.originalEvent.touches[0];
          }

          delta = dragStart - event.clientY;
          percentage = delta / $(window).height();

          // don't drag element. this is important.
          return false;
        },

        touchend: function() {
          dragStart = null;

          if (!paused) {
            var lapse = (index === 3) ? 800 : 1500;

            if (percentage >= dragThreshold) {
              paused = true;
              index++;
              delta = 0;
              offset = (handheld) ? 0 : 70;

              self.nextSlide(index, sections[index], sections[index - 1]);

              $('html, body').animate({ scrollTop: sections[index].offset().top - offset }, lapse, "easeInOutCubic", function(){
                paused = false;
                delta = 0;
              });
            } else if (Math.abs(percentage) >= dragThreshold) {
              paused = true;
              index--;
              delta = 0;

              self.prevSlide(index, sections[index], sections[index + 1]);

              $('html, body').animate({ scrollTop: sections[index].offset().top - offset }, lapse, "easeInOutCubic", function(){
                paused = false;
                delta = 0;
              });
            }
          }

          percentage = 0;
        }
      });
    }
  },

  /*
   * nextSlide
   *
   * @params (thing:thing) Desc
   */

  nextSlide: function(index, target, last) {
    var self = this;

    switch (index) {

      case 2: // beautifully simple
        $('#simple-fixed')
          .css({ opacity: 0 })
          .delay(500)
          .animate({ opacity: 1 }, 1500);
        break;

      case 3: // relationships
        $('#simple-fixed p')
          .stop()
          .animate({ opacity: 0 }, 200, function(){
            var fixedHeight;

            if (_isMobile) {
              if ((/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
                fixedHeight = 140;
              } else {
                fixedHeight = 430;
              }
            } else {
              fixedHeight = 335;
            }

            $('#simple-fixed').css({ height: fixedHeight });
          });

        target
          .css({ opacity: 0 })
          .delay(600)
          .animate({ opacity: 1 }, 1300);
        break;

      case 4: // quality
        last
          .stop()
          .animate({ opacity: 0 }, 200);

        target
          .css({ opacity: 0 })
          .delay(500)
          .animate({ opacity: 1 }, 1000);

        clearInterval(self.interval);

        var list = $('#quality li');

        self.interval = setInterval(function(){
          var list   = $('#quality ul')
            , items  = list.find('li')
            , active = list.find('.active')
            , len    = items.length
            , next;

          active
            .attr('class', '')
            .animate({ opacity: 0 }, 200);

          if (active.index() === len - 1) {
            next = $(items[0]);
          } else {
            next = active.next('li');
          }

          next
            .attr('class', 'active')
            .delay(150)
            .animate({ opacity: 1 }, 1000, function(){
              $(this).attr('class', 'active');
            });
        }, 4000);

        if (list.find('active').length === 0) {
          list
            .first()
            .attr('class', 'active')
            .css({ top: 40 })
            .delay(1200)
            .animate({ opacity: 1, top: 0 }, 500);
        }

        break;
      case 5: // experience
        last
          .stop()
          .animate({ opacity: 0 }, 200);

        target
          .css({ opacity: 0 })
          .delay(500)
          .animate({ opacity: 1 }, 1000);
        break;

      case 6: // quote
        $('#simple-fixed')
          .animate({ top: -100, opacity: 0 }, 300, "easeInOutCubic");

        target
          .find('.mikkel-quote')
          .css({ opacity: 0 })
          .delay(500)
          .animate({ opacity: 1 }, 1500);
        break;

      case 7: // roots
        target
          .find('.dark')
          .css({ opacity: 0 })
          .delay(200)
          .animate({ opacity: 1 }, 1300);
        break;
    }
  },

  /*
   * nextSlide
   *
   * @params (thing:thing) Desc
   */

  prevSlide: function(index, target, last) {
    switch (index) {
      case 1: // intro
        last = $('#simple-fixed');

        last
          .stop()
          .animate({ opacity: 0 }, 300);
        break;

      case 2: // beautifully simple
        last
          .stop()
          .animate({ opacity: 0 }, 200, function(){
            $('#simple-fixed').css({ height: 700 });
          });

        target = $('#simple-fixed');

        target
          .find('p')
          .delay(600)
          .animate({ opacity: 1 }, 1000);
        break;

      case 3: // relationships
        last
          .stop()
          .animate({ opacity: 0 }, 200);

        target
          .css({ opacity: 0 })
          .delay(600)
          .animate({ opacity: 1 }, 1000);
        break;

      case 4: // experience
        last
          .find('.quote')
          .stop()
          .animate({ opacity: 0 }, 200);

        target
          .css({ opacity: 0 })
          .delay(600)
          .animate({ opacity: 1 }, 1000);
        break;

      case 5: // quote
        target
          .css({ opacity: 0 })
          .delay(300)
          .animate({ opacity: 1 }, 1500);

        $('#simple-fixed')
          .stop()
          .delay(500)
          .animate({ top: 0, opacity: 1 }, 400, "easeInOutCubic");

        break;
      case 6: // roots
        last
          .find('.dark')
          .delay(200)
          .stop()
          .animate({ opacity: 0 }, 700);

        target
          .find('.mikkel-quote')
          .css({ opacity: 0 })
          .delay(600)
          .animate({ opacity: 1 }, 1300);
        break;
    }
  }
};

$(function(){
  $(window).scrollTop(0);

  About.init();
});
