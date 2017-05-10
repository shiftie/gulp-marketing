/**
* Provides JavaScript handlers for static sidebar module
*
* @class zdSidebarMenu
*/
var zdSidebarMenu = {

    init: function(trackingName) {
      var self = this;

      // assign vars
      self.trackingName = trackingName;

      // handle static nav
      self.handleStaticNav();
    },

    /**
    * Handle hover states for static sidebar navigation
    *
    * @method handleStaticNav
    * @param void
    * @return {Boolean} Returns true on success
    */
    handleStaticNav: function() {
      var self = this;

      // on hover over the menu hamburger icon, fade in the full menu
      $(".tour-menu-container .menu-icon").hover(
        function() {
          $('.tour-menu-expanded').fadeIn('fast');
          $('.tour-menu-container').addClass('active');

          // track expanding hover as ga event
          //_gaq.push(['_trackEvent', self.trackingName, 'Sidebar Menu Expanded']);
          ga('send', 'event', self.trackingName, 'Sidebar Menu Expanded', null, {'nonInteraction': 1});
        }, function() {}
      );

      // on hover out of the entire menu container, fade out the full menu
      $(".tour-menu-container").hover(
        function() {}, function() {
          $('.tour-menu-expanded').fadeOut('fast');
          $('.tour-menu-container').removeClass('active');
        }
      );
    }
};
