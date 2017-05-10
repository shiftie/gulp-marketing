var SolutionsEnt = {

  init: function() {
    var self = this,
        isIE8 = $('html').hasClass('ie8');

    // send cust domain to Heap
    webutils.trackIntent('SolutionsEnt');

    // if not a mobile device, make these available
    if (!_isMobile && !isIE8) {
      var s = skrollr.init({
        forceHeight: false
      });
    }
    webutils.lockTopNavigation(); // make top navigation sticky

    SolutionsEnt.animData = {
      container: document.getElementById('bodymovin-hero'),
      renderer: 'svg',
      loop: false,
      autoplay: true,
      rendererSettings: {
          progressiveLoad: false
      },
      path: 'https://d1eipm3vz40hy0.cloudfront.net/json/animations/solutions-enterprise-big-boat.min.json'
    };
    SolutionsEnt.animSmallData = {
      container: document.getElementById('bodymovin-small'),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      rendererSettings: {
          progressiveLoad: false
      },
      path: 'https://d1eipm3vz40hy0.cloudfront.net/json/animations/solutions-enterprise-small-boat.min.json'
    };
    bodymovin.loadAnimation(SolutionsEnt.animData);
    bodymovin.loadAnimation(SolutionsEnt.animSmallData);
  }
};
