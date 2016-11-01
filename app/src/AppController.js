/**
 * Main App Controller for the Angular Material Starter App
 * @param UsersDataService
 * @param $mdSidenav
 * @constructor
 */
function AppController($http, $scope, $httpParamSerializerJQLike, $mdDialog, $timeout) {
    'use strict';
    var self = this;
    var map = null;
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
    self.pins = [];
    self.data = {};
    self.submitForm = function () {
        self.selectedAddress.geometry.spatialReference = {
            wkid: 4326
        };
        self.data.pins = self.pins.toString();
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
            "esri/tasks/query",
            "esri/symbols/SimpleFillSymbol",
            "esri/symbols/SimpleLineSymbol",
            "esri/Color",
            "dojo/domReady!"
        ], function (Map, VectorTileLayer, FeatureLayer, SimpleRenderer, Query, SimpleFillSymbol, SimpleLineSymbol, Color) {
            map = new Map("viewDiv", {
                center: [-78.633333, 35.766667],
                zoom: 10
            });

            var tileLyr = new VectorTileLayer("https://www.arcgis.com/sharing/rest/content/items/bf79e422e9454565ae0cbe9553cf6471/resources/styles/root.json");
            map.addLayer(tileLyr);
            var parcels = new FeatureLayer("https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/0", {
                outFields: ['OWNER', 'PIN_NUM'],
                mode: FeatureLayer.MODE_ONDEMAND
            });
            map.addLayer(parcels);
            self.parcels.setRenderer(new SimpleRenderer({
                type: "simple",
                label: "",
                description: "",
                symbol: {
                    type: "esriSFS",
                    style: "esriSFSSolid",
                    color: [115, 76, 0, 0],
                    outline: {
                        type: "esriSLS",
                        style: "esriSLSSolid",
                        color: [255, 255, 255, 200],
                        width: 1
                    }
                }
            }));
            var selectSymbol =
                    new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([255, 255, 0]), 4), new Color([255, 255, 0, 0.5]));
            self.parcels.setSelectionSymbol(selectSymbol);
            var durparcels = new FeatureLayer("https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/1", {
                outFields: ['OWNER', 'PIN_NUM'],
                mode: FeatureLayer.MODE_ONDEMAND
            });
            durparcels.setRenderer(new SimpleRenderer({
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
            durparcels.setSelectionSymbol(selectSymbol);
            map.addLayer(durparcels);

            map.on("touchend, click", function (e) {
                var query = new Query();
                query.geometry = e.mapPoint;
                self.parcels.selectFeatures(query, FeatureLayer.SELECTION_ADD, function (results) {
                    console.log(results);
                    if (results.length > 0) {
                        var pin = results[0].attributes.PIN_NUM;
                        if (self.pins.indexOf(pin) === -1) {
                            self.pins.push(pin);
                        } else {
                            self.pins.splice(self.pins.indexOf(pin), 1);
                            self.parcels.selectFeatures(query, FeatureLayer.SELECTION_SUBTRACT);
                        }
                        $scope.$digest();
                    }
                });
                durparcels.selectFeatures(query, FeatureLayer.SELECTION_ADD, function (results) {
                    if (results.length > 0) {
                        var pin = results[0].attributes.PIN_NUM;
                        if (self.pins.indexOf(pin) === -1) {
                            self.pins.push(pin);
                        } else {
                            self.pins.splice(self.pins.indexOf(pin), 1);
                            durparcels.selectFeatures(query, FeatureLayer.SELECTION_SUBTRACT);
                        }
                        $scope.$digest();
                    }
                });
            });
        });
    };
    self.init = function (event) {
        self.showSplash(event);
        $timeout(function () {
            self.createMap();
        });
    };
}
export default ['$http', '$scope', '$httpParamSerializerJQLike', '$mdDialog', '$timeout', AppController];