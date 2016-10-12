/**
 * Main App Controller for the Angular Material Starter App
 * @param UsersDataService
 * @param $mdSidenav
 * @constructor
 */
function AppController($mdSidenav, $http, $rootScope, $scope, $location, $state, $mdMedia, $window) {
    'use strict';
    var self = this;
    $rootScope.$on("UserAuthenticated", function () {
        //self.params = params;
        //console.log(params);
        self.$state = $state;
        if ($window.sessionStorage.getItem('credentials')) {
            self.params = JSON.parse($window.sessionStorage.getItem('credentials'));
        }
    });
    self.$state = $state;
    console.log($state);
    self.admin = $location.path().indexOf('admin') > -1;
    if ($window.sessionStorage.getItem('credentials')) {
        self.params = JSON.parse($window.sessionStorage.getItem('credentials'));
    }
    self.adminClicked = function () {
        self.admin = !self.admin;
        if (self.admin) {
            $state.go('admin', self.params);
        } else {
            $state.go('form', self.params);
        }
    };
    self.logout = function () {
        self.params = null;
        $state.go('login');
    };
    self.toggleList = function () {
        $mdSidenav('left').toggle();
    };
    $scope.$mdMedia = $mdMedia;

    $rootScope.$watch(function () {
        return $http.pendingRequests.length;
    }, function (status) {
        if (status === 0) {
            self.loading = false;
        } else if (status === 1) {
            self.loading = true;
        }
    });

}
export default ['$mdSidenav', '$http', '$rootScope', '$scope', '$location', '$state', '$mdMedia', '$window', AppController];