function DialogController($scope, $mdDialog, $window) {

    $scope.hideSplash = function () {
        $mdDialog.hide();
    };
    $scope.hideConfirm = function () {
        $mdDialog.hide();
        $window.location.reload();
    };
}
export default ['$scope', '$mdDialog', '$window', DialogController];