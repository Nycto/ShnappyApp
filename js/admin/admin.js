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

/** Returns a route configuration */
function route ( name ) {
    return {
        controller: name + "Ctrl",
        template: function () {
            var tplID = name + "Tpl";
            var template = document.getElementById(tplID);
            if ( !template )
                throw "Could not find template: " + tplID;
            return template.innerHTML;
        }
    };
}

// Configure the URLs
shnappy.config([
    '$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {

    $locationProvider.html5Mode(true);

    $routeProvider
        .when('/admin', route("SiteList"))
        .when('/admin/sites', route("SiteList"))
        .when('/admin/sites/:siteID', route("SiteEdit"));
}]);


/** View the list of available sites */
shnappy.controller("SiteListCtrl", [
    "$scope", "$http",
    function ($scope, $http) {

    $http.get("/admin/api/sites").success(function(data) {
        $scope.sites = data;
    });
}]);


/** Edit a site */
shnappy.controller("SiteEditCtrl", [
    "$scope", "$http", "$routeParams", "$location",
    function ($scope, $http, $routeParams, $location) {

    if ( $routeParams.siteID && $routeParams.siteID !== "create" ) {
        $scope.editing = true;

        $http.get("/admin/api/sites/" + $routeParams.siteID)
            .success(function(data) {
                $scope.site = data;

                $scope.site.hosts = $scope.site.hosts.map(function (val) {
                    return { value: val };
                });
            });
    }
    else {
        $scope.site = {
            theme: "default",
            hosts: [ { value: "" } ]
        };
    }

    $scope.addHost = function () {
        $scope.site.hosts.push({ value: "" });
    };

    $scope.removeHost = function (index) {
        $scope.site.hosts.splice(index, 1);
    };

    $scope.cancel = function () {
        $location.url("/admin/sites");
    };

    $scope.save = function () {
        var toSave = $scope.site;
        toSave.hosts = toSave.hosts
            .map(function (val) { return val.value.trim(); })
            .filter(function (val) { return val !== ""; });

        var request;
        if ( toSave.siteID ) {
            request = $http({
                method: 'PATCH',
                url: '/admin/api/sites/' + toSave.siteID,
                data: toSave
            });
        }
        else {
            request = $http({
                method: 'POST',
                url: '/admin/api/sites',
                data: toSave
            });
        }

        request.success(function () {
            $location.url("/admin/sites");
        });
    };

    $scope.delete = function () {
        if ( confirm("Are you sure you want to delete this site?") ) {
            $http.delete(
                '/admin/api/sites/' + $scope.site.siteID
            ).success(function () {
                $location.url("/admin/sites");
            });
        }
    };
}]);

