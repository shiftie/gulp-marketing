window.AppsMarketplacePage = {

  // utils //

  queryQueue: null, // shared global timer queue
  activeFilter: false, // does the list have filters that need to be reset
  appIconsLoaded: false, // have all the app icons been loaded

  /**
   * Assumes templateSelector selects exactly one elm.
   * This elm is expected to have a "hidden" class on it.
   */
  getTemplatePopulator: function(templateSelector, elmInstanceCreator, containerSelector) {
    var template = $(templateSelector);
    var container;

    if (containerSelector) {
      container = $(containerSelector);
      // do not remove template from dom, since if container is specified, it's implied this template will be used in multiple locations.
    } else {
      container = template.parent();
      template.remove();
    }

    return {
      put: function(data) {
        compose(data).appendTo(container.empty());
      },
      append: function(data) {
        compose(data).appendTo(container);
      }
    };

    function compose(data) {
      return data
        .map(function(datum) {
          var elm = template.clone().removeClass('hidden');
          return elmInstanceCreator(datum, elm) || elm;
        })
        .reduce(function(selAll, nextElm) {
          return selAll.add(nextElm);
        }, $());
    }
  },

  /**
   * Returns a throttled version of any function that runs it a maximum of 1 time per minInterval.
   * The throttled function does not return anything.
   */
  getThrottledFn: function(fn, minInterval) {
    var canRunNow = true;
    var hasRunScheduled = false;

    return function() {
      var ctx = this;
      var args = arguments;

      function runNow() {
        canRunNow = false;
        fn.apply(ctx, args);
        setTimeout(function() {
          if (hasRunScheduled) {
            hasRunScheduled = false;
            runNow();
          } else {
            canRunNow = true;
          }
        }, minInterval);
      }

      if (canRunNow) {
        runNow();
      } else {
        hasRunScheduled = true;
      }
    };
  },

  // specific to apps marketplace //

  urlDetails: function(appName) {
    // use dash to make url clean. We assume that there will be no app with dashes in its name.
    var slug = encodeURIComponent(appName.toLowerCase().replace(/\s/g, '-'));
    return '/apps/' + slug;
  },

  urlInstall: function(subdom, appId) {
    return subdom + '/agent/admin/apps/install/' + appId;

    // note, it used to be...
    // var slug = appName.toLowerCase().replace(/\s/g, '_'); // underscore not dash
    // return subdom + '/agent/admin/apps/details/' + slug;
  },

  init: function() {

    function searchCallback(content) {
      if (content.query !== $('input[name="apps-filter-search"]').val()) {
        // do not take out-dated answers into account
        return;
      }
      var numResults = content.hits.length;
      if (numResults === 0 || content.query === '') {
        // no results
        $('#hits').empty();
        $('.search-reveal').removeClass('open');
        return;
      }
      $('.search-reveal').addClass('open');
      // Scan all hits and display them
      var html = '<div class="search-inner-contents"><div class="search-apps-label">Apps</div>';
      for (var i = 0; i < numResults && i < 5; ++i) {
        var hit = content.hits[i];
        var logoURL = hit.icon_url;
        logoURL = logoURL.replace(/\<\/?em\>/g, '');
        var appName = hit._highlightResult['name'].value.replace(/~[^a-zA-Z0-9\s_-]+~/g, '').toLowerCase();
        appName = appName.replace(/\s/g, '-');
        var appURL = hit.url;
        appURL = appURL.replace(/\<\/?em\>/g, '');
        html += '<div class="hit">';
        html += '<a href="' + appURL + '"><div class="search-app-box"><div class="img-wrap"><div style="background-image: url(\'' + logoURL + '\')"></div></div><span class="search-app-name">' + hit._highlightResult['name'].value + '</span></div></a>';
        html += '</div>';
      }
      if (numResults > 5) {
        var moreResults = numResults - 5;
        html += '<a id="more-results" class="more-results">' + moreResults + ' more</a>';
      }
      html += '</div>';
      $('#hits').html(html);
      $('#more-results').attr('href', '/apps/directory/?q=' + content.query);
    }
    function searchCatCallback(content) {
      if (content.query !== $('input[name="apps-filter-search"]').val()) {
        // do not take out-dated answers into account
        return;
      }
      var numResults = content.hits.length;
      if (numResults === 0) {
        // no results
        $('#search-cats').empty();
        return;
      }
      // Scan all hits and display them
      var html = '<div class="search-inner-contents"><div class="search-apps-label">Categories</div>';
      for (var i = 0; i < numResults; ++i) {
        var hit = content.hits[i];
        var iconClass = hit.key;
        var hash = hit.name.replace(/\s/g, '_');
        html += '<a href="/apps/directory/#' + hash + '"><div class="cat-hit">';
        html += '<div class="cat-icon ' + iconClass + '"></div><div class="cat-name">' + hit.name + '</div>';
        html += '</div></a>';
      }
      html += '</div>';
      $('#search-cats').html(html);
    }

    $(document).ready(function() {
      var $inputfield = $('input[name="apps-filter-search"]');
      var appCount = $inputfield.attr('placeholder').replace(/\D/g, '');
      var client = $.algolia.Client('7Z3RM3E33J', '7cd7b8cab3ab404c5976fb068e141cf8');
      var index = client.initIndex('appsIndex');
      var catIndex = client.initIndex('catIndex');
      $inputfield.keyup(function() {
        index.search($inputfield.val(), { hitsPerPage: 1000 })
          .done(searchCallback)
          .fail(function(content) { console.log('Error', content); });
        catIndex.search($inputfield.val(), { hitsPerPage: 3 })
          .done(searchCatCallback)
          .fail(function(content) { console.log('Error', content); });
      }).focus().closest('form').on('submit', function() {
        // on form submit, store the query string in the anchor
        location.replace('/apps/directory/?q=' + encodeURIComponent($inputfield.val()));
        return false;
      });

      $(document).click(function(e) {
        if (!$(e.target).closest('#search-full').length) {
          if ($('.search-reveal').is(":visible") || !$inputfield.is(':focus')) {
            $inputfield.attr('placeholder', 'Search over ' + appCount + ' apps').val('').keyup();
            $('.search-input-box').removeClass('active');
          }
        }
      });

      $inputfield.focus(function() {
        $(this).attr('placeholder', 'Enter search terms');
        $('.search-input-box').addClass('active');
      });

      var sortRatingIndex =  client.initIndex('appsIndex_rating_desc');
      var sortCreatedIndex = client.initIndex('appsIndex_created_desc');
      var indices = {
        '#most-highly-rated' : sortRatingIndex,
        '#new-apps' : sortCreatedIndex
      };

      // default to most highly rated initially
      searchSlaves(sortRatingIndex, $('#most-highly-rated'));

      $('#apps-section-switcher').change(function() {
        var selected = '#' + $(this).find('option:selected').attr('value');
        searchSlaves(indices[selected], $(selected));
        // allow some time for apps to get fetched
        setTimeout(function() {
          $('.appz-list .app-tiles-wrap').hide();
          $(selected).show();
        }, 700);
      });

      function searchSlaves(index, container) {
        var dataSource = (index == sortRatingIndex) ? 'top_rated' : 'new_apps';

        index.search('', { hitsPerPage: 12 })
        .done(function(content) {
          if (content.hits.length) {
            var results = '';
            for (var i = 0; i < content.hits.length; ++i) {
              var hit = content.hits[i];
              var appName = hit.name.replace(/~[^a-zA-Z0-9\s_-]+~/g, '').toLowerCase();
              appName = appName.replace(/\s/g, '-');
              var appURL = hit.url;
              if (!hit.paid) {
                hit.pricing = '';
              }
              results += '<li class="app-item"><a href="' + appURL + '?source=' + dataSource + '" class="reset-color SL_norewrite"><figure><div class="img-wrap"><div style="background-image: url(\'' + hit.icon_url + '\')"></div></div></figure></a>';
              results += '<div class="details"><a href="' + appURL + '?source=' + dataSource + '" class="reset-color SL_norewrite"><span class="app-title">' + hit.name + '</span></a><div class="app-rating"><span class="rating-stars stars-' + hit.rating.average + '"></span><span class="app-review-num"> (' + hit.rating.total_count + ')</span></div><span class="app-price part-apps-marketplace-install-trigger" data-source=' + dataSource + ' data-app-name="' + hit.name + '">' + hit.amount + '</span><span class="app-plan-type">' + hit.pricing + '</span>';
              results += '<div id="' + hit.id + '" class="hidden"><span class="how-to">' + hit.installation_instructions + '</span></div></div></li>';
            }
          }
          container.html(results);
        });
      }
      function createDropDown() {
        // create fake select so we can style it
        var source = $('#apps-section-switcher');
        var selected = source.find('option:selected');
        var options = $('option', source);
        $('.app-category-dropdown').append('<dl id="highlighted" class="dropdown"></dl>');
        $('#highlighted').append('<dt><span class="selected">' + selected.text() + '<span class="value">' + selected.val() + '</span></span></dt>');
        $('#highlighted').append('<dd><ul></ul></dd>');
        options.each(function(){
          $('#highlighted dd ul').append('<li><span class="option">' + $(this).text() + '<span class="value">' + $(this).val() + '</span></span></li>');
        });
      }
      $inputfield.blur();
      createDropDown();
    });
  }
};
