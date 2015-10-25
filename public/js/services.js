angular.module('rideguardians').factory('RideGuardiansUberService', [ '$http', '$timeout', function($http, $timeout) {
  var RideGuardiansUberService = {};

  var apiUrl = '/api/';

  RideGuardiansUberService.currentPrices = {};
  RideGuardiansUberService.currentPrices.data = undefined;
  RideGuardiansUberService.requestedProduct = {};
  RideGuardiansUberService.requestedProduct.data = undefined;

  RideGuardiansUberService.getPriceEstimates = function(source, destination) {
    $.get( apiUrl + 'estimates/price', {
      source : JSON.stringify(source),
      destination : JSON.stringify(destination)
    })
    .done(function(data){
      $timeout(function() {
        RideGuardiansUberService.currentPrices.data = JSON.parse(data);
      });
    })
    .fail(function(err){
      $timeout(function() {
        RideGuardiansUberService.currentPrices.data = undefined;
      });
      if(err.status && err.responseText){
        console.error(err.status, err.responseText);
      }else{
        console.error(err);
      }
    });
  };

  RideGuardiansUberService.getRideAndSetupEmails = function (product_id, source, destination, firstEmail, secondEmail) {
    $.post('/api/get_ride', {
      product_id: product_id,
      source: source,
      destination: destination,
      auth_token: localStorage.auth_token
    })
    .done(function(response){
      if(response.success){
        console.log('get ride call success');
        $timeout(function() {
          RideGuardiansUberService.requestedProduct.data = response;
          RideGuardiansUberService.setupEmailNotificationsOrAlert(firstEmail, secondEmail, response.request_id, false);
        });
      }else{
        // open popup window to authorize
        console.log('in get ride but need to get ouath token');
        window.open(response.popupUrl, "oauth", "scrollbars=1,resizable=1,height=300,width=450");
      }
    })
    .fail(function(err){
      console.error(err);
    });
  };

  RideGuardiansUberService.setupEmailNotificationsOrAlert = function (firstEmail, secondEmail, request_id, panic_mode) {
    $.post('/api/send_mail', {
      contact_1: firstEmail,
      contact_2: secondEmail,
      request_id: request_id,
      panic_mode: panic_mode,
      auth_token: localStorage.auth_token
    })
    .done(function(response){
      console.log('setup notification success');
    })
    .fail(function(err){
      console.error(err);
    });
  };

  return RideGuardiansUberService;
}]);
