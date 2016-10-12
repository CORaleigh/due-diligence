/**
 * Main App Controller for the Angular Material Starter App
 * @constructor
 */
function SignupController($http, $state, $mdToast) {
    'use strict';
    var self = this;
    self.signup = function (credentials) {
        credentials.email = credentials.email.toLowerCase();
        $http.post('http://mapstest.raleighnc.gov/parks-form-api/signup', credentials).then(function (result) {
            if (result.data.success) {
                $state.go('login', {email: credentials.email});
            } else {
                self.showToast(result.data.msg);
            }
        });
    };
    self.showToast = function (message) {
        var toast = $mdToast.simple().position('top').textContent(message);
        $mdToast.show(toast);
    };
}
export default ['$http', '$state', '$mdToast', SignupController];