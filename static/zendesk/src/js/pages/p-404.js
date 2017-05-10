/**
* 404 search - Four Oh Four Search
*/
var fourSearch = {

  init: function() {
    this.vars = {
      $searchField: $('.four-search-input'),
      apiEndpoint: "https://www.googleapis.com/customsearch/v1",
      apiKey: "AIzaSyCMGfdDaSfjqv5zYoS0mTJnOT3e9MURWkU",
      cseID: "014141993897103097974:46gdqg1e99k"
    };

    var regexedDomain = (window.location.pathname + window.location.search).replace(/[^a-z0-9]/g, ' ')
      , splitDomain   = regexedDomain.split(' ')
      , searchterm    = '';

    for (var i = 1; i < splitDomain.length; i++) {
      if (splitDomain !== undefined) {
        searchterm = splitDomain[i] + ' ' + searchterm;
      }
    }

    $('input.four-search-input').val(searchterm);

    this.submitSearch();

    setTimeout(function(){
      if (typeof ga !== 'undefined') {
        ga('create', 'UA-970836-24', 'auto');
        ga('send', 'pageview', '/error/404' + window.location.pathname);
      }
    }, 1000);
  },

  getResults: function(query,start){
    // Need offset of 1 because googs starts at 1, not 0
    start = (start === 0) ? 1 : start;
    $.ajax({
        url: fourSearch.vars.apiEndpoint,
        type: 'GET',
        dataType: 'jsonp',
        data: {
            key: fourSearch.vars.apiKey,
            cx: fourSearch.vars.cseID,
            q: query,
            start: start,
            num: 5
        },
        success: function(response) {
          if (response.queries.request[0].totalResults > 0) {
            fourSearch.displayResults(response, start, query);
          } else {
            fourSearch.showDefaults();
          }
        }
    }); // end ajax
  },

  showDefaults: function(){
    // Do nothing and show the defaults
    $('.suggestions h1').removeAttr('class').fadeOut(function(){
      $(this).html('Is this what you were looking for?').fadeIn(function() {
        $('.suggestions ul li a').animate({'opacity': 1});
      });
    });
  },

  displayResults: function(googleResponse, start, query){
    fourSearch.vars.$searchField;
    fourSearch.parseGoogleResponse(googleResponse);
  },

  parseGoogleResponse: function(response, start){
    var postTitle
      , postURL
      , postDescription
      , c = 1
      , resultIcon;

    // Loop through search results
    try {
      for (var i = 0; i < 4; i++) {
        if (typeof response.items[i] != 'undefined') {
          postTitle =  (typeof response.items[i].title != 'undefined') ? response.items[i].title : '[ Missing Title #sorry #googlefail ]';
          postURL =  (typeof response.items[i].link != 'undefined') ? response.items[i].link : '';
          postDescription =  (typeof response.items[i].snippet != 'undefined') ? response.items[i].snippet : '';

          if (postURL.indexOf('/product') != -1 || postURL.indexOf('/company') != -1) {
            resultIcon = 'ico-desktop';
          } else if (postURL.indexOf('/support') != -1) {
            resultIcon = 'ico-service';
          } else if (postURL.indexOf('/resources') != -1 || postURL.indexOf('/blog') != -1) {
            resultIcon = 'ico-article';
          } else {
            resultIcon = 'ico-other';
          }

          // Write results to DOM
          $('.result-' + i + ' a').attr('href', postURL);
          $('.result-' + i + ' h2').html(postTitle.substring(0, 84));
          $('.result-' + i + ' div').attr('class', resultIcon);
        }
      }
      $('.suggestions h1').removeAttr('class').fadeOut(function(){
        $(this).html('Is this what you were looking for?').fadeIn(function() {
          $('.suggestions ul li a').animate({'opacity': 1});
        });
      });
    } catch (e) {
      //console.log('error', e);
    }
  },

  // Small func to check for
  submitSearch: function(start){
    if (fourSearch.vars.$searchField.val() !== '') {
      fourSearch.getResults(fourSearch.vars.$searchField.val(), start, 10);
    } else {
      fourSearch.showDefaults();
    }
  }
};
