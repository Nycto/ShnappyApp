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


/** A central error registry */
shnappy.service('errors', ['$rootScope', function ($rootScope) {
    this._error = null;
    this.error = function ( error ) {
        this._error = error;
        $rootScope.$broadcast("error", error);
    };
    this.onError = function ( callback ) {
        $rootScope.$on("error", callback);
        if ( this._error ) {
            $rootScope.$apply(function () {
                callback(this._error);
            });
        }
    };
}]);

/** Global http error handler */
shnappy.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push(['$q', 'errors', function ($q, errors) {
        return {
            'responseError': function (responseError) {
                if ( responseError.data.message )
                    errors.error( responseError.data.message );
                else if ( responseError.status > 0 )
                    errors.error( "Request error: " + responseError.status );
                else
                    errors.error( "Request error" );

                return $q.reject(responseError);
            }
        };
    }]);
}]);

/** A directive for displaying the most recent error */
shnappy.directive('recentError', ['errors', function (errors) {
    return {
        restrict: 'A',
        link: function (scope, elem) {
            elem.hide();
            errors.onError(function (event, err) {
                elem.text( err ).show();
            });
        }
    };
}]);


/**
 * Converts a list of strings to a list of objects
 */
function toObjList ( strings ) {
    return strings.map(function (val) {
        return { value: val };
    });
}

/**
 * Converts a list of objects back to a list of strings
 */
function toStrList ( objects ) {
    return objects.map(function (val) {
        return val.value.trim();
    }).filter(function (val) {
        return val !== "";
    });
}


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
                $scope.site.hosts = toObjList( $scope.site.hosts );
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
        toSave.hosts = toStrList( toSave.hosts );

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

