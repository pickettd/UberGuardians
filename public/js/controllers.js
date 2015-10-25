angular.module('rideguardians').controller("SimpleMapController", [ '$scope', 'RideGuardiansUberService', function($scope, RideGuardiansUberService) {
  $scope.markers = {};
  $scope.currentProduct = undefined;

  $scope.setCurrentProduct = function(product) {
    $scope.currentProduct = product;
  };

  $scope.prices = RideGuardiansUberService.currentPrices;
  $scope.$on("leafletDirectiveMap.click", function(event, args){
    var leafEvent = args.leafletEvent;

    var origin = { lat : $scope.markers.origin.lat, lng : $scope.markers.origin.lng};
    RideGuardiansUberService.getPriceEstimates ( origin, leafEvent.latlng);

    $scope.markers.destination = {
      lat: leafEvent.latlng.lat,
      lng: leafEvent.latlng.lng,
      message: "My Added Marker"
    };
  });

  $scope.$on("leafletDirectiveMap.locationfound", function(event, args){
    var leafEvent = args.leafletEvent;
    $scope.markers.origin = {
      lat: leafEvent.latlng.lat,
      lng: leafEvent.latlng.lng,
      message: "My location"
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
