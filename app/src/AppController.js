/**
 * Main App Controller for the Angular Material Starter App
 * @param UsersDataService
 * @param $mdSidenav
 * @constructor
 */
function AppController($mdSidenav, $http, $rootScope, $scope, $location, $mdMedia, $window) {
    'use strict';
    var self = this;


    self.createMap = function() {
        require([
            "esri/Map",
            "esri/views/MapView",
            "esri/layers/VectorTileLayer",
            "dojo/domReady!"
        ], function(Map, MapView, VectorTileLayer) {

            // Create a Map
            var map = new Map();

            // Make map view and bind it to the map
            var view = new MapView({
                container: "viewDiv",
                map: map,
                center: [-78.65, 35.8],
                zoom: 10
            });
            var tileLyr = new VectorTileLayer({
                url: "https://www.arcgis.com/sharing/rest/content/items/bf79e422e9454565ae0cbe9553cf6471/resources/styles/root.json"
            });
            map.add(tileLyr);
        });

    }
    self.createMap();


}
export default ['$mdSidenav', '$http', '$rootScope', '$scope', '$location', '$mdMedia', '$window', AppController];