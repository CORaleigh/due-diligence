/**
 * Main App Controller for the Angular Material Starter App
 * @param UsersDataService
 * @param $mdSidenav
 * @constructor
 */
function ForgotController($http, $state, $stateParams, $mdToast) {
    'use strict';
    var self = this;
    self.forgot = function (email) {
        email = email.toLowerCase();
        $http.post('http://mapstest.raleighnc.gov/parks-form-api/forgot', {email: email}).then(function (result) {
            if (result.data.success) {
                $state.go('login', {email: email});
            } else {
                self.showToast(result.data.msg);
            }
        });
    };
    self.showToast = function (message) {
        var toast = $mdToast.simple().position('top').textContent(message);
        $mdToast.show(toast);
    };

    if ($stateParams.message) {
        self.showToast($stateParams.message);
    }
}
export default ['$http', '$state', '$stateParams', '$mdToast', ForgotController];