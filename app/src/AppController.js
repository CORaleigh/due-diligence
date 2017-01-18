/**
 * Main App Controller for the Angular Material Starter App
 * @param UsersDataService
 * @param $mdSidenav
 * @constructor
 */
function AppController($http, $scope, $httpParamSerializerJQLike, $mdDialog, $filter) {
    'use strict';
    var self = this;
    var map = null,
        view = null,
        buildingTypes = [{zone: 'R-1', allowed: 'Detached House'},
            {zone: 'R-2', allowed: 'Detached House, Attached House *, Civic Building, Open Lot'},
            {zone: 'R-4', allowed: 'Detached House, Attached House *, Townhouse *, Civic Building, Open Lot'},
            {zone: 'R-6', allowed: 'Detached House, Attached House, Townhouse *, Apartment *, Civic Building, Open Lot'},
            {zone: 'R-10', allowed: 'Detached House, Attached House, Townhouse, Apartment, Civic Building, Open Lot'},
            {zone: 'RX-', allowed: 'Detached House, Attached House, Townhouse, Apartment, Civic Building, Open Lot'},
            {zone: 'OP-', allowed: 'General Building, Mixed Use Building, Civic Building, Open Lot'},
            {zone: 'OX-', allowed: 'Detached House, Attached House, Townhouse, Apartment, General Building, Mixed Use Building, Civic Building, Open Lot'},
            {zone: 'NX-', allowed: 'Detached House, Attached House, Townhouse, Apartment, General Building, Mixed Use Building, Civic Building, Open Lot'},
            {zone: 'CX-', allowed: 'Detached House, Attached House, Townhouse, Apartment, General Building, Mixed Use Building, Civic Building, Open Lot'},
            {zone: 'DX-', allowed: 'Detached House, Attached House, Townhouse, Apartment, General Building, Mixed Use Building, Civic Building, Open Lot'},
            {zone: 'IX-', allowed: 'General Building, Mixed Use Building, Civic Building, Open Lot'},
            {zone: 'CM', allowed: 'Open Lot'},
            {zone: 'AP', allowed: 'Detached House, General Building, Open Lot'},
            {zone: 'IH', allowed: 'General Building, Open Lot'},
            {zone: 'MH', allowed: 'See Article 4.5. Manufactured Housing (MH)'},
            {zone: 'CMP', allowed: 'Allowed building types determined on master plan (see Article 4.6. Campus (CMP))'},
            {zone: 'PD', allowed: 'Allowed building types determined on master plan (see Article 4.7. Planned Development (PD))'}
        ];
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
            url: "https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Due_Diligence/FeatureServer/0/addFeatures",
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
        query.outFields = ['ZONING', 'FRONTAGE', 'ZONE_TYPE'];
        query.returnGeometry = false;
        queryTask.url = "http://maps.raleighnc.gov/arcgis/rest/services/Planning/Zoning/MapServer/0";
        queryTask.execute(query).then(function (result) {
            if (result.features.length > 0) {
                self.data.planning1 = result.features[0].attributes.ZONING;
                if (result.features[0].attributes.CONDITIONAL) {
                    self.data.planning2 = 'Yes';
                } else {
                    self.data.planning2 = 'N/A';
                }
                if (result.features[0].attributes.FRONTAGE) {
                    self.data.planning4 = result.features[0].attributes.FRONTAGE;
                } else {
                    self.data.planning4 = 'N/A';
                }  
                var buildingType = $filter('filter')(buildingTypes, {zone: result.features[0].attributes.ZONE_TYPE});
                if (buildingType.length > 0) {
                    self.data.planning7 = buildingType[0].allowed;
                }
                self.data.forestry2 = 1;
                if (result.features[0].attributes.ZONE_TYPE === "R-1" || result.features[0].attributes.ZONE_TYPE === "R-2") {
                    self.data.forestry2 = 0;
                }               
                $scope.$digest();
            }
        });
    };
    self.getOverlay = function (queryTask, query) {
        var overlays = [];
        query.outFields = ['OLAY_DECODE'];
        query.returnGeometry = false;
        queryTask.url = "https://maps.raleighnc.gov/arcgis/rest/services/Services/OpenData/MapServer/31";
        queryTask.execute(query).then(function (result) {
            if (result.features.length > 0) {
                result.features.forEach(function (feature) {
                    overlays.push(feature.attributes.OLAY_DECODE);
                });
                self.data.planning3 = overlays.toString();
                if (self.data.planning3.indexOf("Water Protection") > -1) {
                    self.data.forestry5 = 0;
                } else {
                    self.data.forestry5 = 1;
                }

            } else {
                self.data.planning3 = 'N/A';
            }

            $scope.$digest();
        });
    };
    self.getProperty = function (point) {
        require(["esri/tasks/QueryTask", "esri/tasks/support/Query"], function (QueryTask, Query) {
            var queryTask = new QueryTask({
                url: 'https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/0'
            });
            var query = new Query();
            query.returnGeometry = true;
            query.outFields = ['OWNER', 'PIN_NUM', 'DEED_ACRES'];
            query.geometry = point;
            query.spatialRelationship = 'intersects';
            queryTask.execute(query).then(function (result) {
                if (result.features.length > 0) {
                    self.data.owner = result.features[0].attributes.OWNER;
                    self.data.pin = result.features[0].attributes.PIN_NUM;
                    if (result.features[0].attributes.DEED_ACRES) {
                        if (result.features[0].attributes.DEED_ACRES >= 2) {
                            self.data.forestry1 = 0;
                        } else {
                            self.data.forestry1 = 1;
                        }
                    }
                    $scope.$digest();
                    self.getZoning(queryTask, query);
                    self.getOverlay(queryTask, query);
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
                zoom: 17
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
            console.log('load');
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
}
export default ['$http', '$scope', '$httpParamSerializerJQLike', '$mdDialog', '$filter', AppController];