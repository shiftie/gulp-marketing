/**
* Universal search
*/
var universeSearch = {
    init: function() {

      this.vars = {
        isOpen: false,
        $search: $('.universe-search'),
        $searchIcon: $('.universe-search-icon'),
        $searchClose: $('.universe-search-close'),
        $searchHelp: $('.universe-search-help'),
        $searchField: $('.universe-search-input'),
        $searchSubmit: $('.universe-search-submit'),
        $searchPagination: $('.universe-search-pagination'),
        $searchPaginationList: $('.universe-search-pagination-list'),
        $navBar: $('.primary-menu'),
        $searchResultsDiv: $('.universe-search-results'),
          suggestTermIndex: ["chat","api","jira","salesforce","Google","voice","facebook","light agent","live chat","lotus","wordpress","twitter","knowledge base","language","light agents","feedback tab","video","gooddata","help desk","login","itil","API","magento","dropbox","email","integration","phone","demo","security","widget","zendesk voice","mobile","css","drivers","basecamp","crm","integrations","tags","sla","forum","reporting","newsletter","sugarcrm","yammer","startup","languages","faq","sso","logo","feedback","agent","sandbox","center","time tracking","ITIL","logmein","triggers","knowledgebase","outlook","dynamic content","good data","single sign on","widgets","test","ticket","android","branding","infographic","macros","affiliate","java","groupon","mailchimp","score","cname","export","nonprofit","satisfaction","sms","bootcamp","help desk 2.0","SLA","driver","saml","sex","zendesk","apps","habbo","Help Desk 2.0","reports","active directory","domain mapping","google","joomla","billing","enterprise","google apps","pricing","survey","css cookbook","unsubscribe","webcam","benchmark","cancel","free","harvest","iphone","training","wall","asset management","education","quickbooks","Search","webinar","backup","host mapping","import","JIRA","ldap","unlock","zenbox","عربي","español","highrise","netsuite","screenr","support","twilio","سكس","help","mail api","non-profit","online chat","remote authentication","ticket sharing","capsule","customer satisfaction","forums","getting started","log in","macro","spam","ticket id in email subject","workflow","change management","delete account","podio","web form","FAQ","livechat","microsoft word","SSO","analytics","download","github","inventory","jobs","sharepoint","ssl","calendar","drupal","Facebook","gmail","Google.com","uptime","ambassador","cmdb","dynamics","ebay","friend","helpdesk","Jira","non profit","rss","Search everything","Sex","videos","voip","agents","asset","cloud","dashboard","freshbooks","remote","salesforce.com","status","sugar","sugar crm","usb","Voice","whatsapp","blog","bluetooth","careers","hipaa","ilok","incident","matlab","openid","password","payment","price","remove write protection","SAML","skype","terms","trigger","zoho","acer","authentication","bugzilla","Chat","CRM","directx 11","infusionsoft","Light agent","phone support","placeholders","salesforce integration","search","spf","time","zendesk chat","australia","automation","automations","design","escalation","jira integration","merge tickets","tickets","toshiba","windows 7","app","buddha","dutch","expired account","google analytics","ifbyphone","olark","organization","placeholder","redmine","reseller","rest api","social media","starter","ticket fields","token","youtube","community","custom fields","get satisfaction","group","groups","hooray","invoice","language support","partners","russian","samanage","SAP","start up","webinars","word","asus","box","contact","email api","feature request","hebrew","help desk tools","iframe","ipad","jquery","knowledge","microsoft word 2007","new zendesk","open source","paypal","report","serscan.sys","settings","upgrade","views","benchmarking","beta","blackberry","cancel account","channels","domain","downloads","hootsuite","infographics","ios","java for android","migration","mobile app","multi brand","refund","Salesforce","self service","shader model","shader model 3.0","social empires","submit as","template","terms and conditions","Unsubscribe","white paper","windows","xxx","blu ray","business hours","career","customers","customize","danish","delete","email only helpdesk","fogbugz","forgot password","form","forms","Google search","how do I partition my seagate external drive for both pc and mac?","javascript","Lotus","mobile apps","multi-brand","organizations","partner","plugin","priority","recovery disk","RMA","satisfaction rating","shader model 3","SMS","spanish","startups","sulake","task","web portal","wiki","write protection","account","asterisk","attachments","call center","categories","change password","confluence","delete ticket","due date","embed","foursquare","freshdesk","glossary","helpdesk 2.0","hero tour","iomega","license","Loading","multi language","Multi-brand management","multibranding","palringo","php","pinterest","pivotal tracker","release notes","remote support","rest","sales force","screencast","sd card","services","shader model 2","shader model 2.0","signature","social","system requirements","tag","tasks","toshiba recovery disk","Twitter","white label","Wordpress","write protected","xbox","zappos","zendesk logo","zopim","amazon","arabic","audio driver","bios","boot camp","bootcamp 3.0","bug tracking","bulk import","charity","chat api","chinese","customer self service","customization","desk.com","dublin","email channel","email forwarding","email integration","events","extensions","facebook integration","feature requests","format","forums tutorial","Gooddata","hdmi","india","instagram","jp1082","kayako","keyboard shortcuts","Light Agents","multilingual","pending","sign up","single sign-on","solve360","sound card","subdomain","target","ticket field","university","voice pricing","wep key","what is an agent","wifi","wufoo","xero","academic","address","attachment","brazil","case study","cc","chat support","close account","custom css","customer","database","desktop","directx","ematic","ethernet controller","expatriate","freecell","gamification","gotoassist","Hooray","implementation","iPad","keyboard","light user","linkedin","lite agent","liveperson","localization","mac","merge","microsoft","mindtouch","multi branding","outlook express","pivotal","project management","remote control","sdk","shirt","shopify","sound","support tab","swedish","terms of service","ticket status","tip of the week","tips and tricks","tutorials","user guide","uservoice"],
          apiEndpoint: "https://www.googleapis.com/customsearch/v1",
          apiKey: "AIzaSyCMGfdDaSfjqv5zYoS0mTJnOT3e9MURWkU",
          cseID: "014141993897103097974:46gdqg1e99k"
      },

      // Binds all event listeners on init of our plugin
      this.bindEvents();
    },

  bindEvents: function(){
    // Hide shadow input on firefox
    if(navigator.userAgent.toLowerCase().indexOf('firefox') === -1) {
      // Sitewide search listeners
      universeSearch.vars.$searchField.suggest( universeSearch.vars.suggestTermIndex, {
        suggestionColor   : '#cccccc',
        moreIndicatorText : '',
        suggestionLeft   : '38px',
      });
    }

    // Pager click listener
    $(document).on('click', '.universe-search-pagination-item a', function(){
      ga('send', 'pageview', '/search/' + universeSearch.vars.$searchField.val() + '/page/' + $(this).text());

      var start = $(this).data('start');
      $(this)
        .parent()
        .addClass('active')
        .siblings()
        .removeClass('active');
        universeSearch.submitSearch(start);
      });

      // "Enter" listener for searchform
      $(document).on('keyup', universeSearch.vars.$searchField, function(e){
          // Check for carriage return
          if(e.which == 13){
            universeSearch.vars.$searchPaginationList.empty();
              universeSearch.submitSearch();
          }
      });

      universeSearch.vars.$searchClose.on('click', function(){
        universeSearch.vars.$search
            .slideUp(200)
              .find('input')
              .blur(); // so we're not "inside" form anymore
      });

      // General keyup listener for opening and closing search
      $(document).on('keydown', function(e) {
        var code = ( e.keyCode ? e.keyCode : ( e.which ? e.which : e.charCode ) );

        // If "esc" has been pressed
        if ( code == 27 ) {
          universeSearch.vars.$search
            .slideUp(200)
            .find('input')
            .blur(); // so we're not "inside" form anymore

          return false;
        }

        // Autofocus cursor in search field
        if( !($('html').hasClass('ie9')) ) {
          setTimeout( function() {
            $('.universe-search-input').focus();
          }, 100);
        }

      });
  },

  getResults: function(query,start){
      // Need offset of 1 because googs starts at 1, not 0
      start = (start === 0) ? 1 : start;
      $.ajax({
          url: universeSearch.vars.apiEndpoint,
          type: 'GET',
          dataType: 'jsonp',
          data: {
              key: universeSearch.vars.apiKey,
              cx: universeSearch.vars.cseID,
              q: query,
              start: start,
              num: 5
          },
          success: function(response) {
            if ( response.queries.request[0].totalResults > 0 ) {
              universeSearch.vars.$searchHelp.css('opacity',0);
                universeSearch.displayResults(response, start, query);
            } else {
              ga('send', 'pageview', '/search/' + query.replace(/\s+/g, '-').toLowerCase());

              universeSearch.tryAgain();
            }

            $('html, body').animate({ scrollTop: $(".universe-search").offset().top - 70 }, 600);
          }
      }); // end ajax
  },

  tryAgain: function(){
    // Empty pagination and results
    ( universeSearch.vars.$searchPaginationList, universeSearch.vars.$searchResultsDiv ).empty();
    // Hide pagination
    universeSearch.vars.$searchPagination.hide();
    // Show error copy
    if ( universeSearch.vars.$searchField.hasClass('small') ) {
      universeSearch.vars.$searchHelp
        .animate({'opacity': 0}, function() {

          $(this)
            .css({
              'top':'20px'
            })
            .animate({
              'opacity': 1,
              'right':'-50px'
            }, 100);
        });
    } else {
      universeSearch.vars.$searchHelp
        .animate({'opacity': 0}, function() {

          $(this)
            .css('top','30px')
            .animate({
              'opacity': 1
            }, 100);
        });
    }
  },

  displayResults: function(googleResponse, start, query){
    isOpen = true;

    $('.universe-search-input')
      .addClass('small')
      .siblings('div')
      .css({
        'font-size':'',
        'left':'',
        'letter-spacing':'',
        'top':''
      })
      .addClass('suggest-fixer')
      .empty() // Removes suggested text leftover before submit
      ;

    $('.universe-search-pagination').show();

    // Check if there are already results present
    if(!universeSearch.vars.$searchResultsDiv.html()) {
      ga('send', 'pageview', '/search/' + query.replace(/\s+/g, '-').toLowerCase());

      universeSearch.vars.$searchIcon.animate({
        'font-size':'30px',
        'margin-top':'3px'
      }, 100);

      universeSearch.vars.$searchField
        .animate({
          'font-size': '30px',
          'margin-left': '18px',
          'padding-top': '9px',
          'letter-spacing': '0px'
        }, 100, universeSearch.parseGoogleResponse(googleResponse) )
        .css('border-bottom','1px solid #ddd9d8')
      ;
    } else {
      if ( typeof start == 'undefined' ) {
        ga('send', 'pageview', '/search/' + query.replace(/\s+/g, '-').toLowerCase());
      }

      universeSearch.vars.$searchResultsDiv.empty();
      universeSearch.parseGoogleResponse(googleResponse, start);
    }

    $('.universe-search').animate({
      'height':'auto !important'
    });
  },

  parseGoogleResponse: function(response, start){
    var resultsMarkup = "",
        pagerMarkup = "",
        postTitle,
        postURL,
        postCategory,
        postDescription,
        resultsTotal = response.queries.request[0].totalResults,
        resultsJson = response.items,
        c = 1;

    // Loop through search results
    try {
      for (var i = 0; i < resultsJson.length; i++) {
        if(typeof response.items[i] != 'undefined') {
          postTitle =  ( typeof response.items[i].title != 'undefined' ) ? response.items[i].title : '[ Missing Title #sorry #googlefail ]' ;
          postURL =  ( typeof response.items[i].link != 'undefined' ) ? response.items[i].link : '';
          postDescription =  ( typeof response.items[i].snippet != 'undefined' ) ? response.items[i].snippet : '';

          // Generate markup for reach search result and add to array
          resultsMarkup += '<div class="universe-search-results-item">'+
                           '<a href="'+ postURL +'" class="universe-search-posttitle">'+ postTitle.substring(0,84) +'</a>' +
                           '<a href="'+ postURL +'" class="universe-search-posturi">'+ postURL.substring(0,125) +'</a>' +
                           '<p class="universe-search-results-description">'+ postDescription +'</p>' +
                           '</div>';
        }
      }
    } catch (e) {
      //console.log('error', e);
    }

    // Loop through results total to create pagination
    for (var r = 0; r < resultsTotal; r+=5) {
      if (c <= 9) {
        pagerMarkup += '<li class="universe-search-pagination-item"><a data-start="'+ r +'">'+ c +'</a></li>';
      }

      c++;
    }

    // Write results to DOM
    universeSearch.vars.$searchResultsDiv
      .append(resultsMarkup);

    // Creat pagination, but only if a pager has NOT been clicked
    if ( start === undefined ) {
      universeSearch.vars.$searchPagination.fadeIn().css('border-top', '1px solid #ddd9d8');
      universeSearch.vars.$searchPaginationList.append(pagerMarkup);
      universeSearch.vars.$searchPaginationList
        .find('li:first')
        .addClass('active');
    }
  },

  // Small func to check for
  submitSearch: function(start){
    if ( $('.universe-search-input').val() !== '' ) {
      universeSearch.getResults( $('.universe-search-input').val(), start , 10 );
    } else {
      universeSearch.tryAgain();
    }
  }
};
