$(document).ready(function() {
  // sticky nav treatment
  var $window = $(window);

  var stickyScroll = function() {
    var topper = $(document).scrollTop()
      , offsetter = $('.sticky-nav-offsetter').offset().top - 75;

    if (topper > offsetter) {
      $('.sticky-nav').addClass('stuck');
    } else {
      $('.sticky-nav').removeClass('stuck');
    }
  };
  $window.scroll(stickyScroll);
  $window.resize(stickyScroll);
});

$(window).load(function() {
  if ($("#menu-company").length > -1) {
    $("#menu-company a").click(function(e) {
      var $this = $(this),
          $contentInfo = $("#content"),
          anchor = $this.attr("href");

      window.location.hash = anchor;
      e.preventDefault();
      $("#menu-company li").removeClass("current");
      $this.parent("li").addClass("current");
      $contentInfo.children("section").hide();
      $contentInfo.children(anchor).show();
      $('html, body').animate({
        scrollTop: $(".main-container").offset().top - 100
      }, 500);
    });

    if (!window.location.hash) {
      $("#menu-company a").first().click();
    }
    else {
      $("#menu-company a[href='" + window.location.hash + "']").click();
    }
  }
});
