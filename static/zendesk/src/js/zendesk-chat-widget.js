// Faux Form and chat widget setup
var zsc = {

  // Common things:
  $preflightForm: $("#preflight-form"),

  // form validation
  validateField: function(target) {
    var type   = target.attr('type'),
        pin, //    = target.parent().find('label'),
        fade; //fade   = (pin.css('opacity') === '1') ? false : true,
    if (type === 'select') {
      pin = target.parent().parent().find('label');
    } else {
      pin = target.parent().find('label');
    }
    fade = (pin.css('opacity') === '1') ? false : true;

    if(!webutils.isFieldValid(target)) {

      // Animate error message
      pin.css({
        'opacity' : ((fade === false) ? 1 : 0),
        'display' : 'block'
      })
      .animate({
        'opacity' : 1,
      }, 300);

      target
        .removeClass('set')
        .parent()
        .addClass('error');
    } else {
      pin.animate({
        'opacity' : 0,
      }, 200, function(){
        $(this).hide();
        target
          .parent()
          .removeClass('error');
      });

      target.addClass('set');
    }
  },
  // End form validation

  // Hide preflight form
  hidePreflight: function() {
    zsc.$preflightForm.hide();
  },

  // A shortcut to hide all the actual chat widget interface items
  hideAll: function() {
    this.zlc.button.hide();
    this.zlc.badge.hide();
    this.zlc.bubble.hide();
    this.zlc.window.hide();
  },
  setInfo: function(profile) {
    this.zlc.setName(profile.name);
    this.zlc.setEmail(profile.email);
    this.zlc.say(profile.message);

  },

  // Takes the information we gathered in the preflight form,
  // sends it to /app/v2/lead, which will do enrichment on the server side
  // and send to eloqua for nuture
  postEloqua:function(profile) {
    var fullName = webutils.splitName(profile.name);

    $.post("/app/v2/lead", {
      'owner': {
        "name": profile.name,
        'email': profile.email
      },
      'department':'',
      'industry':'',
      'account': {
        'name':'',
        'help_desk_size':''
      },
      'LastName': fullName.pop(),
      'FirstName': fullName.pop(),
      'elqFormName':'saleschatwidget',
      'elqSiteID':'2136619493',
      'elqCookieWrite':0,
      'elqCustomerGUID':'',
      'clearbitFieldAssociation': JSON.stringify({
        "owner[name]":"employeeName",
        "account[name]":"name",
        "department":"department",
        "industry":"category.sector",
        "account[help_desk_size]":"metrics.employees"
      })
    });
  },

  // Limit inbound chats to the sales team.
  connected: function() {
    zsc.zlc.departments.setVisitorDepartment('Sales');
    zsc.zlc.departments.filter('');

    var salesStatus   = zsc.zlc.departments.getDepartment('Sales');
    if (salesStatus && salesStatus.status === "online") {
      zsc.$preflightForm.show();
    } else {
      zsc.hideAll();
    }
  },

  // Suppress everything if the sales team goes offline
  statusChanged: function(status) {
    var salesStatus   = zsc.zlc.departments.getDepartment('Sales');
    if (salesStatus && salesStatus.status !== "online") {
      zsc.hideAll();
      zsc.$preflightForm.hide();
    }
  },

  // Initializes the Zendesk chat widget
  chatInit: function() {
    if (window.location.href.match(/\/product\/pricing/)) {
      zsc.zlc.setGreetings({'online':'Pricing Questions?','offline':'Leave a message'});
    } else {
      zsc.zlc.setGreetings({'online':'Chat with sales','offline':'Leave a message'});
    }
    zsc.zlc.addTags('www_chat_pilot');
    zsc.zlc.theme.setColor('#03363D');
    zsc.zlc.window.onHide(function() {
      zsc.zlc.button.show();
    });

    zsc.zlc.setOnConnected(zsc.connected);
    zsc.zlc.setOnStatus(zsc.statusChanged);
  },

  // End Zendesk Chat widget

  preflightInit: function() {
    zsc.$preflightForm.children(".preflight-form-wrapper.closed").on("click", function(){
      zsc.$preflightForm.addClass("active");
    });
    zsc.$preflightForm.find(".preflight-form-wrapper.open .preflight-header").on("click", function(){
      zsc.$preflightForm.removeClass("active");
    });

    // shortcut to reference $zopim.livechat for functions that need to happen in the $zopim() scope
    $zopim(function() {
      zsc.chatInit();
    });

    if (window.location.href.match(/\/product\/pricing/)) {
      $("#preflight-form").find(".preflight-form-wrapper.closed .message").text("Pricing Questions?");
    }


    // Attach handlers
    $('#preflight-profile-form')
      .on('blur', '.required', function(){
        if($(this).attr('data-state') != 'active') {
          $(this).attr('data-state', 'active');
        }

        zsc.validateField($(this));
    });

    $('#preflight-profile-form')
      .find(".preflight-btn.submit")
      .on("click", function(e) {
        e.preventDefault();

        var profile = {};

        $('#preflight-profile-form').find(".required").each(function() {
          zsc.validateField($(this));
          profile[$(this).attr("name")] = $(this).attr("value");
        });

        // This has to do a fresh query of the dom, so cant use a previous reference to the form
        if ($('#preflight-profile-form').find(".error").length === 0) {
          zsc.setInfo(profile);
          zsc.postEloqua(profile);
          zsc.hidePreflight();
        }

      });
  }
}
$zopim(function(){
  zsc.zlc = $zopim.livechat;
  zsc.hideAll();
});
if (!_isMobile && window.location.host === 'www.zendesk.com') {
  $.get("/app/showchat", function(data) {
    if (data && data.showChat) {
      zsc.preflightInit();
    }
  });
}
