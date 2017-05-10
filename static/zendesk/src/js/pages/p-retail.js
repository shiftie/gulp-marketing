/**
* Retail page functionality
*
* @class Retail
* @constructor
*/
var Retail = function(){

  /**
  * Initializes Retail functionality
  *
  * @method init
  * @param void
  * @return void
  */
  function init(){

    var slideUpSpeed = 1000
      , slideDownSpeed = 400
      , initialHeaderHeight = $('#overview').height()
      , transitionedHeaderHeight = 300;

    // initialize skrollr plugin, if not on mobile
    if (!_isMobile) {
      var s = skrollr.init({
      });
    }

    // listen for outbound links
    $('.outbound').click(function() {
    //_gaq.push(['_trackEvent', 'Retail Page', 'Outbound Link Click', $(this).attr('href')]);
      ga('send', 'event', 'Retail Page', 'Outbound Link Click', $(this).attr('href'), {'nonInteraction': 1});
  });

    // sticky the retail nav when scrolling down
    $('.retail-nav').waypoint('sticky', {
      offset: 310,
      wrapper: '<div class="retail-nav-wrapper" />'
    });

    // update pagination when scrolling down
    $('.pagelet').waypoint(function(direction) {

      // if going down, update pagination
      if (direction === 'down') {
        _updatePagination('.pagelet-' + $(this).data('id'));
      }

    }, {offset: 388});

    // update hash when scrolling down
    $('.track-hash').waypoint(function(direction) {

      // if going down, update pagination
      if (direction ==='down') {
        _updatePagination('.pagelet-' + $(this).data('id'));
      }

      // track event
      var id = $(this).attr('id');
      //_gaq.push(['_trackEvent', 'Retail Page', 'Pagelet View', id, null, true]);
      ga('send', 'event', 'Retail Page', 'Pagelet View', id, {'nonInteraction': 1});
    }, {offset: 388});

    // update pagination when scrolling up
    $('.pagelet').waypoint(function(direction) {
      if (direction === 'up') {
        _updatePagination('.pagelet-' + $(this).data('id'));
      }
    }, {offset: -388});

    // update example when scrolling down
    $('.pagelet').waypoint(function(direction) {
      if (direction === 'down') {
        var example = $(this).find('.example');
      }
    }, {offset: 550});

    // refresh waypoints on window resize
    $(window).resize(function() {
      $.waypoints('refresh');
    });

    // listen for click on the pagination and scroll to respective section
    $('.retail-nav-pages a').click(function() {
      var id = $(this).text()
        , top = $('.pagelet[data-id=' + id + ']').offset().top
        , headerHeight = transitionedHeaderHeight - $('#overview').height();

      $('html,body').animate({
      scrollTop: top + headerHeight
    }, 1000, function() {
      //_gaq.push(['_trackEvent', 'Retail Page', 'Pagination Nav', id]);
          ga('send', 'event', 'Retail Page', 'Pagination Nav', id, {'nonInteraction': 1});
    });
    });

  }

  /**
  * Update the pagination component
  *
  * @method _updatePagination
  * @param {Integer} cls The class of the item to activate
  * @return {Boolean} Returns true on completion
  */
  function _updatePagination(cls){
    $('.retail-nav-pages a').removeClass('active');
    $(cls).addClass('active');
  }

  return {
    init: init
  };

}();
