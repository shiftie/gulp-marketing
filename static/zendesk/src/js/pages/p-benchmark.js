/**
* Pulling data from Benchmark API to populate benchmark page
* @author  Stephany Varga
* @since   10/22/14
* @class   BenchmarkData
*/
var BenchmarkData = {

  init: function() {

    var self = this;

    $(window).load(function() {

      // Speedometer Animation Helper
      $("#wand").bind('animationend webkitAnimationEnd MSAnimationEnd', function() {
          $('#marker').fadeIn('fast');
      });
      $('#industry-benchmark .col-right li#target-it').addClass('active');

      var clicked = false
        , cta = $('.btn-cta');

      //self.scrollList(17);

      $('#industry-benchmark li').click(function(e){

        var satisfaction = $('#global-customer-satisfaction').text().replace(/\s+/g, '').substr(0, 2)
          , response = $('#global-first-response-time').text().replace(/\s+/g, '').substr(0, 2)
          , liActive = $('#benchmark-table li.active')
          , h1fill = $(this).attr('data-type')
          , title = $(this).text()
          , data1 = $(this).attr('data-customer-satisfaction')
          , data2 = $(this).attr('data-first-response-time')
          , data3 = $(this).attr('data-tickets-per-month')
          , scroll
          , compareTitle = $(this).parent().attr('id');

        if (compareTitle == 'list3') {
          compareTitle = 'Company Size';
        } else if (compareTitle == 'list2') {
          compareTitle = 'Target Audience';
        } else {
          compareTitle = 'Industry';
        }

        $('.compare-title').html(compareTitle);

        clearInterval(scroll);
        $('.col-left h1 span').html(h1fill);
        $('#benchmark-table h2').html('').prepend(title).hide().fadeIn('slow');

        $('#industry-benchmark .col-right').find('li').removeClass('active');
        $(this).addClass('active');
        self.utilityBelt($('#rest-customer-satisfaction span:first'), data1, 100, 10, satisfaction <= data1.substr(0, 2) || data1.substr(0, 2) == '10');
        self.utilityBelt($('#rest-first-response-time span:first'), data2, 100, 20, response >= data2.substr(0, 2));
        self.utilityBelt($('#rest-tickets-per-month span:first'), data3, 100, 30);

        clicked = true;
        e.preventDefault();
      });
    });

  },

  scrollList: function(len) {
    var li  = $('#benchmark-table #industry-benchmark li')
      , i   = 0
      , len = len
      , self = this
      , scroll;

    scroll = setInterval(function(){
      if (i <= len) {

        var active = $('#benchmark-table li.active')
          , satisfaction = $('#global-customer-satisfaction').text().replace(/\s+/g, '').substr(0, 2)
          , response = $('#global-first-response-time').text().replace(/\s+/g, '').substr(0, 2);

        active.removeClass('active').next().addClass('active');

        var active = $('#industry-benchmark li.active')
          , h1fill = active.attr('data-type')
          , data1 = active.attr('data-customer-satisfaction')
          , data2 = active.attr('data-first-response-time')
          , data3 = active.attr('data-tickets-per-month');

        $('.col-left h1 span').html(h1fill);
        $('#benchmark-table h2').html('').prepend(active.text()).hide().fadeIn('slow');
        self.utilityBelt($('#rest-customer-satisfaction span:first'), data1, 100, 10, satisfaction <= data1.substr(0, 2) || data1.substr(0, 2) == '100');
        self.utilityBelt($('#rest-first-response-time span:first'), data2, 100, 20, response >= data2.substr(0, 2));
        self.utilityBelt($('#rest-tickets-per-month span:first'), data3, 100, 30);
        i++;
      }
      else {
        clearInterval(scroll);

        if ($('#target-web-apps').hasClass('active')) {
          $('#list2').find('li:first').addClass('active');
          $('#target-web-apps').removeClass('active');
          scrollList(1);
        }
        if ($('#target-internal').hasClass('active')) {
          $('#list3').find('li:first').addClass('active');
          $('#target-internal').removeClass('active');
          scrollList(3);
        }
        if ($('#target-5000-').hasClass('active')) {
          $('#list1').find('li:first').addClass('active');
          $('#target-5000-').removeClass('active');
          scrollList(17);
        }
      }

    }, 5000);
  }, //scrllList

  utilityBelt: function(target, data, interval, ceiling, global) {
    var count = 0;
    var random = setInterval(function(){
      if (count < ceiling) {
        target.html('').prepend(Math.floor(Math.random()*100));
        count++;
      }
      else {
        clearInterval(random);
        target.html('').hide().append(data).fadeIn();;
        if (global == true) {
          target.siblings().remove('div.face');
          target.parent().append('<div id="happy" class="face"></div>');
        }
        else if (global == false) {
          target.siblings().remove('div.face');
          target.parent().append('<div id="sad" class="face"></div>');
        }
      }
    }, interval);
    target.siblings().remove('div.face');
  } //utiltiyBelt

};
