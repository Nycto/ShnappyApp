/**
 * Shnappy Admin Logic
 */

/** Look for clicks on any login buttons */
$(window.document).on('click', '.login-button', function (e) {
    e.preventDefault();
    navigator.id.request();
});

/** Handle logins via Mozilla Persona */
if ( window.loggedIn !== undefined ) {
    navigator.id.watch({
        loggedInUser: window.loggedIn,
        onlogin: function(assertion) {
            $.ajax({
                type: 'PUT',
                url: '/admin/api/login',
                data: {assertion: assertion}
            }).done(function () {
                window.location.reload();
            }).fail(function () {
                navigator.id.logout();
            });
        },
        onlogout: function() {
            $.ajax({
                type: 'PUT',
                url: '/admin/api/logout'
            }).always(function () {
                window.location.reload();
            });
        }
    });

    $(document.body).on("click", ".signout", function () {
        navigator.id.logout();
    });
}

/**
 * Admin interface
 */
var shnappy = angular.module('Shnappy', []);

// Configure the URLs
shnappy.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/admin', {controller: "SiteList"});
}]);

shnappy.controller("SiteList", ["$scope", "$http", function ($scope, $http) {
    $http.get("/admin/api/sites").success(function(data) {
        $scope.sites = data;
    });
}]);

