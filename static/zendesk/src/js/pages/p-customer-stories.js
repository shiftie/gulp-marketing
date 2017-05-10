/**
 * Publicly exported object on which all utility functions are installed.
 */
var stories = {};

(function($) {

  stories.init = function() {
    var filter = $('.options');

    $(".section-label").click(function () {
      var child   = $(this).siblings('.options')
        , visible = child.is(':not(:visible)');

      filter.hide('fast');

      $('.section-label').not(this).removeClass('selected');

      $(this).toggleClass('selected');

      child.toggle(visible);
    });

    $('.filter-reset').on('click', function(){
      var $filterWrap = $('#filter-wrap');
      $filterWrap.find('.pressed').removeClass('pressed');
      $filterWrap.find('.selected').removeClass('selected');
      $filterWrap.find('.section-label').each(function(){
        $(this).html($(this).attr('data-group-label') + '<img class="arrow-dwn" src="//d1eipm3vz40hy0.cloudfront.net/images/p-customers/arrow-dwn.png">').css('color', '#666');
      });
      stories.applyFilters();
      return false;
    });

    $('#filter-wrap a').click(function(e){
      var filter   = $(this)
        , title    = filter.html()
        , category = filter.parent().parent()
        , selected = (filter.attr('class') == 'pressed') ? true : false;

      e.preventDefault();

      $('article.tile').css('margin-bottom', '3%');

      category
        .find('a')
          .removeClass('pressed')
          .end()
        .parent().find('.options').hide();

      var label = category.siblings('.section-label');

      if (selected) {
        label.html(label.attr('data-group-label') + '<img class="arrow-dwn" src="//d1eipm3vz40hy0.cloudfront.net/images/p-customers/arrow-dwn.png">').css('color', '#666');
      } else {
        label.html(title + ' <img class="arrow-dwn" src="//d1eipm3vz40hy0.cloudfront.net/images/p-customers/arrow-dwn.png">').css('color', '#78a300');
        $(this).addClass('pressed');
      }

      label.removeClass('selected');

      $(category.attr('id') + 'a').not(this).removeClass('selected');

      stories.applyFilters();
    });

    $('.tile').on('click', function() {
      window.location = $(this).find('a').attr('href');
    });

    if (!_isMobile) {
      if (!!window.location.hash) {
        stories.filterFromHash();
      } else {
        stories.autoGeoFilter();
      }

    } else {
      $('#filter-wrap').hide();
      $('.quote-box').hide();
      stories.filterFromHash();
    }

    // Reposition the quote box after a short delay when the window gets resized
    $(window).on("resize", function() {
      window.clearTimeout(stories.resizeBanner);

      stories.resizeBanner = setTimeout(function(){

        stories.positionQuoteBox();
      }, 500);
    });
  };

  stories.applyFilters = function() {
    var tiles  = $('#tiles')
      , filter = ''
      , active = $('#filter-options .pressed')
      , hashTitle = '';



    $.each(active, function(index){
      filter += '.' + $(this).attr('data-filter');
      if (hashTitle ==='') {
        hashTitle += $(this).attr('data-filter');
      } else {
        hashTitle += ","+$(this).attr('data-filter');
      }

    });
    window.location.hash=hashTitle;

    tiles.isotope({filter: filter});

    stories.positionQuoteBox();

    setTimeout(function(){
      tiles.height(tiles.height() + 700);
    }, 1000);


  };

  stories.positionQuoteBox = function() {
    //qoute box positioning

    var visible = $('.isotope-item:visible')
    , box_one_height = $(".first-box").outerHeight()
    , box_two_height = $(".second-box").outerHeight();

    visible.css('margin-bottom', '30px');

    $(visible[7]).css('margin-bottom', box_one_height + 70);
    $(visible[15]).css('margin-bottom', box_two_height + 90);

    $(".second-box").css({top: box_one_height + 1702});

    if (visible.length < 4) {
      $('.quote-box').hide();
    } else {
      $('.quote-box').show();
    }

    if (visible.length < 1) {
      $('.no-results').show();
    } else {
      $('.no-results').hide();
    }
  };

  stories.filterFromHash = function() {
    var hashFilters = window.location.hash.replace("#", "").split(",");

    if (hashFilters.length > 0) {
      hashFilters.forEach(function(pickedFilter) {
        var filter = $("#filter-options [data-filter="+pickedFilter+"]");
        filter.attr("class", "pressed");

        var label = filter.parent().parent().siblings('.section-label');
        label.html(filter.html() + ' <img class="arrow-dwn" src="//d1eipm3vz40hy0.cloudfront.net/images/p-customers/arrow-dwn.png">').css('color', '#78a300');
      });
    }

    stories.applyFilters();
  };

  stories.autoGeoFilter = function(){
    var emea = new Array('BA','BW','BG','BI','RO','RU','RW','CM','SA','SN','RS','SL','CG','HR','AL','DZ','AD','AO','CY','CZ','DK','EG','EE','ET','FI','FR','GA','GE','DE','GH','GR','GN','HU','IQ','IE','IT','JO','KZ','KE','KW','KG','LV','LB','LI','LT','LU','MK','MT','MR','MU','MC','ME','MA','MZ','NA','NL','AM','AT','AZ','BH','NG','NO','OM','BY','BE','BJ','PL','PT','QA','SK','SI','ZA','ES','SE','CH','TJ','TZ','TN','TR','TM','UG','UA','AE','GB','UZ','ZM','ZW')
      , apac = new Array('BN','WS','AF','FJ','IN','JP','NZ','AU','PK','BD','PG','LK')
      , amer = new Array('BV','BR','IO','BF','CV','BL','SH','KN','LC','MF','PM','VC','KH','CA','KY','CF','TD','CL','CN','CX','CC','SM','ST','SC','SG','CO','KM','CD','CK','CR','CI','CU','CW','AX','AS','AI','AQ','AG','DJ','DM','DO','EC','SV','GQ','ER','FK','FO','GF','PF','TF','GM','GI','GL','GD','GP','GU','GT','GG','GW','GY','HT','HM','VA','HN','HK','IS','ID','IR','IM','IL','JM','JE','KI','KR','LA','LS','LR','LY','MO','MG','MW','MY','MV','ML','MH','MQ','YT','MX','FM','MD','MN','MS','MM','NR','NP','NC','NI','NE','AR','AW','BS','NU','NF','MP','PW','PS','PA','BB','BZ','BM','BT','BO','BQ','PY','PE','PH','PN','PR','RE','SX','SB','SO','GS','SS','SD','SR','SJ','SZ','SY','TW','TH','TL','TG','TK','TO','TT','TC','TV','US','UM','UY','VU','VE','VN','VG','VI','WF','EH','YE','KP')
      , region = 'none';

    if (typeof dbase !== 'undefined' && dbase.registry_country_code) {
      var country = dbase.registry_country_code;

      if ($.inArray(country, amer) > -1) {
        $('#sel-americas').trigger('click');
      }

      if ($.inArray(country, emea) > -1) {
        $('#sel-europe').trigger('click');
      }

      if ($.inArray(country, apac) > -1) {
        $('#sel-asia-pacific').trigger('click');
      }
    }
  };
}(jQuery));
