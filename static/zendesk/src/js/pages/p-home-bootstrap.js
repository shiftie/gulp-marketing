;(function() {
  /**
   * Stores a reference to storage, as well as some default page urls.
   */
  var storage, homeKey, homeTypes, enterpriseEmployeeCount;

  /**
   * Cookie key at which to store the home type.
   */
  homeKey = 'homeType';

  /**
   * Mapping of homeTypes to their values.
   */
  homeTypes = {
    standard:           '/standardhome',
    enterprise:         '/enterprisehome',
    customer:           '/customerhome',
    enterprisecustomer: '/enterprisecustomerhome',
    trial:              '/trialhome'
  };

  /**
   * Minimum number of employees to be considered enterprise.
   */
  enterpriseEmployeeCount = 1000;

   /**
    * dbase global variable should be injected by the DemandBase script.
    */
  if (typeof dbase === 'undefined') {
    dbase = {};
  }

  dbase = dbase || {};

  /**
   * A complete cookies reader/writer framework with full unicode support.
   * Revision #1 - September 4, 2014
   *
   * Source:
   * https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
   *
   * This framework is released under the GNU Public License, version 3 or later.
   * http://www.gnu.org/licenses/gpl-3.0-standalone.html
   *
   *   docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
   *   docCookies.getItem(name)
   *   docCookies.removeItem(name[, path[, domain]])
   *   docCookies.hasItem(name)
   *   docCookies.keys()
   */
  var docCookies = {
    getItem: function (sKey) {
      if (!sKey) { return null; }
      return decodeURIComponent(document.cookie.replace(new RegExp(
        "(?:(?:^|.*;)\\s*" +
        encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") +
        "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },

    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
      if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
        return false;
      }
      var sExpires = "";
      if (vEnd) {
        switch (vEnd.constructor) {
          case Number:
            sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
            break;
          case String:
            sExpires = "; expires=" + vEnd;
            break;
          case Date:
            sExpires = "; expires=" + vEnd.toUTCString();
            break;
        }
      }
      document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) +
        sExpires + (sDomain ? "; domain=" + sDomain : "") +
        (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");

      return true;
    },

    removeItem: function (sKey, sPath, sDomain) {
      if (!this.hasItem(sKey)) { return false; }
      document.cookie = encodeURIComponent(sKey) +
        "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
        (sDomain ? "; domain=" + sDomain : "") +
        (sPath ? "; path=" + sPath : "");

      return true;
    },

    hasItem: function (sKey) {
      if (!sKey) { return false; }
      return (new RegExp("(?:^|;\\s*)" +
        encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") +
        "\\s*\\=")).test(document.cookie);
    },

    keys: function () {
      var pattern = /((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g;
      var aKeys = document.cookie.replace(pattern, "").split(/\s*(?:\=[^;]*)?;\s*/);
      for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
        aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
      }
      return aKeys;
    }
  };

  /**
   * Simple cross-browser ajax GET function as an alternative to loading
   * all of jQuery.
   *
   * @param {string}   url      The url to laod
   * @param {function} callback The function to invoke on completion
   */
  function ajaxGet(url, callback) {
    try {
      var req;
      if (XMLHttpRequest) {
        req = new XMLHttpRequest('MSXML2.XMLHTTP.3.0');
      } else {
        req = new ActiveXObject('MSXML2.XMLHTTP.3.0');
      }

      req.open('GET', url, 1);
      req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

      req.onreadystatechange = function() {
        if (req.readyState > 3 && callback) {
          callback(req.responseText, req);
        }
      };

      req.send();
    } catch (e) {
      if (window.console) console.log(e);
    }
  }

  /**
   * A cross-browser alternative to innerHTML that allows its use on
   * all elements in IE9.
   *
   * @param {Element} element A DOM element
   * @param {string}  html    The HTML by which to replace
   */
  function updateHTML(element, html) {
    try {
      element.innerHTML = html;
    } catch (e) {
      // Unable to use innerHTML on some elements in IE9 and lower
      // (e.g. head)
      element.textContent = '';
      element.insertAdjacentHTML('beforeend', html);
    }
  }

  /**
   * Inserts and loads a script for the given url, creating the element
   * and adding it as a child to the supplied target. On load, the callback
   * is invoked. Allows for in-order asynchronous loading.
   *
   * @param {string}      url      The url to load
   * @param {HTMLElement} target   Element on which to append to the node
   * @param {function}    callback The callback function to invoke
   */
  function loadScript(url, target, callback) {
    var script, done;

    script = document.createElement('script');
    script.src = url;
    done = false;

    // Attach handlers for all browsers
    script.onload = script.onreadystatechange = function() {
      if (!done && (!this.readyState || this.readyState === "loaded" ||
          this.readyState === "complete")) {
        done = true;
        callback();

        // Handle memory leak in IE
        script.onload = script.onreadystatechange = null;
        if (target && script.parentNode) {
          target.removeChild(script);
        }
      }
    };

    target.insertBefore(script, target.firstChild);
  }

  /**
   * Inserts and loads a script with the given string.
   *
   * @param {string}      text     The script's contents
   * @param {HTMLElement} target   Element on which to append to the node
   * @param {function}    callback The callback function to invoke
   */
  function loadScriptText(text, target, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = text;

    target.insertBefore(script, target.firstChild);

    callback();
  }

  /**
   * Runs all script tags loaded in the document after rendering the
   * correct view. This is done by re-inserting them as DOM nodes, rather
   * than as part of innerHTML. All scripts are loaded in order, and added
   * to their respective parents.
   */
  function runScripts() {
    var collection, scripts, i;

    collection = document.getElementsByTagName('script');

    // Build an array from the htmlcollection
    scripts = [];
    for (i = 0; i < collection.length; i++) {
      scripts.push(collection.item(i));
    }

    var recursiveAdd = function(i) {
      if (i >= scripts.length) return;

      var oldScript = scripts[i];
      var fn = function() {
        if (oldScript.parentNode) {
          oldScript.parentNode.removeChild(oldScript);
        }

        return recursiveAdd(++i);
      };

      if (oldScript.text) {
        loadScriptText(oldScript.text, oldScript.parentNode, fn);
      } else {
        loadScript(oldScript.src, oldScript.parentNode, fn);
      }
    };

    recursiveAdd(0);
  }

  /**
   * Polls the page for the new screen.css having been loaded by checking
   * that a bootstrap specific computed style has been applied. Upon
   * loading, or after a maximum time limit has been met, the passed
   * callback function is invoked.
   *
   * @param {function} callback The callback to invoke after the stylesheet
   *                            has been loaded
   */
  function poll(callback) {
    var bootstrap, interval, done;

    // Polling is done by checking for "position: absolute" on
    // bootstrap. The style is applied via screen.css
    bootstrap = document.getElementById('bootstrap');

    stylesheetLoaded = function() {
      if (window.getComputedStyle) {
        // IE9 > supports getComputedStyle
        var style = window.getComputedStyle(bootstrap);
        return (style.getPropertyValue('position') === 'absolute');
      } else if (bootstrap.currentStyle) {
        // IE8 and lower uses currentStyle
        return (bootstrap.currentStyle.position === 'absolute');
      }

      return false;
    };

    // Poll every 100ms
    interval = setInterval(function() {
      if (!stylesheetLoaded()) return;

      done = true;
      clearInterval(interval);
      callback();
    }, 100);

    // Allow up to 10 seconds to get/parse the stylesheet
    setTimeout(function() {
      if (done) return;

      clearInterval(interval);
      callback();
    }, 10000);
  }

  /**
   * Renders the page at the given URL, injecting its DOM in both
   * the head and body of the document, and initializing all scripts.
   * Polls the page to check that the new CSS has loaded before
   * replacing the body.
   *
   * @param {string} url The URL of the page to load
   */
  function displayPage(url) {
    ajaxGet(url, function(data) {
      var head, body, headHTML, bodyHTML, parsed, renderBody;

      // Extract new head and body
      head = document.getElementsByTagName('head')[0];
      body = document.getElementsByTagName('body')[0];

      parsed = data.split('<head>')[1];
      parsed = parsed.split('</head>');
      headHTML = parsed[0];

      parsed = parsed[1].split(/<body[^>]*>/)[1];
      parsed = parsed.split('</body>');
      bodyHTML = parsed[0];

      // Apply a direct bg color and load the updated HEAD
      body.style.backgroundColor = '#f6f6f6';

      updateHTML(head, headHTML);

      renderBody = function() {
        updateHTML(body, bodyHTML);
        runScripts();
      };

      poll(renderBody);
    });
  }

  /**
   * Invokes cross-storage as well as a demandBase to determine the
   * visitor type and present them with their intended home page. CrossStorage
   * is given a maximum of 2 seconds to determine whether or not the user
   * is an existing customer. If successful, DemandBase is access to determine
   * whether or not they're a potential enterprise lead, and a cookie is set
   * to speedup future visits to the home page. If we fail to connect to
   * CrossStorage, demandBase is not contacted and no cookie is set.
   */
  var directVisitor = function() {
    var timeout, handlePage;

    // Give cross-storage 2s to attempt a connection
    timeout = setTimeout(function() {
      storage.close();
      displayPage(homeTypes.standard);
    }, 2000);

    handlePage = function(type) {
      var ttl, expire;

      if (type === 'standard' || type === 'enterprise') {
        // Leads have a cookie that expires after 5 minutes
        ttl = 60 * 5 * 1000;
      } else {
        // Customers/trialers expire after 24 hours
        ttl = 60 * 60 * 24 * 1000;
      }

      expire = new Date(new Date().getTime() + ttl);
      docCookies.setItem(homeKey, type, expire);
      displayPage(homeTypes[type]);
    };

    storage = new CrossStorageClient('https://www.zndsk.com/hub.html');

    storage.onConnect().then(function() {
      return storage.getKeys();
    }).then(function(keys) {
      if (!keys || !keys.length) return;

      // Keys containing subdomain info follow the format:
      // "userInfo:subdomain"
      var subdomains = [];
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].split(':')[0].indexOf('userInfo') !== -1) {
          subdomains.push(keys[i]);
        }
      }

      // TODO: Update logic to return the highest priority plan
      // subdomain (e.g. Enterprise > Plus > Regular > Starter > Trial)

      if (subdomains.length) {
        // Use the first subdomain for now
        return storage.get(subdomains[0]);
      } else {
        return Promise.resolve();
      }
    }).then(function(res) {
      clearTimeout(timeout);

      if (res && res.customerType) {
        if (res.customerType === 'trial') {
          handlePage('customer');
        } else if (res.planName === 'Enterprise' || res.planName === 'Plus') {
          handlePage('enterprisecustomer');
        } else {
          handlePage('customer');
        }
      } else if (dbase.employee_count >= enterpriseEmployeeCount) {
        handlePage('enterprise');
      } else {
        handlePage('standard');
      }
    })['catch'](function() {
      // Intentionally left blank
    });
  };

  /**
   * It all comes down to this. We avoid cross-storage if a cookie is set with
   * the home page type.
   */
  var type = docCookies.getItem(homeKey);
  if (type && homeTypes[type]) {
    displayPage(homeTypes[type]);
  } else {
    directVisitor();
  }
}());
