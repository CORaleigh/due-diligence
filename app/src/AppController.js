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
            clickOutsideToClose: true
        });
    };
    self.data = {};
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
    self.getZoning = function (QueryTask, query) {
        query.outFields = ['ZONING'];
        query.returnGeometry = false;
        var queryTask = new QueryTask("http://maps.raleighnc.gov/arcgis/rest/services/Planning/Zoning/MapServer/0");
        queryTask.execute(query, function (result) {
            if (result.features.length > 0) {
                self.data.zoning = result.features[0].attributes.ZONING;
                $scope.$digest();
            }
        });
    };
    self.getProperty = function (point, id) {
        require(["esri/tasks/QueryTask", "esri/tasks/query"], function (QueryTask, Query) {
            var queryTask = new QueryTask(
                'https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/' + id
            );
            var query = new Query();
            query.returnGeometry = true;
            query.outFields = ['OWNER', 'PIN_NUM'];
            query.geometry = point;
            query.spatialRelationship = 'esriSpatialRelIntersects';
            queryTask.execute(query, function (result) {
                if (result.features.length > 0) {
                    self.data.owner = result.features[0].attributes.OWNER;
                    self.data.pin1 = result.features[0].attributes.PIN_NUM;
                    $scope.$digest();
                    self.getZoning(QueryTask, query);
                } else {
                    if (id === '0') {
                        self.getProperty(point, '1');
                    }
                }
            });
        });
    };
    self.addAddressToMap = function (address) {
        if (address) {
            require(["esri/graphic", "esri/geometry/Point", "esri/symbols/SimpleMarkerSymbol"], function (Graphic, Point, SimpleMarkerSymbol) {
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
                map.graphics.clear();
                map.graphics.add(pointGraphic);
                self.getProperty(new Point({
                    longitude: address.geometry.x,
                    latitude: address.geometry.y
                }), '0');
            });
        }
    };
    self.addressSelected = function (address) {
        if (address) {
            map.centerAndZoom([address.geometry.x, address.geometry.y], 17);
            self.data.address = self.selectedAddress.attributes.ADDRESS;
            self.addAddressToMap(address);
        }
    };
    self.createMap = function () {
        require([
            "esri/map",
            "esri/layers/VectorTileLayer",
            "esri/layers/FeatureLayer",
            "esri/renderers/SimpleRenderer",
            "dojo/domReady!"
        ], function (Map, VectorTileLayer, FeatureLayer, SimpleRenderer) {
            console.log('load');
            if (!map) {
                map = new Map("viewDiv", {
                    center: [-78.65, 35.8],
                    zoom: 10
                });

                var tileLyr = new VectorTileLayer("https://www.arcgis.com/sharing/rest/content/items/bf79e422e9454565ae0cbe9553cf6471/resources/styles/root.json");
                map.addLayer(tileLyr);
                // var parcels = new VectorTileLayer({
                //     url: "https://www.arcgis.com/sharing/rest/content/items/40654681938f4836b3b9bff62c2d3e40/resources/styles/root.json"
                // });
                // map.add(parcels);
                var parcels = new FeatureLayer("https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/0");
                parcels.setRenderer(new SimpleRenderer({
                    type: "simple",
                    label: "",
                    description: "",
                    symbol: {
                        type: "esriSFS",
                        style: "esriSFSNull",
                        color: [115, 76, 0, 255],
                        outline: {
                            type: "esriSLS",
                            style: "esriSLSSolid",
                            color: [255, 255, 255, 200],
                            width: 1
                        }
                    }
                }));
                map.addLayer(parcels);
            }
        });
    };
}
export default ['$http', '$scope', '$httpParamSerializerJQLike', '$mdDialog', AppController];