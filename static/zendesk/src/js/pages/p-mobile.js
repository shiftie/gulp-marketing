$(function() {

  //
  // Mobile number submission form
  //

  // State/elements

  var isLoading = false;
  var $form = $('#mobile-product-form');
  var $input = $form.find('input[type="text"]');
  var $message = $form.find('.field-message');
  var $formCta = $form.find('.cta-button');

  // Handlers

  function onFormSubmit(e) {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    isLoading = true;

    $message.text('');

    $form
      .addClass('loading')
      .removeClass('error success');

      var $numberInput = $("#mobile-product-form input").val();
      var $validate = /(.*\d.*){10}/;

      function isValidPhoneNumber(phoneNumber) {
        return $validate.test(phoneNumber);
      };

      if (isValidPhoneNumber($numberInput)) {
        var $justTheNumbers = $numberInput.replace(/[^\d]/g, '');
        var $SmsEndPoint = "//www.zendesk.com/app/sms?recipient=" + $justTheNumbers;

        $.ajax({
          url: $SmsEndPoint,
          type: 'POST',
          success: function(result) {
              onFormSuccess();
          },
          error: function(result) {
              onSmsError();
          }
        });

      } else {
        onFormError();
      };

  }

  function onFormSuccess() {
    isLoading = false;
    $message.text('A downloadable app link has been sent to your phone');
    $input.val('');
    $form
      .removeClass('loading')
      .addClass('success');
  }

  function onFormError() {
    isLoading = false;
    $message.text('Please enter a valid phone number');
    $form
      .removeClass('loading')
      .addClass('error');
    $formCta
      .addClass('message');

  }

  function onSmsError() {
    isLoading = false;
    $message.text('The SMS functionaility is currently down');
    $form
      .removeClass('loading')
      .addClass('error');
    $formCta
      .addClass('message');
  }

  function onInputType() {
    $message.text('');
    $form.removeClass('error success');
  }

  // Bindings

  $form.on('submit', onFormSubmit);
  $input.on('keyup', onInputType);
});
