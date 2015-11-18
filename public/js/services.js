angular.module('rideguardians').factory('RideGuardiansUberService', [ '$http', '$timeout', function($http, $timeout) {
  var RideGuardiansUberService = {};

  var apiUrl = '/api/';

  RideGuardiansUberService.currentPrices = {};
  RideGuardiansUberService.currentPrices.data = undefined;
  RideGuardiansUberService.requestedProduct = {};
  RideGuardiansUberService.requestedProduct.data = undefined;

  RideGuardiansUberService.updateRideStatus = function(updateCarLocationCallback) {
    $.post('/api/request_info', {
      request_id: RideGuardiansUberService.requestedProduct.data.request_id,
      auth_token: localStorage.auth_token
    })
    .done(function(response){
      if (response.success) {
        console.log('get request info success');
        $timeout(function() {
          RideGuardiansUberService.requestedProduct.data = response;
          RideGuardiansUberService.requestedProduct.data.nextRideStatus = RideGuardiansUberService.getNextRideStatus();
          if (response.location && updateCarLocationCallback) {
            updateCarLocationCallback(true);
          }
        });
      }
      else {
        console.log('Get request info didn\'t work but didn\'t error');
      }
    })
    .fail(function(err){
      console.error(err);
    });
  };

  RideGuardiansUberService.getNextRideStatus = function() {
    if (RideGuardiansUberService.requestedProduct.data.status === 'processing') {
      return ('accepted');
    }
    if (RideGuardiansUberService.requestedProduct.data.status === 'accepted') {
      return ('arriving');
    }
    if (RideGuardiansUberService.requestedProduct.data.status === 'arriving') {
      return ('in_progress');
    }
    if (RideGuardiansUberService.requestedProduct.data.status === 'in_progress') {
      return ('completed');
    }
    return ('none');
  };

  RideGuardiansUberService.progressSandboxRideStatus = function(setupLocationCallback) {
    var nextStatus = RideGuardiansUberService.getNextRideStatus();
    RideGuardiansUberService.sandboxRideChangeStatus(nextStatus, setupLocationCallback);
  };

  RideGuardiansUberService.sandboxRideChangeStatus = function(status, setupLocationCallback) {
    var oldRequestStatus = RideGuardiansUberService.requestedProduct.data.status;
    $.post('/api/change_request_status', {
      request_id: RideGuardiansUberService.requestedProduct.data.request_id,
      status: status,
      auth_token: localStorage.auth_token
    })
    .done(function(response){
      console.log('changed request status from '+oldRequestStatus+' to '+status+'; response is: ');
      console.log(response);
      RideGuardiansUberService.updateRideStatus(setupLocationCallback);
    })
    .fail(function(err){
      console.error(err);
    });
  };

  RideGuardiansUberService.getPriceEstimates = function(source, destination) {
    RideGuardiansUberService.currentPrices.data = undefined;
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

  RideGuardiansUberService.getRideAndSetupEmails = function (product_id, source, destination, firstEmail, secondEmail, doneCallback) {
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
          RideGuardiansUberService.requestedProduct.data.nextRideStatus = RideGuardiansUberService.getNextRideStatus();
          doneCallback(true);
          RideGuardiansUberService.setupEmailNotificationsOrAlert(firstEmail, secondEmail, response.request_id, false);
        });
      }else{
        // open popup window to authorize
        console.log('in get ride but need to get ouath token');
        doneCallback(false);
        alert('You need to sign into Uber first. Please click ok, use the next popup window to authenticate with Uber, and then click book again.');
        window.open(response.popupUrl, "oauth", "scrollbars=1,resizable=1,height=300,width=450");
      }
    })
    .fail(function(err){
      console.error(err);
    });
  };

  RideGuardiansUberService.setupEmailNotificationsOrAlert = function (firstEmail, secondEmail, request_id, panic_mode) {
    //Note that the ride cancel api call happens on the serverside
    $.post('/api/send_mail', {
      contact_1: firstEmail,
      contact_2: secondEmail,
      request_id: request_id,
      panic_mode: panic_mode,
      auth_token: localStorage.auth_token
    })
    .done(function(response){
      console.log('setup notification or alert success');
      RideGuardiansUberService.updateRideStatus();
    })
    .fail(function(err){
      console.error(err);
    });
  };

  return RideGuardiansUberService;
}]);
