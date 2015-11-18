angular.module('rideguardians').controller('TokenController', ['$routeParams', 'RideGuardiansUberService', function($routeParams, RideGuardiansUberService) {
  localStorage.auth_token = $routeParams.access_token;
  RideGuardiansUberService.loginData.hasAuthToken = true;
}]);

angular.module('rideguardians').controller("SimpleMapController", [ '$scope', 'RideGuardiansUberService', function($scope, RideGuardiansUberService) {
  $scope.markers = {};
  $scope.headerText = "Ride Guardians";
  $scope.currentProduct = undefined;
  $scope.currentConfirmation = {};
  $scope.requestedProduct = RideGuardiansUberService.requestedProduct;
  $scope.pricesLoadingText = undefined;
  $scope.nextSandboxRideStatus = undefined;
  $scope.uberLoginData = RideGuardiansUberService.loginData;

  var updateCarMarker = function(hasData) {
    if (!RideGuardiansUberService.requestedProduct.data || !RideGuardiansUberService.requestedProduct.data.location || !RideGuardiansUberService.requestedProduct.data.location.latitude) {
      return;
    }
    var newLat = parseFloat(RideGuardiansUberService.requestedProduct.data.location.latitude);
    var newLng = parseFloat(RideGuardiansUberService.requestedProduct.data.location.longitude);
    if ($scope.markers.car) {
      if (RideGuardiansUberService.requestedProduct.data.status === 'completed') {
        newLat = $scope.markers.destination.lat;
        newLng = $scope.markers.destination.lng;
      }
      console.log('car marker already exists, new location is: '+newLat+'/'+newLng);
      $scope.markers.car.lat = newLat;
      $scope.markers.car.lng = newLng;
    }
    else {
      $scope.markers.car = {
        lat: newLat,
        lng: newLng,
        message: "My Car",
        icon: {
          type: 'awesomeMarker',
          icon: 'road',
          markerColor: 'green'
        }
      };
    }
  };

  var gotInitialRequestReturn = function(hasData) {
    if (hasData) {
      $scope.headerText = $scope.currentProduct.display_name+' ride booked';
      $scope.nextSandboxRideStatus = RideGuardiansUberService.requestedProduct.data.nextRideStatus;

      if (RideGuardiansUberService.requestedProduct.data.location) {
        updateCarMarker(hasData);
      }
    }
    else {
      $scope.headerText = 'Request '+$scope.currentProduct.display_name+' ride';
      alert('You need to sign into Uber first. Please click ok, make sure popups are allowed and showing, use the next popup window to authenticate with Uber, and then click book again.');
    }
  };

  $scope.progressSandboxRideStatus = function() {
    RideGuardiansUberService.progressSandboxRideStatus(updateCarMarker);
  };

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
    RideGuardiansUberService.getRideAndSetupEmails($scope.currentProduct.product_id, $scope.markers.origin, $scope.markers.destination, $scope.currentConfirmation.data.firstEmail, $scope.currentConfirmation.data.secondEmail, gotInitialRequestReturn);
    $scope.headerText = 'Booking '+$scope.currentProduct.display_name+' ride';
  };

  $scope.getCurrentRide = function() {
    //RideGuardiansUberService.getRide($scope.currentProduct.product_id, $scope.markers.origin, $scope.markers.destination);
    $scope.currentConfirmation = {data: {firstEmail: ""}};
    $scope.headerText = 'Request '+$scope.currentProduct.display_name+' ride';
  };

  $scope.prices = RideGuardiansUberService.currentPrices;
  $scope.$on("leafletDirectiveMap.click", function(event, args) {
    if (!$scope.requestedProduct.data) {
      var leafEvent = args.leafletEvent;
      $scope.pricesLoadingText = '...Loading...';
      $scope.currentProduct = undefined;

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
    }
  });

  $scope.$on("leafletDirectiveMap.locationfound", function(event, args){
    var leafEvent = args.leafletEvent;
    $scope.markers.origin = {
      lat: leafEvent.latlng.lat,
      lng: leafEvent.latlng.lng,
      message: "My location",
      icon: {
        type: 'awesomeMarker',
        icon: 'home',
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
