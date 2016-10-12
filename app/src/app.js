// Load libraries
import angular from 'angular';

import 'angular-animate';
import 'angular-aria';
import 'angular-material';
import 'angular-ui-router';
import AppController from 'src/AppController';
import AdminController from 'src/AdminController';
import MainController from 'src/MainController';
import LoginController from 'src/LoginController';
import SignupController from 'src/SignupController';
import ForgotController from 'src/ForgotController';
import ResetController from 'src/ResetController';

export default angular.module( 'starter-app', [ 'ngMaterial', 'ngAnimate', 'ui.router'] )
  .config(($mdIconProvider, $mdThemingProvider, $httpProvider, $stateProvider, $urlRouterProvider) => {
    // Register the user `avatar` icons
    $mdIconProvider
      .defaultIconSet("./assets/svg/avatars.svg", 128)
      .icon("menu", "./assets/svg/menu.svg", 24)
      .icon("share", "./assets/svg/share.svg", 24)
      .icon("google_plus", "./assets/svg/google_plus.svg", 24)
      .icon("hangouts", "./assets/svg/hangouts.svg", 24)
      .icon("twitter", "./assets/svg/twitter.svg", 24)
      .icon("phone", "./assets/svg/phone.svg", 24)
      .icon("feedback", "./assets/svg/ic_feedback_black_24px.svg", 24)
      .icon("down", "./assets/svg/ic_keyboard_arrow_down_white_24px.svg", 24)
      .icon("up", "./assets/svg/ic_keyboard_arrow_up_white_24px.svg", 24)          
      .icon("more", "./assets/svg/more_vert.svg", 24)
      .icon("add", "./assets/svg/add.svg", 24)
      .icon("update", "./assets/svg/update.svg", 24)          
      .icon("delete", "./assets/svg/delete.svg", 24);       
    $mdThemingProvider.theme('default')
      .primaryPalette('green')
      .accentPalette('blue');
    $httpProvider.defaults.headers.delete = { 'Accept' : 'application/json' }; 
    $urlRouterProvider.otherwise('/login');
    $stateProvider
    .state('login', {
      url: '/login', 
      templateUrl: './templates/login.html',
      params: {message: null, email: null}
    })
    .state('signup', {
      url: '/signup', 
      templateUrl: './templates/signup.html'
    })    
    .state('form', {
        url: '/form',
        templateUrl: './templates/main.html',
        params: {user: null, token: null}
    })
    .state('form.id', {
        url: '/:id',
        templateUrl: './templates/main.html'     
    })    
    .state('admin', {
        url: '/admin',
        templateUrl: './templates/admin.html',
        params: {tab: 0, user: null, token: null}   
    })
    .state('admin.tab', {
        url: '/:tab',
        templateUrl: './templates/admin.html',
        params: {tab: 0, user: null, token: null}     
    })
    .state('forgot', {
      url: '/forgot',
      templateUrl: './templates/forgot.html'
    })
    .state('reset', {
      url: '/reset/:token',
      templateUrl: './templates/reset.html'
    })    
    .state('reset.token', {
      url: '/reset/:token',
      templateUrl: './templates/reset.html',
      params: {token: null}
    });
  })
  .controller('AppController', AppController)
  .controller('AdminController', AdminController)
  .controller('MainController', MainController)
  .controller('LoginController', LoginController)
  .controller('SignupController', SignupController)  
  .controller('ForgotController', ForgotController)   
  .controller('ResetController', ResetController)         
  .factory('location', [
    '$location',
    '$route',
    '$rootScope',
    function ($location, $route, $rootScope) {
        $location.skipReload = function () {
            var lastRoute = $route.current;
            var un = $rootScope.$on('$locationChangeSuccess', function () {
                $route.current = lastRoute;
                un();
            });
            return $location;
        };
        return $location;
    }
]);  
