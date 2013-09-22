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

if ( $("main.noLoad").length > 0 ) {
    $("body").removeClass("loading");
}

/**
 * Admin interface
 */
var shnappy = angular.module('Shnappy', []);

shnappy.run(function () {
    $("body").removeClass("loading");
});

// Configure the URLs
shnappy.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/admin', {controller: "SiteList"});
}]);

/** View and edit site configuration */
shnappy.controller("SiteList", ["$scope", "$http", function ($scope, $http) {

    function getSites () {
        $http.get("/admin/api/sites").success(function(data) {
            $scope.sites = data;
        });
    }

    getSites();

    $scope.edit = function (data) {
        $scope.editing = data ? angular.copy(data) : {
            theme: "default",
            hosts: []
        };

        $scope.editing.hosts = $scope.editing.hosts.map(function (val) {
            return { value: val };
        });
    };

    $scope.cancel = function () {
        $scope.editing = null;
    };

    $scope.save = function () {
        var data = $scope.editing;
        data.hosts = data.hosts
            .map(function (val) { return val.value.trim(); })
            .filter(function (val) { return val !== ""; });

        var request;
        if ( data.siteID ) {
            request = $http({
                method: 'PATCH',
                url: '/admin/api/sites/' + data.siteID,
                data: data
            });
        }
        else {
            request = $http({
                method: 'POST',
                url: '/admin/api/sites',
                data: data
            });
        }

        request.success(function () {
            $scope.editing = null;
            getSites();
        });
    };

    $scope.addHost = function () {
        $scope.editing.hosts.push({ value: "" });
    };

    $scope.removeHost = function (index) {
        $scope.editing.hosts.splice(index, 1);
    };

    $scope.delete = function () {
        if ( confirm("Are you sure you want to delete this site?") ) {
            $http.delete(
                '/admin/api/sites/' + $scope.editing.siteID
            ).success(function () {
                $scope.editing = null;
                getSites();
            });
        }
    };
}]);

