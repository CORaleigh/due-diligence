/**
 * Main App Controller for the Angular Material Starter App
 * @param UsersDataService
 * @param $mdSidenav
 * @constructor
 */
function ResetController($http, $state, $stateParams, $mdToast) {
    'use strict';
    var self = this;
    self.reset = function (credentials) {
        credentials.email = credentials.email.toLowerCase();
        credentials.token = $stateParams.token;
        $http.post('http://mapstest.raleighnc.gov/parks-form-api/reset', credentials).then(function (result) {
            if (result.data.success) {
                $state.go('login', {user: result.data.user});
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
export default ['$http', '$state', '$stateParams', '$mdToast', ResetController];