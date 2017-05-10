
var LiveChatSoftwarePage = {

  init: function() {
    if (window.webutils) {
      webutils.showCTA('a.cta', '/agent/admin/chat');
    } else {
      $('a.cta').show();
    }
    $('#chat-matters ul li a').on('click', function(event) {
      var element = this;
      var elementClick = $(element).attr('href');
      var destination = $(elementClick).offset().top - 60;
      $('html,body').animate({ scrollTop: destination}, 1200);
      event.preventDefault();
      return false;
    });
  }
};
