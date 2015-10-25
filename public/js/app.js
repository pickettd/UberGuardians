

angular.module('rideguardians', ['nemLogging','leaflet-directive','ngRoute']);



angular.module('rideguardians').config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/store-auth-token/:access_token', {
        template: '<div></div>',
        controller: 'TokenController',
        redirectTo: '/'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);
