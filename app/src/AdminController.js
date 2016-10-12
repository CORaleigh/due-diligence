function AdminController($http, $stateParams, $state, $mdDialog, $window) {
    'use strict';
    var self = this;
    if (!$window.sessionStorage.getItem('credentials')) {//!$stateParams.user) {
        $state.go('login');
        return false;
    } else if ($window.sessionStorage.getItem('credentials').expires > new Date()) {
        $state.go('login');
        return false;
    }
    var api = 'http://mapstest.raleighnc.gov/parks-form-api/';
    var creds = JSON.parse($window.sessionStorage.getItem('credentials'));
    var token = creds.token;
    self.user = creds.user;
    self.selectedTab = $stateParams.tab ? $stateParams.tab : 0;
    self.$window = $window;
    self.tabSelected = function (index) {
        var i;
        if (!self.user) {
            return false;
        }
        if (!token) {
            return false;
        }
        if (!self.facilities) {
            $http.get(api + "facilities", {params: {token: token}}).then(function (response) {
                if (response.data.success) {
                    self.facilities = response.data.results;
                } else {
                    $state.go('login', {message: response.data.message});
                }
            });
        }
        if (!self.jobs) {
            $http.get(api + "jobs", {params: {token: token}}).then(function (response) {
                if (response.data.success) {
                    self.jobs = response.data.results;
                } else {
                    $state.go('login', {message: response.data.message});
                }
            });
        }
        if (!self.programs) {
            $http.get(api + "programs", {params: {token: token}}).then(function (response) {
                if (response.data.success) {
                    self.programs = response.data.results;
                } else {
                    $state.go('login', {message: response.data.message});
                }
            });
        }
        if (!self.services) {
            $http.get(api + "services", {params: {token: token}}).then(function (response) {
                if (response.data.success) {
                    self.services = response.data.results;
                    for (i = 0; i < self.services.length; i += 1) {
                        self.services[i].value *= 100;
                    }
                } else {
                    $state.go('login', {message: response.data.message});
                }
            });
        }
        $http.get(api + "users", {params: {token: token}}).then(function (response) {
            if (response.data.success) {
                self.users = response.data.results;
            } else {
                $state.go('login', {message: response.data.message});
            }
        });

        self.addFacility = function () {
            if (self.newFacility) {
                var url = api + "facilities";
                $http.post(url, {name: self.newFacility, token: token}).then(function (response) {
                    self.facilities.push({name: self.newFacility, _id: response._id});
                    self.newFacility = null;
                });
            }
        };
        self.addProgram = function () {
            if (self.newProgram) {
                var url = api + "programs";
                $http.post(url, {name: self.newProgram, token: token}).then(function (response) {
                    self.programs.push({name: self.newProgram, _id: response.data._id});
                    self.newProgram = null;
                });
            }
        };
        self.addService = function () {
            if (self.newServiceName && self.newServiceValue) {
                var url = api + "services";///" + service._id;
                $http.post(url, {name: self.newServiceName, value: self.newServiceValue / 100, token: token}).then(function () {
                    self.services.push({name: self.newServiceName, value: self.newServiceValue});
                    self.newServiceName = null;
                    self.newServiceValue = null;
                });
            }
        };
        self.updateService = function (service) {
            var url = api + "services/" + service._id;
            $http.post(url, {name: service.name, value: service.value / 100, token: token});
        };

        self.addJob = function () {
            if (self.newJob) {
                var url = api + "jobs";
                $http.post(url, {name: self.newJob, token: token}).then(function () {
                    self.jobs.push({name: self.newJob});
                    self.newJob = null;
                });
            }
        };

        self.showConfirm = function (ev, type, field, item) {
            var confirm = $mdDialog.confirm()
                .title('Would you like to delete ' + type + ': ' + item[field] + '?')
                .ariaLabel('Delete')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function () {
                switch (type) {
                case 'facility':
                    self.deleteFacility(item);
                    break;
                case 'program':
                    self.deleteProgram(item);
                    break;
                case 'job':
                    self.deleteJob(item);
                    break;
                case 'service':
                    self.deleteService(item);
                    break;
                case 'user':
                    self.deleteUser(item);
                    break;
                }
            });
        };

        self.deleteFacility = function (facility) {
            $http({
                method: 'DELETE',
                url: api + 'facilities',
                data: {id: facility._id, token: token},
                headers: {'Content-Type': 'application/json;charset=utf-8'}
            }).then(function () {
                index = self.facilities.indexOf(facility);
                self.facilities.splice(index, 1);
            });
        };
        self.deleteJob = function (job) {
            $http({
                method: 'DELETE',
                url: api + 'jobs',
                data: {id: job._id, token: token},
                headers: {'Content-Type': 'application/json;charset=utf-8'}
            }).then(function () {
                index = self.jobs.indexOf(job);
                self.jobs.splice(index, 1);
            });
        };
        self.deleteProgram = function (program) {
            $http({
                method: 'DELETE',
                url: api + 'programs',
                data: {id: program._id, token: token},
                headers: {'Content-Type': 'application/json;charset=utf-8'}
            }).then(function () {
                index = self.programs.indexOf(program);
                self.programs.splice(index, 1);
            });
        };
        self.deleteService = function (service) {
            $http({
                method: 'DELETE',
                url: api + 'services',
                data: {id: service._id, token: token},
                headers: {'Content-Type': 'application/json;charset=utf-8'}
            }).then(function () {
                index = self.services.indexOf(service);
                self.services.splice(index, 1);
            });
        };
        self.deleteUser = function (user) {
            $http({
                method: 'DELETE',
                url: api + 'users/' + user._id,
                data: {token: token},
                headers: {'Content-Type': 'application/json;charset=utf-8'}
            }).then(function () {
                index = self.users.indexOf(user);
                self.users.splice(index, 1);
            });
        };
        self.changeAdmin = function (user) {
            var url = api + "users/" + user._id;
            $http.post(url, {admin: user.admin, token: token});
        };
    };
}
export default ['$http', '$stateParams', '$state', '$mdDialog', '$window', AdminController];