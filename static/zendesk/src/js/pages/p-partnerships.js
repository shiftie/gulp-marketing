$(function () {
  /**
   * Randomize array element order in-place.
   * Using Durstenfeld shuffle algorithm.
   */
  function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  var shuffledLogos = shuffleArray(logoUrls);
  var logos = $('.our-partners .logos');

  for (var i = 0; i < 9; i++) {
    var logo = $('<li>').css('background-image',
      'url(' + shuffledLogos[i] + ')');
    logos.append(logo);
  }

  /**
   * Learn More button scroll
  **/
  $('.js-learn-more').on('click', function(e) {
    e.preventDefault();
    var element = $(this).attr('href');
    $('html, body').animate({
        scrollTop: $(element).offset().top
    }, 400);
  });

  /**
   * Hero slot machine
  **/
  $leftWheel = $('.slot-wheel-left');
  buildSlotWheels($leftWheel, leftItems);

  $rightWheel = $('.slot-wheel-right');
  buildSlotWheels($rightWheel, rightItems);

  var $slotItem = $('.slot-wheel-right .item');

  if ($slotItem.length > 0) {
    var itemIndex = spin();
    setInterval(respin, 7000);
  }
});

var leftItems = [
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-macaroni.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cookie.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-slingshot.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-egg.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-macaroni.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cookie.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-slingshot.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-egg.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-macaroni.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cookie.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-slingshot.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-egg.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-macaroni.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cookie.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-slingshot.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-egg.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-macaroni.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cookie.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-slingshot.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-egg.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-macaroni.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cookie.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-slingshot.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-egg.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-macaroni.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cookie.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-slingshot.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-egg.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-macaroni.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cookie.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-slingshot.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-egg.svg'
];

var rightItems = [
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cheese.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-milk.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-pebbles.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-bacon.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cheese.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-milk.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-pebbles.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-bacon.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cheese.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-milk.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-pebbles.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-bacon.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cheese.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-milk.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-pebbles.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-bacon.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cheese.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-milk.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-pebbles.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-bacon.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cheese.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-milk.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-pebbles.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-bacon.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cheese.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-milk.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-pebbles.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-bacon.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-cheese.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-milk.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-pebbles.svg',
  '//d1eipm3vz40hy0.cloudfront.net/images/p-partnerships/slot-bacon.svg'
];

function buildSlotItem (imgURL, imgKey) {
  return $('<li class="item item-'+ imgKey +'" style="background-image: url('+ imgURL +');"></li>');
}

function buildSlotWheels ($container, itemsArray) {
  $items = itemsArray.map(buildSlotItem);
  $container.append($items);

  return false;
}

function randomItemIndex(max) {
  var randomIndex = (Math.random() * max | 0);
  return (randomIndex >= 10) ? randomIndex : randomItemIndex(max);
}

function spin(index) {
  var leftWheelIndex  = randomItemIndex(leftItems.length - 1);
  var rightWheelIndex = leftWheelIndex;

  $leftWheel.animate({
    top: -leftWheelIndex*280
  }, 2500, 'easeOutBack');

  $rightWheel.animate({
    top: -rightWheelIndex*280
  }, 3000, 'easeOutBack');

  return leftWheelIndex;
}

function reset() {
  $leftWheel.animate({
    top: 0
  }, 500, 'linear');

  $rightWheel.animate({
    top: 0
  }, 500, 'linear');

  return false;
}

function respin() {
  reset();
  spin();

  return false;
}
