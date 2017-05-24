/**
 * Main App Controller for the Angular Material Starter App
 * @param UsersDataService
 * @param $mdSidenav
 * @constructor
 */
function AppController($http, $scope, $rootScope, $httpParamSerializerJQLike, $mdDialog, $filter, $window, moment) {
    'use strict';
    debugger;
    var self = this;
    self.parcels = [];
    var map = null,
        view = null,
        polys = null,
        highlights = null,
        buildingTypes = [
            {zone: 'R-1', allowed: ['Detached House']},
            {zone: 'R-2', allowed: ['Detached House', 'Attached House *', 'Civic Building', 'Open Lot']},
            {zone: 'R-4', allowed: ['Detached House', 'Attached House *', 'Townhouse *', 'Civic Building', 'Open Lot']},
            {zone: 'R-6', allowed: ['Detached House', 'Attached House', 'Townhouse *', 'Apartment *', 'Civic Building', 'Open Lot']},
            {zone: 'R-10', allowed: ['Detached House', 'Attached House', 'Townhouse', 'Apartment', 'Civic Building', 'Open Lot']},
            {zone: 'RX-', allowed: ['Detached House', 'Attached House', 'Townhouse', 'Apartment', 'Civic Building', 'Open Lot']},
            {zone: 'OP-', allowed: ['General Building', 'Mixed Use Building', 'Civic Building', 'Open Lot']},
            {zone: 'OX-', allowed: ['Detached House', 'Attached House', 'Townhouse', 'Apartment', 'General Building', 'Mixed Use Building', 'Civic Building', 'Open Lot']},
            {zone: 'NX-', allowed: ['Detached House', 'Attached House', 'Townhouse', 'Apartment', 'General Building', 'Mixed Use Building', 'Civic Building', 'Open Lot']},
            {zone: 'CX-', allowed: ['Detached House', 'Attached House', 'Townhouse', 'Apartment', 'General Building', 'Mixed Use Building', 'Civic Building', 'Open Lot']},
            {zone: 'DX-', allowed: ['Detached House', 'Attached House', 'Townhouse', 'Apartment', 'General Building', 'Mixed Use Building', 'Civic Building', 'Open Lot']},
            {zone: 'IX-', allowed: ['General Building', 'Mixed Use Building', 'Civic Building', 'Open Lot']},
            {zone: 'CM', allowed: ['Open Lot']},
            {zone: 'AP', allowed: ['Detached House', 'General Building', 'Open Lot']},
            {zone: 'IH', allowed: ['General Building', 'Open Lot']},
            {zone: 'MH', allowed: ['See Article 4.5. Manufactured Housing (MH)']},
            {zone: 'CMP', allowed: ['Allowed building types determined on master plan (see Article 4.6. Campus (CMP))']},
            {zone: 'PD', allowed: ['Allowed building types determined on master plan (see Article 4.7. Planned Development (PD)']}
        ];

    $scope.hideConfirm = function () {
        $mdDialog.hide();
        $window.location.reload();
    };

    self.showSplash = function (ev) {
        $mdDialog.show({
            controller: 'DialogController',
            templateUrl: 'templates/splash.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false
        });
    };
    self.showConfirm = function (dueDate) {
        $mdDialog.show({
            templateUrl: 'templates/confirm.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false,
            locals: {
                dueDate: dueDate
            },
            controller: function ConfirmController($scope, $mdDialog, $window, dueDate) {
                $scope.dueDate = dueDate;
                $scope.hideConfirm = function () {
                    $mdDialog.hide();
                    $window.location.reload();
                };                
            }
        });
    };
    self.showOutside = function (ev) {
        $mdDialog.show({
            controller: 'DialogController',
            templateUrl: 'templates/outside.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        });
    };
    self.showNonContinguous = function (ev) {
      $mdDialog.show({
          controller: 'DialogController',
          templateUrl: 'templates/contiguous.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true
      });
    };
    self.data = {pins: [], address: [], planning1: [], planning2: 'N/A', planning3: [], planning4: [], forestry2: 1, forestry5: 1};

 function getDueDate (dayOfWeek, weeks) {
    return moment().add(weeks, 'weeks').isoWeekday(dayOfWeek).format('dddd, MMMM Do YYYY');
 }   
    
    self.submitForm = function () {
        self.data.pins = self.data.pins.toString();
        self.data.address = self.data.address.toString();
        self.data.planning1 = self.data.planning1.toString();
        if (self.data.planning3.length === 0) {
            self.data.planning3 = 'N/A';
        }
        if (self.data.planning4.length === 0) {
            self.data.planning4 = 'N/A';
        }
        self.data.planning3 = self.data.planning3.toString();
        self.data.planning4 = self.data.planning4.toString();
        self.data.Status = 0;
        self.data.planningStatus = 0;
        self.data.transStatus = 0;
        self.data.transFrontages = 1;
        self.data.planning7a = 1;
        self.data.stormStatus = 0;
        self.data.utilitiesStatus = 0;
        self.data.forestryStatus = 0;
        self.data.emailSent = 1;
        $http({
            url: "https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Due_Diligence/FeatureServer/0/addFeatures",
            method: 'POST',
            data: $httpParamSerializerJQLike({
                f: 'json',
                features: JSON.stringify([{
                    attributes: self.data,
                    geometry: polys.graphics.items[0].geometry.centroid
                }])
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(function (result) {
            console.log(result);
            if (result.data.addResults.length > 0) {
                var oid = result.data.addResults[0].objectId;
                $http({
                    url: "https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Due_Diligence_Areas/FeatureServer/0/addFeatures",
                    method: 'POST',
                    data: $httpParamSerializerJQLike({
                        f: 'json',
                        features: JSON.stringify([{
                            attributes: {ID: oid, Status: 0, planningStatus: 0, transStatus:0, utilitiesStatus: 0, stormStatus: 0, forestryStatus: 0, transFrontages: 1},
                            geometry: polys.graphics.items[0].geometry
                        }])
                    }),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }).then(function () {
                    $http.get("https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Due_Diligence_Areas/FeatureServer/0/query?where=Status=0&returnGeometry=false&returnCountOnly=true&f=json")
                    .then(function (result) {
                        var weeks = Math.ceil(result.data.count/5);
                        var dueDate = getDueDate(5, weeks);
                        self.showConfirm(dueDate);
                    });
                });
            }
        });
    };
    self.addressSearch = function (addressText) {
        return $http.get("https://maps.raleighnc.gov/arcgis/rest/services/Addresses/MapServer/0/query?returnGeometry=true&outSR=4326&geometryPrecision=5&f=json&orderByFields=ADDRESS&where=ADDRESSU like '" + addressText.toUpperCase() + "%'")
            .then(function (result) {
                return result.data.features;
            });
    };
    self.getZoning = function (queryTask, query, parcel) {
        query.outFields = ['ZONING', 'FRONTAGE', 'ZONE_TYPE', 'HEIGHT'];
        query.returnGeometry = false;
        queryTask.url = "http://maps.raleighnc.gov/arcgis/rest/services/Planning/Zoning/MapServer/0";
        queryTask.execute(query).then(function (result) {
            if (result.features.length > 0) {
                parcel.planning1 = result.features[0].attributes.ZONING;
                if (result.features[0].attributes.CONDITIONAL) {
                    parcel.planning2 = 'Yes';
                } else {
                    parcel.planning2 = 'N/A';
                }
                if (result.features[0].attributes.FRONTAGE) {
                    parcel.planning4 = result.features[0].attributes.FRONTAGE;
                } else {
                    parcel.planning4 = 'N/A';
                }

                if (result.features[0].attributes.HEIGHT) {
                  if (self.data.planning5) {
                    if (result.features[0].attributes.HEIGHT > self.data.planning5) {
                      self.data.planning5 = result.features[0].attributes.HEIGHT;
                    }
                  } else {
                    self.data.planning5 = result.features[0].attributes.HEIGHT;
                  }
                }
                parcel.forestry2 = 1;
                if (result.features[0].attributes.ZONE_TYPE === "R-1" || result.features[0].attributes.ZONE_TYPE === "R-2") {
                    parcel.forestry2 = 0;
                }
                $scope.$digest();
                self.getOverlay(queryTask, query, parcel);
            } else {
                self.parcels.splice(self.parcels.length - 1, 1);
                polys.remove(polys.graphics.items[polys.graphics.items.length - 1]);
                self.showOutside();
                $scope.$digest();
            }
        });
    };
    self.getOverlay = function (queryTask, query, parcel) {
        query.outFields = ['OLAY_DECODE'];
        query.returnGeometry = false;
        queryTask.url = "https://maps.raleighnc.gov/arcgis/rest/services/Services/OpenData/MapServer/31";
        queryTask.execute(query).then(function (result) {
            parcel.planning3Label = 'N/A';
            if (result.features.length > 0) {
                parcel.planning3 = [];
                result.features.forEach(function (feature) {
                    if (parcel.planning3.indexOf(feature.attributes.OLAY_DECODE) === -1) {
                        parcel.planning3.push(feature.attributes.OLAY_DECODE);
                    }
                });
                parcel.planning3Label = parcel.planning3.toString();
                if (parcel.planning3.toString().indexOf("Water Protection") > -1) {
                    parcel.forestry5 = 0;
                } else {
                    parcel.forestry5 = 1;
                }
            }
            $scope.$digest();
            self.aggregateData(parcel);
        });
    };
    self.getProperty = function (point) {
        require(["esri/tasks/QueryTask", "esri/tasks/support/Query"], function (QueryTask, Query) {
            var queryTask = new QueryTask({
                url: 'https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/0'
            });
            var query = new Query();
            query.returnGeometry = true;
            query.outFields = ['OWNER', 'PIN_NUM', 'DEED_ACRES', 'SITE_ADDRESS'];
            query.geometry = point;
            query.spatialRelationship = 'intersects';
            queryTask.execute(query).then(function (result) {
                if (result.features.length > 0) {
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
                    outline: {
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
                self.selectProperty(new Point({
                    longitude: address.geometry.x,
                    latitude: address.geometry.y,
                    spatialReference: view.spatialReference
                }), "https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer");
            });
        }
    };
    self.addressSelected = function (address) {
        if (address) {
            view.goTo({
                center: [address.geometry.x, address.geometry.y],
                zoom: 17
            });
            self.addAddressToMap(address);
        }
    };
    self.highlightParcel = function (parcel) {
        require(["esri/Graphic", "esri/symbols/SimpleFillSymbol"], function (Graphic, SimpleFillSymbol) {
            var graphic = new Graphic({
                attributes: parcel.attributes,
                geometry: parcel.geometry,
                symbol: new SimpleFillSymbol({
                    color: [255, 0, 0, 0.2],
                    style: "solid",
                    outline: {
                        color: "red",
                        width: 4
                    }
                })
            });
            highlights.removeAll();
            highlights.add(graphic);
        });
    };
    self.unhighlightParcel = function () {
        highlights.removeAll();
    };
    self.removeParcel = function (parcel) {
        require(["esri/geometry/geometryEngine", "esri/Graphic", "esri/symbols/SimpleFillSymbol"], function (geometryEngine, Graphic, SimpleFillSymbol) {
            var graphic = new Graphic({
                attributes: parcel.attributes,
                geometry: parcel.geometry,
                symbol: new SimpleFillSymbol({
                    color: [255, 255, 0, 0.2],
                    style: "solid",
                    outline: {
                        color: "yellow",
                        width: 4
                    }
                })
            });
            var geom = geometryEngine.symmetricDifference(parcel.geometry, polys.graphics.items[0].geometry);
            self.parcels.forEach(function (p, i) {
                if (p.pin === parcel.pin) {
                    self.parcels.splice(i, 1);
                }
            });
            polys.removeAll();
            self.selectedAddress = null;

            if (geom) {
              graphic.geometry = geom;
              polys.add(graphic);
              self.area = geometryEngine.planarArea(geom, "acres");
            }
            self.unhighlightParcel();
            self.aggregateData(parcel);
        });
    };
    self.selectProperty = function (point, url) {
        require(["esri/tasks/QueryTask", "esri/tasks/support/Query", "esri/Graphic", "esri/symbols/SimpleFillSymbol", "esri/geometry/geometryEngine"], function (QueryTask, Query, Graphic, SimpleFillSymbol, geometryEngine) {
            self.selectedAddress = null;
            var query = new Query();
            var queryTask = new QueryTask(url + '/0');
            query.outFields = ['*'];
            query.returnGeometry = true;
            query.geometry = point;
            queryTask.execute(query).then(function (results) {
                if (results.features.length > 0) {
                    var f = results.features[0];
                    var graphic = new Graphic({
                        attributes: f.attributes,
                        geometry: f.geometry,
                        symbol: new SimpleFillSymbol({
                            color: [255, 255, 0, 0.2],
                            style: "solid",
                            outline: {
                                color: "yellow",
                                width: 4
                            }
                        })
                    });
                    var parcel = {address: f.attributes.SITE_ADDRESS, pin: f.attributes.PIN_NUM, geometry: f.geometry, owner: f.attributes.OWNER};
                    var checkParcelExists = null;
                    if (polys.graphics.items.length > 0) {
                        var geom = null;
                        var distance = geometryEngine.distance(f.geometry, polys.graphics.items[0].geometry, 'feet');
                        if (distance < 100) {
                          if (geometryEngine.intersects(polys.graphics.items[0].geometry, f.geometry.centroid)) {
                              geom = geometryEngine.symmetricDifference(f.geometry, polys.graphics.items[0].geometry);
                              self.parcels.forEach(function (parcel, i) {
                                  if (parcel.pin === f.attributes.PIN_NUM) {
                                      self.parcels.splice(i, 1);
                                  }
                              });
                              self.aggregateData(parcel);
                          } else {
                              geom = geometryEngine.union([polys.graphics.items[0].geometry, f.geometry]);
                              checkParcelExists = $filter('filter')(self.parcels, {pin: f.attributes.PIN_NUM});
                              if (checkParcelExists.length < 1) {
                                  self.parcels.push(parcel);
                                  self.getZoning(queryTask, query, parcel);
                              }
                          }
                          polys.removeAll();
                          if (geom) {
                            graphic.geometry = geom;
                            polys.add(graphic);
                            self.area = geometryEngine.planarArea(geom, "acres");
                          }
                        } else {
                          self.showNonContinguous();
                        }
                    } else {
                        polys.add(graphic);
                        checkParcelExists = $filter('filter')(self.parcels, {pin: f.attributes.PIN_NUM});
                        if (checkParcelExists.length < 1) {
                            self.parcels.push(parcel);
                            self.getZoning(queryTask, query, parcel);
                        }
                    }
                    $scope.$digest();
                }
            });
        });
    };
    self.aggregateData = function (parcel) {
        self.data.pins = [];
        self.data.address = [];
        self.data.planning1 = [];
        self.data.planning2 = 'No';
        self.data.planning3 = [];
        self.data.planning4 = [];
        self.data.forestry1 = 1;
        self.data.forestry2 = 1;
        self.data.forestry5 = 1;
        self.parcels.forEach(function (parcel) {
            if (self.data.pins.indexOf(parcel.pin) === -1) {
                self.data.pins.push(parcel.pin);
            }
            if (self.data.address.indexOf(parcel.address) === -1) {
                self.data.address.push(parcel.address);
            }
            if (self.data.planning1.indexOf(parcel.planning1) === -1) {
                self.data.planning1.push(parcel.planning1);
            }
            if (parcel.planning2 === 'Yes') {
                self.data.planning2 = 'Yes';
            }
            if (parcel.planning3) {
                parcel.planning3.forEach(function (item) {
                    if (self.data.planning3.indexOf(item) === -1) {
                        self.data.planning3.push(item);
                    }
                });
            }
            if (self.data.planning4.indexOf(parcel.planning4) === -1 && parcel.planning4 !== 'N/A') {
                self.data.planning4.push(parcel.planning4);
            }
            if (self.area >= 2) {
                self.data.forestry1 = 0;
                if (parcel.forestry2 === 0) {
                    self.data.forestry2 = 0;
                }
            }
            if (parcel.forestry5 === 0) {
                self.data.forestry5 = 0;
            }
        });



    };
    self.createMap = function () {
        require([
            "esri/Map",
            "esri/views/MapView",
            "esri/layers/MapImageLayer",
            "esri/layers/GraphicsLayer",
            "dojo/domReady!"
        ], function (Map, MapView, MapImageLayer, GraphicsLayer) {
            if (!map) {
                map = new Map({basemap: "streets-navigation-vector"});
                view = new MapView({
                    container: "viewDiv",
                    map: map,
                    center: [-78.65, 35.8],
                    zoom: 15
                });
                var parcels = new MapImageLayer({
                    url: "https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer"
                });
                map.add(parcels);
                polys = new GraphicsLayer();
                map.add(polys);
                highlights = new GraphicsLayer();
                map.add(highlights);
                view.on('click', function (point) {
                    if (view.zoom >= 15) {
                        self.selectProperty(point.mapPoint, "https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer");
                    }
                });
            }
        });
    };

}
export default ['$http', '$scope', '$rootScope', '$httpParamSerializerJQLike', '$mdDialog', '$filter', '$window', 'moment', AppController];
