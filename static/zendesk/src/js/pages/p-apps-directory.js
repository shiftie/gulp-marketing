var AppsDirectory = {

  init: function() {
    function switchHeader() {
      if (search.helper.lastResults.query && search.helper.lastResults.nbHits > 0) {
        $("#stats .ais-stats--body").show();
        $('.directory-heading .directory-title').text(' for \'' + search.helper.lastResults.query + '\'');
      }
      else {
        $("#stats .ais-stats--body").hide();
        if (location.search) {
          $('.directory-heading .directory-title').text('App directory');
        }
      }
    }

    var cursor, index, page, nbPages, loading;

      var infiniteScrollWidget = function(options) {
        var container = document.querySelector(options.container);
        var templates = options.templates;

        if (!container) {
          throw new Error('infiniteScroll: cannot select \'' + options.container + '\'');
        }

        return {
          render: function (args) {
            helper = args.helper;
            page = args.state.page;
            nbPages = args.results.nbPages;

            var scope = {
              templates: templates,
              container: container,
              args: args
            };

            switchHeader();

            if (args.results.nbHits) {
              $('.directory-filter').css('display', 'inline-block');
              document.getElementById("view-more-apps").addEventListener('click', searchNewRecords.bind(scope));
            }
            else {
              $('.directory-filter').hide();
            }

            initialRender(container, args, templates);
          }
        };
      };
      var infiniteScrollWidget = infiniteScrollWidget({
        container: '#hits',
        templates: {
          items: document.querySelector('#hit-template').innerHTML,
          empty: document.querySelector('#no-results-template').innerHTML
        }
      });

      var searchBoxWidget = instantsearch.widgets.searchBox({
        container: '#search-input'
      });

      var search = instantsearch({
        appId: '7Z3RM3E33J',
        apiKey: '7cd7b8cab3ab404c5976fb068e141cf8', // search only API key
        indexName: 'appsIndex',
        urlSync: true
      });

    search.addWidget(
      instantsearch.widgets.stats({
        container: '#stats'
      })
    );

    search.addWidget(
      instantsearch.widgets.clearAll({
        container: '#clear-filters',
        templates: {
          link: 'Clear filters'
        },
        autoHideContainer: false
      })
    );

    var renderTemplate = function(template, res){
      var results = document.createElement('div');
      results.innerHTML = Mustache.render(template, res);
      return results;
    };

    var initialRender = function(container, args, templates, parent){
      if (args.results.nbHits) {
        args.results.pageNo = page + 1;
        var results = renderTemplate(templates.items, args.results);
        switchHeader();
        $('.directory-filter').css('display', 'inline-block');
        $('#display-num-results .current-num-results').html(args.results.hits.length);
        $('#display-num-results .total-num-results').html(args.results.nbHits);
        if (page === args.results.nbPages - 1) {
          $('#display-num-results').parent().hide();
        }
        else {
          $('#display-num-results').parent().show();
        }
      } else {
        $('.directory-filter').hide();
        $('#display-num-results').parent().hide();
        var results = renderTemplate(templates.empty, args.results);
        results.querySelector('.clear-all').addEventListener('click', function(e){
          e.preventDefault();
          helper.clearRefinements().setQuery('').search();
        });
      }

      container.innerHTML = '';
      $('.loading-spinner').hide();
      container.appendChild(results);
    };


    var hitsDiv = document.getElementById('hits');

    var searchNewRecords = function(){
      addSearchedRecords.call(this);
    };

    var addSearchedRecords = function(){
      if (!loading && page < nbPages - 1) {
        loading = true;
        page += 1;
        helper.searchOnce({page: page}, appendSearchResults.bind(this));
      }
    };

    var appendSearchResults = function(err, res, state){
      $('.loading-spinner').show();
      page = res.page;
      res.pageNo = page + 1;
      loading = false;

      var result = renderTemplate(this.templates.items, res);
      $('.loading-spinner').hide();
      this.container.appendChild(result);

      var numPrevResults = parseInt($('#display-num-results .current-num-results').html());
      var numShowingResults = numPrevResults + this.args.results.hits.length;
      if (page === nbPages - 1) {
        // $('#display-num-results .current-num-results').html(this.args.results.nbHits);
        $('#display-num-results').parent().hide();
      }
      else {
        $('#display-num-results .current-num-results').html(numShowingResults);
        $('#display-num-results').parent().show();
      }

      if (page === nbPages - 1 && (this.args.results.nbHits > nbPages * this.args.results.hitsPerPage)){
        index = helper.client.initIndex(this.args.state.index);
        document.getElementById('view-more-apps').removeEventListener('click', searchNewRecords.bind(this));
      }
    };

    search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#category',
        attributeName: 'categories.name',
        limit: 100
      })
    );
    search.addWidget(
      instantsearch.widgets.starRating({
        container: '#rating',
        attributeName: 'rating.average',
        max: 5,
        labels: {
          andUp: '& Up'
        }
      })
    );
    search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#plan_price',
        attributeName: 'pricing'
      })
    );
    search.addWidget({
      init: function(options) {
        if (location.hash) {
          var category = location.hash.substring(1).replace(/\?.*/g, '').replace(/_/g, ' ');
          options.helper.toggleRefinement('categories.name', category);
          $('.directory-title').text(category);
        }
      }
    });

    search.addWidget(searchBoxWidget);
    search.addWidget(infiniteScrollWidget);
    search.start();

    $(document).ready(function() {
      $('#search-form').on('submit', function() {
        return false;
      });
    });
  }
};

