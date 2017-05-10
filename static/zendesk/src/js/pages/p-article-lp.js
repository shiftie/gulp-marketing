/**
* Provides JavaScript handlers and listeners for elements on the new Zendesk Article LP Page
*
* @class Article LP
*/
var ArticleLP = {

/**
  * Fade HTML element in and up
  *
  * @method fadeInMoveUp
  * @param el (string) the class or id name of the css selector
  * @return void
  */
  fadeInMoveUp: function(el) {
    var elem = $(el);
    elem.animate({
      opacity: 1,
      top: '3px'
    }, 800);
  },

  init: function() {
    var self = this;

    // fade in the stats
    self.fadeInMoveUp('.overview h6');
  }

};
