angular.module('rideguardians').factory('RideGuardiansUberService', [ '$http', function($http) {
  var RideGuardiansUberService = {};

  var apiUrl = '/api/';

  RideGuardiansUberService.currentPrices = {};
  RideGuardiansUberService.currentPrices.data = undefined;

  RideGuardiansUberService.getPriceEstimates = function(source, destination) {
    $.get( apiUrl + 'estimates/price', {
      source : JSON.stringify(source),
      destination : JSON.stringify(destination)
    })
    .done(function(data){
      RideGuardiansUberService.currentPrices.data = JSON.parse(data);
    })
    .fail(function(err){
      RideGuardiansUberService.currentPrices.data = undefined;
      if(err.status && err.responseText){
        console.error(err.status, err.responseText);
      }else{
        console.error(err);
      }
    });
  };

  return RideGuardiansUberService;
}]);