# Ride Guardians

Ride Guardians is a Maui DevLeague / Uber Hackathon 2015 project to help Uber riders or friends of riders have greater peace of mind using the service. When an Uber ride is booked through the Ride Guardians app, a list of emails can be provided as "Guardians" for the rider who will receive periodic emails about the rider's status and location during the trip. When the ride is completed successfully, the Guardians will receive an all-is-well notice through email. If something happens to go wrong during the Uber ride - the rider has a panic button available in the app to immediately notify their Guardians of an emergency (at the same time as canceling the ride transaction in progress).

This project was forked from the DevLeague Node-Price-Estimate demo project for the hackathon.

This project uses the following libraries:

#### Server Side

1. [express](http://expressjs.com/api.html) for routing and serving static files
1. [request](https://www.npmjs.com/package/request) for simpler async https requests to uber api
1. [body-parser](https://www.npmjs.com/package/body-parser) middleware for parsing POST body requests
1. [oauth](https://www.npmjs.com/package/oauth) for authorizing users with uber api through OAuth2
    - [OAuth2 module source](https://github.com/ciaranj/node-oauth/blob/master/lib/oauth2.js) because the readme docs are too light
    - [github example](https://github.com/ciaranj/node-oauth/blob/master/examples/github-example.js) _take care to modify url configurations to use uber endpoints_


#### Client Side

All libraries are imported using [cdnjs](https://cdnjs.com)

1. [leaflet](http://leafletjs.com/) for maps
    - [OpenStreetMap](http://wiki.openstreetmap.org/wiki/Tile.openstreetmap.org/Usage_policy) as a source for map tiles
1. [angular](http://angularjs.org/) for client side models, controllers, dynamic, databound views, and routing
1. [jquery](https://api.jquery.com/jquery.get/) for dom selecting, some manipulation, and async http requests
1. [underscore](http://underscorejs.org/#extend) mainly used for extending classes and objects
1. [bootstrap](http://getbootstrap.com/) Twitter's popular responsive css framework
