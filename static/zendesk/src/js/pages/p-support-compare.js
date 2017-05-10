/**
* @author  Herbert Siojo
* @since   2/28/17
*/

// $(document).ready(function() {
// });

/**
  * Set and display the correct currency based on existing cookies or IP geolcoation
  *
  * @params (Event) event The event corresponding to the popped state
  */
function setCurrency() {
  var pricingPlans = ['essential', 'team', 'professional', 'enterprise']
    , currSymbol = 'USD'
    , dbaseCountry = ['US', 'UK', 'GB', 'IM', 'GI', 'JE', 'GG', 'AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'EL', 'IE', 'IT', 'LV', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'MC', 'VA', 'SM', 'ME', 'MC', 'LU', 'XK', 'KV', 'GR', 'AD']
    , dbaseCC = 'US'
    , arrayPos = 0
    , countryCurrency = false
    , host = location.hostname.substr(location.hostname.indexOf('.') + 1)
    , currencySym = "$";

  // skip geo based currency for i18n sites
  switch (host) {
    case 'zendesk.fr':
      countryCurrency = 'EUR';
      break;
    case 'zendesk.it':
      countryCurrency = 'EUR';
      break;
    case 'zendesk.nl':
      countryCurrency = 'EUR';
      break;
    case 'zendesk.com.mx':
      countryCurrency = 'USD';
      break;
    case 'zendesk.com.br':
      countryCurrency = 'USD';
      break;
    case 'zendesk.co.jp':
      countryCurrency = 'USD';
      break;
    case 'zendesk.de':
      countryCurrency = 'EUR';
      break;
    case 'zendesk.co.uk':
      countryCurrency = 'GBP';
      break;
  }

  // pull currency tables and match based on geoip

  if (!countryCurrency || host == 'zendesk.es') {
    if ($.cookie('currency')) {
      countryCurrency = String($.cookie('currency'));
    } else {
      arrayPos = $.inArray(dbase.registry_country_code, dbaseCountry);
      // match country code to supported currency
      if (arrayPos >= 7) { // EUR
        countryCurrency = 'EUR';
      } else if (arrayPos > 0 && arrayPos < 7) { // GBP - UK GB IM GI JE GG
        countryCurrency = 'GBP';
      } else { // USD
        countryCurrency = 'USD';
      }
    }
  }

  switch (countryCurrency) {
    case 'GBP':
      currSymbol = currencyMap.GBP;
      break;
    case 'EUR':
      currSymbol = currencyMap.EUR;
      break;
    default:
      currSymbol = currencyMap.USD;
      countryCurrency = 'USD';
      break;
  }

  // Store in cookie for quicker access later
  $.cookie('currency', countryCurrency, {expires: 730, path: '\/', domain: host});

  // update page title w/ price
  pageTitle = document.title;
  pageTitle = pageTitle.replace('$1', currSymbol.symbol + currSymbol.annually.zendesk.essential);
  document.title = pageTitle;

  if (dbase.registry_country_code !== 'US' && countryCurrency == 'USD') {
    currencySym = "$";
  } else {
    currencySym = currSymbol.symbol;
  }

  // ZENDESK: update annual prices
  $('.pricing-yearly .annual-essential').html(currencySym + currSymbol.annually.zendesk.essential);
  $('.pricing-yearly .annual-team ').html(currencySym + currSymbol.annually.zendesk.team);
  $('.pricing-yearly .annual-professional').html(currencySym + currSymbol.annually.zendesk.professional);
  $('.pricing-yearly .annual-enterprise').html(currencySym + currSymbol.annually.zendesk.enterprise);
  $('.pricing-yearly .annual-elite').html(currencySym + currSymbol.annually.zendesk.elite);

  // ZENDESK: update monthly prices
  $('.pricing-monthly .monthly-essential').html(currencySym + currSymbol.monthly.zendesk.essential);
  $('.pricing-monthly .monthly-team').html(currencySym + currSymbol.monthly.zendesk.team);
  $('.pricing-monthly .monthly-professional').html(currencySym + currSymbol.monthly.zendesk.professional);
  $('.pricing-monthly .monthly-enterprise').html(currencySym + currSymbol.monthly.zendesk.enterprise);
  $('.pricing-monthly .monthly-elite').html(currSymbol.monthly.zendesk.elite);

  // change asterisks to respective currency symbol
  $('.ico-check, .aster').each(function() {
    $this = $(this);
    if ($this.html() === '*') {
      $this.addClass('sup-currency').html('<sup>' + currencySym + '</sup>');
    }
  });
}

/**
 * Registers all the scroll and resizing handlers necessary for updating
 * the position and width of the sticky table header
 */
function registerTableHandlers() {
  var stickyNavHeight = $('.nav-sticky-menu').outerHeight();
  var $headerWrapper = $('.compare-table-header-fixed-wrap');
  var $fixedTableHeader = $('.compare-table-header-fixed-wrap');
  var $compareTable = $('#compare-table');
  var $fixedCompareTableHeader = $('.compare-table-header-fixed-wrap');
  var $baseCompareTableHeader = $('.compare-table-key');
  var $essentialPlanHeader = $baseCompareTableHeader.find('.essential');

  var windowScrollHandler = webutils.debounce(function() {
    var offset = $(window).scrollTop();
    var stickyNavMaxY = offset + stickyNavHeight;

    var headerHeight = $headerWrapper.height();
    var tableOffsetTop = $compareTable.offset().top + headerHeight;
    var tableOffsetBottom = tableOffsetTop + $compareTable.height() - headerHeight;

    if (stickyNavMaxY >= tableOffsetTop && $fixedTableHeader.is(':hidden') && stickyNavMaxY < tableOffsetBottom) {
      $fixedTableHeader.show();
    }
    else if (!$fixedTableHeader.is(':hidden') && (stickyNavMaxY < tableOffsetTop || stickyNavMaxY > tableOffsetBottom)) {
      $fixedTableHeader.hide();
    }

    // Update the x-coordinate of the table header as well
    var left = updateTableHeaderOffset();
    updateTableHeaderWidth(left);
  }, 30);
  $(window).scroll(windowScrollHandler);

  var updateTableHeaderOffset = function() {
    // Offset the header to Essential plan name's left offset, or if scrolled to the left, the table's left offset
    var left = Math.max($essentialPlanHeader.offset().left, $compareTable.offset().left);
    $fixedCompareTableHeader.offset({ left: left });
    var stickyNav = $('.nav-fixed');
    if (stickyNav.length) {
      var top = stickyNav.offset().top + stickyNav.height();
      $fixedCompareTableHeader.offset({ top: top });
    }
    return left;
  };

  var updateTableHeaderWidth = function(left) {
    // Calculate the width to be from the new left offset to right offset of the table
    var width = $compareTable.offset().left + $compareTable.outerWidth() - left;
    $fixedCompareTableHeader.css({ width: width });
    $fixedCompareTableHeader.find('.header-container').css({
      width: $baseCompareTableHeader.width()
    });
    return width;
  };

  var tableScrollHandler = function() {
    var left = updateTableHeaderOffset();
    var distanceFromTableLeftToEssential = $essentialPlanHeader.offset().left - $('table.compare-table').offset().left;
    updateTableHeaderWidth(left);
    var scrollLeft = Math.max($compareTable.scrollLeft() - distanceFromTableLeftToEssential, 0);
    $fixedCompareTableHeader.scrollLeft(scrollLeft);
  };
  $compareTable.scroll(tableScrollHandler);

  var resizeHandler = function() {
    var left = updateTableHeaderOffset();
    updateTableHeaderWidth(left);

    // Copy the widths of the plan name column headers so our sticky header columns match up in size
    var $headers = $baseCompareTableHeader.find('.pricing-choice');
    $.each($headers, function (idx, header) {
      var planName = header.className.split(' ').pop();
      $fixedCompareTableHeader.find('.' + planName).css({ width: $(header).outerWidth() });
    });
  };
  resizeHandler();
  $(window).resize(resizeHandler);

  // Revealing the table rows changes column header widths, so resize on any click
  $compareTable.click(resizeHandler);
}

$(window).on('load', function(){
  setCurrency();

  window.setTimeout(function(){
    $('.lang-fr .pricing-choice-plan-price, .lang-fr .mo-price, .lang-fr article.reg .plan span.point').each(function(){
      var priceVal = $(this).html();
      if (priceVal.indexOf('€') != -1) {
        var priceValLength = priceVal.length
          , result = priceVal.substr(1) + priceVal.substr(0, 1);
        $(this).html(result);
      }
    });
  }, 1000);

  $('.compare-table-header').on('click', function(){
    var subset = $(this).attr('data');
    $(this).toggleClass('open');
    $(this).parent().find('.compare-table-sub[data|='+subset+']').toggle();
  });

  $('.pricing-choice-plan-title-promo').on('click', function(){
    $('html,body').animate({
      scrollTop: 1125
    }, 1500);
  });

  // Adjust tooltip position depending on height of specific div
  $('.col1').mouseenter(function(){
    var $colHeight = $(this).height();

    if ($colHeight > 50) {
      $('.compare-table-tooltip-txt').css('bottom', "70px");
    }

    else if ($colHeight > 25 && $colHeight < 50) {
      $('.compare-table-tooltip-txt').css('bottom', "48px");
    }

    else {
      $('.compare-table-tooltip-txt').css('bottom', "32px");
    }
  });

  registerTableHandlers();
});
