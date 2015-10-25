angular.module('rideguardians').controller('TokenController', ['$routeParams', function($routeParams) {
  localStorage.auth_token = $routeParams.access_token;
}]);

angular.module('rideguardians').controller("SimpleMapController", [ '$scope', 'RideGuardiansUberService', function($scope, RideGuardiansUberService) {
  $scope.markers = {};
  $scope.headerText = "Ride Guardians";
  $scope.currentProduct = undefined;
  $scope.currentConfirmation = {};
  $scope.requestedProduct = RideGuardiansUberService.requestedProduct;

  $scope.setCurrentProduct = function(product) {
    $scope.currentProduct = product;
  };

  $scope.sendPanic = function() {
    $scope.panicSent = true;
    RideGuardiansUberService.setupEmailNotificationsOrAlert($scope.currentConfirmation.data.firstEmail, $scope.currentConfirmation.data.secondEmail, RideGuardiansUberService.requestedProduct.data.request_id, true);
    $scope.headerText = 'Ride Canceled - Guardians alerted!';
  };

  $scope.cancelButtonConfirmPage = function() {
    $scope.currentConfirmation = {};
    $scope.headerText = "Ride Guardians";
  };

  $scope.confirmButtonConfirmPage = function() {
    RideGuardiansUberService.getRideAndSetupEmails($scope.currentProduct.product_id, $scope.markers.origin, $scope.markers.destination, $scope.currentConfirmation.data.firstEmail, $scope.currentConfirmation.data.secondEmail);
    $scope.headerText = $scope.currentProduct.display_name+' ride booked';
  };

  $scope.getCurrentRide = function() {
    //RideGuardiansUberService.getRide($scope.currentProduct.product_id, $scope.markers.origin, $scope.markers.destination);
    $scope.currentConfirmation = {data: {firstEmail: ""}};
    $scope.headerText = 'Request '+$scope.currentProduct.display_name+' ride';
  };

  $scope.prices = RideGuardiansUberService.currentPrices;
  $scope.$on("leafletDirectiveMap.click", function(event, args){
    var leafEvent = args.leafletEvent;

    var origin = { lat : $scope.markers.origin.lat, lng : $scope.markers.origin.lng};
    RideGuardiansUberService.getPriceEstimates ( origin, leafEvent.latlng);

    $scope.markers.destination = {
      lat: leafEvent.latlng.lat,
      lng: leafEvent.latlng.lng,
      message: "My Destination",
      icon: {
        type: 'awesomeMarker',
        icon: 'screenshot',
        markerColor: 'blue'
      }
    };
  });

  $scope.$on("leafletDirectiveMap.locationfound", function(event, args){
    var leafEvent = args.leafletEvent;
    $scope.markers.origin = {
      lat: leafEvent.latlng.lat,
      lng: leafEvent.latlng.lng,
      message: "My location",
      icon: {
        type: 'awesomeMarker',
        icon: 'user',
        markerColor: 'red'
      }
    };
  });

  angular.extend($scope, {
    defaults: {
      scrollWheelZoom: false
    },
    events: {},
    center: {
      zoom: 17,
      autoDiscover: true
    }
  });
}]);
