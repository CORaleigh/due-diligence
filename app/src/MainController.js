/**
 * Main App Controller for the Angular Material Starter App
 * @constructor
 */
function MainController($http, $filter, $rootScope, $scope, $timeout, $state, $stateParams, $mdDialog, $mdMedia, $window) {
    'use strict';
    var self = this;

    if (!$window.sessionStorage.getItem('credentials')) {
        $state.go('login');
        return false;
    }
    if ($window.sessionStorage.getItem('credentials').expires > new Date()) {
        $state.go('login');
        return false;
    }


    var api = 'http://mapstest.raleighnc.gov/parks-form-api/';
    var creds = JSON.parse($window.sessionStorage.getItem('credentials'));
    var token = creds.token;
    self.user = creds.user;

    $rootScope.$emit("UserAuthenticated", $stateParams);

    var FICA = 1.0765;
    self.selected = null;
    self.selectedTab = 0;
    self.cityFacility = true;
    self.payTypes = [{
        name: "Per Student"
    }, {
        name: "Hourly"
    }];
    self.statuses = [{
        name: "Contractor"
    }, {
        name: "Payroll"
    }];
    self.data = {
        default: true,
        preparer: self.user.email,
        target: {},
        personnel: [{
            visible: true,
            cost: null
        }],
        cityFacility: true,
        full: false,
        newProgram: false,
        comments: ''
    };
    self.costEstimate = 0;
    self.revenueEstimate = 0;

    var today = new Date();
    var tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    var lastYear = new Date();
    lastYear.setMonth(lastYear.getMonth() - 12);
    self.filter = {
        me: true,
        from: lastYear,
        to: tomorrow,
        title: ""
    };
    self.showFilter = true;
    $timeout(function () {
        if ($window.sessionStorage.getItem('data')) {
            self.data = JSON.parse($window.sessionStorage.getItem('data'));
        }
    });

    $scope.$mdMedia = $mdMedia;
    //get Facilities, Targets, and Jobs from database
    $http.get(api + "programs", {
        params: {
            token: token
        }
    }).then(function (response) {
        if (response.data.success) {
            self.programs = response.data.results;
        } else {
            $state.go('login', {
                message: response.data.message
            });
        }
        $http.get(api + "services", {
            params: {
                token: token
            }
        }).then(function (response) {
            if (response.data.success) {
                self.services = response.data.results;
            } else {
                $state.go('login', {
                    message: response.data.message
                });
            }
            $http.get(api + "facilities", {
                params: {
                    token: token
                }
            }).then(function (response) {
                if (response.data.success) {
                    self.facilities = response.data.results;
                } else {
                    $state.go('login', {
                        message: response.data.message
                    });
                }
                $http.get(api + "jobs", {
                    params: {
                        token: token
                    }
                }).then(function (response) {
                    if (response.data.success) {
                        self.jobs = response.data.results;
                    } else {
                        $state.go('login', {
                            message: response.data.message
                        });
                    }

                    //if ID set in URL, select entry by id
                    if ($stateParams.id) {
                        self.getEntryById($stateParams.id);
                    }
                });
            });
        });
    });

    //check if division is NaN
    self.checkNaN = function (value) {
        return isNaN(value) || !isFinite(value);
    };

    //calculation functions
    self.residentialRateChanged = function (rate) {
        //if rate great than 15, add 15 for non-residental rate
        self.data.nonResidentialRate = (rate <= 15) ? rate : rate + 15;
    };
    self.calcRevenue = function () {
        var value = self.data.residentialRate * self.data.minParticipants;
        // if (self.data.full)
        //   value = self.data.residentialRate * ((self.data.minParticipants + self.data.maxParticipants)/2);
        if (isNaN(value)) {
            value = 0;
        }
        if (self.data.altRevAmt) {
            value += self.data.altRevAmt;
        }
        self.revenueEstimate = value;
        return value;
    };
    self.calcCost = function () {
        var personnel = {};
        var value = 0;
        var i;
        for (i = 0; i < self.data.personnel.length; i += 1) {
            personnel = self.data.personnel[i];
            personnel.cost = null;
            if (personnel.payType === 'Hourly') {
                personnel.cost = personnel.rate * personnel.count * (self.data.weeks * self.data.hours);
            } else if (personnel.payType === 'Per Student') {
                personnel.cost = personnel.rate * personnel.count * self.data.minParticipants;
            }
            if (personnel.status === "Payroll") {
                personnel.cost *= FICA;
            }
            value += personnel.cost;
        }
        if (isNaN(value)) {
            value = 0;
        }
        if (self.data.supplyAmt) {
            value += self.data.supplyAmt;
        }
        if (self.data.programArea === 'Athletics') {
            value *= 1.4256;
        } else {
            value *= 1.4503;
        }
        self.costEstimate = value;
        return value;
    };
    //personnel functions
    self.addPersonnel = function () {
        var i;
        self.data.personnel.unshift({});
        for (i = 0; i < self.data.personnel.length; i += 1) {
            self.data.personnel[i].visible = (i === 0);
        }
    };
    self.removePersonnel = function (id) {
        self.data.personnel.splice(id, 1);
        if (self.data.personnel.length > 0) {
            self.data.personnel[0].visible = true;
        }
    };

    //submit new entry
    self.submit = function (isCopy) {
        var url = api + "form/";
        if (self.id) {
            url += self.id;
        }
        console.log(self.data);
        $http.post(url, {
            programArea: self.data.programArea.name,
            title: self.data.title,
            category: self.data.service,
            cityFacility: self.data.cityFacility,
            facility: self.data.facility.name,
            start: self.data.start,
            preparer: self.user.email,
            comments: self.data.comments,
            newProgram: self.data.newProgram,
            minParticipants: self.data.minParticipants,
            maxParticipants: self.data.maxParticipants,
            full: self.data.full,
            weeks: self.data.weeks,
            hours: self.data.hours,
            residentialRate: self.data.residentialRate,
            nonResidentialRate: self.data.nonResidentialRate,
            altRevDesc: self.data.altRevDesc,
            altRevAmt: self.data.altRevAmt,
            supplyDesc: self.data.supplyDesc,
            supplyAmt: self.data.supplyAmt,
            personnel: JSON.stringify(self.data.personnel),
            submitted: new Date(),
            needsReview: ((self.revenueEstimate / self.costEstimate) < self.data.service.value) || self.checkNaN(self.revenueEstimate / self.costEstimate) || self.checkNaN(self.data.service.value),
            revenue: self.revenueEstimate,
            cost: self.costEstimate,
            recoveryProjected: self.revenueEstimate / self.costEstimate,
            recoveryTarget: self.data.service.value,
            token: token
        }).then(function (response) {
            if (isCopy) {
                self.selectedTab = 1;
            } else {
                self.selectedTab = 4;
                self.clear();
            }

            if (response.data.success) {
                self.id = response.data.results._id;
                self.data._id = self.id;
                $state.go('form.id', {
                    id: self.id
                });
            } else {
                $state.go('login', {
                    message: response.data.message
                });
            }


        });
    };

    var formatDate = function (date) {
        var y = date.getFullYear(),
            mo = date.getMonth() + 1,
            d = date.getDate();
        if (mo < 10) {
            mo = "0" + mo;
        }
        return y + "-" + mo + "-" + d + " 00:00:00";
    };

    self.titleFilterChanged = function (title) {
        if (title.length) {
            self.getHistory();
        }
    };
    //get all entries when History tab selected
    self.getHistory = function () {
        var where = {
            submitted: {}
        };
        if (self.filter.me) {
            where.preparer = self.user.email;
        }
        if (self.filter.from) {
            where.submitted.$gte = formatDate(self.filter.from);
        }
        if (self.filter.programArea) {
            where.programArea = self.filter.programArea.name;
        }

        if (self.filter.service) {
            where['category.name'] = self.filter.service.name;
        }
        if (self.filter.title) {
            where.$or = [{
                title: {
                    $regex: ".*" + self.filter.title + ".*",
                    $options: "i"
                }
            }, {
                facility: {
                    $regex: ".*" + self.filter.title + ".*",
                    $options: "i"
                }
            }];
        }
        $http.get(api + "form", {
            params: {
                token: token,
                where: where
            }
        }).then(function (response) {
            if (response.data.success) {
                self.history = response.data.results;
            } else {
                $state.go('login', {
                    message: response.data.message
                });
            }
        });
    };

    //get entry by ID
    self.getEntryById = function (id) {
        $http.get(api + "form/" + id, {
            params: {
                token: token
            }
        }).then(function (response) {
            if (response.data.results.length > 0) {
                self.selectEntry(response.data.results[0]);
            }
        });
    };

    //delete entry functions
    self.deleteEntry = function (entry) {
        $http({
            method: 'DELETE',
            url: api + 'form',
            data: {
                id: entry._id,
                token: token
            },
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        }).then(function () {
            self.getHistory();
        });
    };
    self.showConfirm = function (ev, entry) {
        var confirm = $mdDialog.confirm()
            .title('Would you like to delete this entry?')
            .ariaLabel('Delete')
            .targetEvent(ev)
            .ok('Yes')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function () {
            self.deleteEntry(entry);
        });
    };
    self.showCopyConfirm = function (ev, entry) {
        var confirm = $mdDialog.confirm()
            .title('This will create a new entry with the values of this entry, would you like to continue?')
            .ariaLabel('Copy')
            .targetEvent(ev)
            .ok('Yes')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function () {
            self.copyEntry(entry);
        });
    };
    //handle cloning of entry
    self.copyEntry = function (entry) {
        self.selectEntry(entry, true);
        entry.preparer = self.user.email;
        self.data.preparer = self.user.email;
        self.id = null;
        $timeout(function () {
            self.submit(true);
        }, 2000);
    };

    //handle select button click
    self.selectEntry = function (entry, isCopy) {
        // location.skipReload().path(entry._id);
        $state.go('form.id', {
            id: entry._id
        });
        self.id = entry._id;
        self.data.programArea = $filter('filter')(self.programs, entry.programArea)[0];
        self.data.service = $filter('filter')(self.services, entry.category)[0];
        self.data.title = entry.title;
        self.data.start = new Date(entry.start);
        self.data.cityFacility = entry.cityFacility;
        self.data.facility = $filter('filter')(self.facilities, entry.facility)[0];
        self.data.preparer = entry.preparer;
        self.data.comments = entry.comments;
        self.data.newProgram = entry.newProgram;
        self.data.minParticipants = entry.minParticipants;
        self.data.maxParticipants = entry.maxParticipants;
        self.data.full = entry.full;
        self.data.weeks = entry.weeks;
        self.data.hours = entry.hours;
        self.data.residentialRate = entry.residentialRate;
        self.data.nonResidentialRate = entry.nonResidentialRate;
        self.data.altRevAmt = entry.altRevAmt;
        self.data.altRevDesc = entry.altRevDesc;
        self.data.supplyAmt = entry.supplyAmt;
        self.data.supplyDesc = entry.supplyDesc;
        self.data.personnel = entry.personnel;
        if (!isCopy) {
            self.selectedTab = 1;
        }
        self.programSelected = true;
    };

    //clear form
    self.clear = function () {
        self.data = {
            default: true,
            preparer: self.user.email,
            target: {},
            personnel: [{
                visible: true,
                cost: null
            }],
            cityFacility: true,
            full: false,
            newProgram: false,
            comments: ''
        };
        self.id = null;
        self.selectedTab = 1;
        $window.sessionStorage.removeItem('data');
        $state.go('form');
    };

    //handle collapsing/expanding of personnel cards
    self.togglePersonnel = function (personnel, index) {
        var i;
        personnel.visible = !personnel.visible;
        for (i = 0; i < self.data.personnel.length; i += 1) {
            if (i !== index) {
                self.data.personnel[i].visible = false;
            }
        }
    };

    var getMaxStaff = function (data) {
        var max = 0,
            i = 0;
        for (i = 0; i < data.length; i += 1) {
            if (data[i].personnel) {
                if (data[i].personnel.length > max) {
                    max = data[i].personnel.length;
                }
            }
        }
        return max;
    };

    var convertCsv = function (data, headers) {
        var result, columnDelimiter, lineDelimiter, i;
        result = '';
        columnDelimiter = ',';
        lineDelimiter = '\n';
        var maxStaff = getMaxStaff(data);
        for (i = 0; i < headers.length; i += 1) {
            result += headers[i].display;
            result += columnDelimiter;
        }
        for (i = 0; i < maxStaff; i += 1) {
            result += "Staff Title " + (i + 1);
            result += columnDelimiter;
            result += "Staff Pay Type " + (i + 1);
            result += columnDelimiter;
            result += "Staff Status " + (i + 1);
            result += columnDelimiter;
            result += "Staff Pay Rate " + (i + 1);
            result += columnDelimiter;
            result += "Staff Count " + (i + 1);
            result += columnDelimiter;
        }

        result += lineDelimiter;
        var item = {},
            personnel = {},
            j = 0;
        for (i = 0; i < data.length; i += 1) {
            item = data[i];
            for (j = 0; j < headers.length; j += 1) {
                if (item[headers[j].field] !== undefined) {
                    if (headers[j].subField) {
                        result += item[headers[j].field][headers[j].subField];
                    } else {
                        result += item[headers[j].field];
                    }
                    result += columnDelimiter;
                } else {
                    result += columnDelimiter;
                }

            }
            if (item.personnel) {
                for (j = 0; j < item.personnel.length; j += 1) {
                    personnel = item.personnel[j];
                    result += personnel.title;
                    result += columnDelimiter;
                    result += personnel.payType;
                    result += columnDelimiter;
                    result += personnel.status;
                    result += columnDelimiter;
                    result += personnel.rate;
                    result += columnDelimiter;
                    result += personnel.count;
                    result += columnDelimiter;
                }
            }
            result += lineDelimiter;
        }
        return result;
    };
    self.exportCsv = function () {
        console.log(self.history);
        var headers = [{
            field: 'title',
            display: 'Title'
        }, {
            field: 'programArea',
            display: 'Program Area'
        }, {
            field: 'category',
            subField: 'name',
            display: 'Category of Service'
        }, {
            field: 'facility',
            display: 'Facility'
        }, {
            field: 'preparer',
            display: 'Prepared By'
        }, {
            field: 'submitted',
            display: 'Submitted'
        }, {
            field: 'start',
            display: 'Start Date'
        }, {
            field: 'comments',
            display: 'Comments'
        }, {
            field: 'newProgram',
            display: 'New Program'
        }, {
            field: 'full',
            display: 'Usually Full?'
        }, {
            field: 'hours',
            display: 'Hours Per Week'
        }, {
            field: 'weeks',
            display: 'Weeks'
        }, {
            field: 'minParticipants',
            display: 'Min # of Participants'
        }, {
            field: 'maxParticipants',
            display: 'Max # of Participants'
        }, {
            field: 'residentialRate',
            display: 'Residential Rate'
        }, {
            field: 'nonResidentialRate',
            display: 'Non-Residential Rate'
        }, {
            field: 'altRevDesc',
            display: 'Alternative Revenue'
        }, {
            field: 'altRevAmt',
            display: 'Alternative Revenue Amount'
        }, {
            field: 'supplyDesc',
            display: 'Supplies'
        }, {
            field: 'supplyAmt',
            display: 'Supplies Amount'
        }, {
            field: 'revenue',
            display: 'Revenue Estimate'
        }, {
            field: 'cost',
            display: 'Cost Estimate'
        }, {
            field: 'recoveryTarget',
            display: 'Cost Recovery (target)'
        }, {
            field: 'recoveryProjected',
            display: 'Cost Recovery (projected)'
        }];
        var data, filename, link;
        var csv = convertCsv(self.history, headers);
        filename = 'pricingForm.csv';
        csv = 'data:text/csv;charset=utf-8,' + csv;
        data = encodeURI(csv);
        link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();
    };

    self.backTab = function () {
        self.selectedTab -= 1;
    };
    self.nextTab = function () {
        self.selectedTab += 1;
    };
}
export default ['$http', '$filter', '$rootScope', '$scope', '$timeout', '$state', '$stateParams', '$mdDialog', '$mdMedia', '$window', MainController];