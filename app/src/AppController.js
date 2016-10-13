/**
 * Main App Controller for the Angular Material Starter App
 * @param UsersDataService
 * @param $mdSidenav
 * @constructor
 */
function AppController($http, $scope, $httpParamSerializerJQLike, $mdDialog) {
    'use strict';
    var self = this;
    var map = null,
        view = null;
    $scope.hideSplash = function () {
        $mdDialog.hide();
    };
    self.showSplash = function (ev) {
        $mdDialog.show({
          controller: AppController,
          templateUrl: 'templates/splash.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose:true
        });
    };
    self.data = {
        contact: 'Justin Greco',
        phone: '919-996-2523',
        mobile: '919-996-2523',
        email: 'justin.greco@raleighnc.gov',
        project: 'test',
        description: 'test',
        question1: 'test',
        question2: 'test',
        question3: 'test',
        question4: 'test',
        reviewed: 0,
        participated: 0,
        devplan: 1
    };
    self.submitForm = function () {
        self.selectedAddress.geometry.spatialReference = {
            wkid: 4326
        };
        $http({
            url: "https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Due_Diligence_Sessions/FeatureServer/0/addFeatures",
            method: 'POST',
            data: $httpParamSerializerJQLike({
                f: 'json',
                features: JSON.stringify([{
                    attributes: self.data,
                    geometry: self.selectedAddress.geometry
                }])
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(function (result) {
            console.log(result);
        });
    };
    self.addressSearch = function (addressText) {
        return $http.get("https://maps.raleighnc.gov/arcgis/rest/services/Addresses/MapServer/0/query?returnGeometry=true&outSR=4326&geometryPrecision=5&f=json&orderByFields=ADDRESS&where=ADDRESSU like '" + addressText.toUpperCase() + "%'")
            .then(function (result) {
                return result.data.features;
            });
    };
    self.getZoning = function (queryTask, query) {
        query.outFields = ['ZONING'];
        query.returnGeometry = false;
        queryTask.url = "http://maps.raleighnc.gov/arcgis/rest/services/Planning/Zoning/MapServer/0";
        queryTask.execute(query).then(function (result) {
            if (result.features.length > 0) {
                self.data.zoning = result.features[0].attributes.ZONING;
                $scope.$digest();
            }
        });
    };
    self.getProperty = function (point) {
        require(["esri/tasks/QueryTask", "esri/tasks/support/Query"], function (QueryTask, Query) {
            var queryTask = new QueryTask({
                url: 'https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/0'
            });
            var query = new Query();
            query.returnGeometry = true;
            query.outFields = ['OWNER', 'PIN_NUM'];
            query.geometry = point;
            query.spatialRelationship = 'intersects';
            queryTask.execute(query).then(function (result) {
                if (result.features.length > 0) {
                    self.data.owner = result.features[0].attributes.OWNER;
                    self.data.pin1 = result.features[0].attributes.PIN_NUM;
                    $scope.$digest();
                    self.getZoning(queryTask, query);
                }
            });
        });
    };
    self.addAddressToMap = function (address) {
        if (address) {
            require(["esri/Graphic", "esri/geometry/Point", "esri/symbols/SimpleMarkerSymbol"], function (Graphic, Point, SimpleMarkerSymbol) {
                var markerSymbol = new SimpleMarkerSymbol({
                    color: [226, 119, 40],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [255, 255, 255],
                        width: 2
                    }
                });
                var pointGraphic = new Graphic({
                    geometry: new Point({
                        longitude: address.geometry.x,
                        latitude: address.geometry.y
                    }),
                    attributes: address.attributes
                });
                pointGraphic.symbol = markerSymbol;
                view.graphics.removeAll();
                view.graphics.add(pointGraphic);
                self.getProperty(new Point({
                    longitude: address.geometry.x,
                    latitude: address.geometry.y
                }));
            });
        }
    };
    self.addressSelected = function (address) {
        if (address) {
            view.goTo({
                center: [address.geometry.x, address.geometry.y],
                zoom: 15
            });
            self.data.address = self.selectedAddress.attributes.ADDRESS;
            self.addAddressToMap(address);
        }
    };
    self.createMap = function () {
        require([
            "esri/Map",
            "esri/views/MapView",
            "esri/layers/VectorTileLayer",
            "dojo/domReady!"
        ], function (Map, MapView, VectorTileLayer) {
            if (!map) {
                // Create a Map
                map = new Map();
                // Make map view and bind it to the map
                view = new MapView({
                    container: "viewDiv",
                    map: map,
                    center: [-78.65, 35.8],
                    zoom: 10
                });
                var tileLyr = new VectorTileLayer({
                    url: "https://www.arcgis.com/sharing/rest/content/items/bf79e422e9454565ae0cbe9553cf6471/resources/styles/root.json"
                });
                map.add(tileLyr);
                var parcels = new VectorTileLayer({
                    url: "https://www.arcgis.com/sharing/rest/content/items/40654681938f4836b3b9bff62c2d3e40/resources/styles/root.json"
                });
                map.add(parcels);
            }
        });
    };
    self.createMap();
}
export default ['$http', '$scope', '$httpParamSerializerJQLike', '$mdDialog', AppController];