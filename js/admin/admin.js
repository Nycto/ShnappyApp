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

/**
 * Returns the content for a template by its ID
 */
function getTemplate ( id ) {
    var elem = document.getElementById(id);
    if ( !elem ) throw "Could not find template: " + id;
    return elem.innerHTML;
}

/**
 * Decorates the route provider to only list routes where the template exists
 * within the current page load.
 */
function route ( $routeProvider ) {
    var iface = {};
    iface.when = function (path, name, options) {
        var template = document.getElementById(name + "Tpl");
        if ( template ) {
            $routeProvider.when(path, angular.extend({
                controller: name + "Ctrl",
                template: function () {
                    return template.innerHTML;
                }
            }, options || {}));
        }
        return iface;
    };
    return iface;
}

// Configure the URLs
shnappy.config([
    '$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {

    $locationProvider.html5Mode(true);

    route( $routeProvider )
        .when('/admin', "SiteList")
        .when('/admin/sites', "SiteList")
        .when('/admin/sites/:siteID', "SiteEdit")
        .when('/admin/users', "UserList")
        .when('/admin/users/:userID', "UserEdit")
        .when('/admin/sites/:siteID/content', "Content",
            { reloadOnSearch: false });
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

    $rootScope.$on('$routeChangeStart', function() {
        this.error(null);
    }.bind(this));

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
                if ( err )
                    elem.text( err ).show();
                else
                    elem.hide();
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


/** View the list of users */
shnappy.controller("UserListCtrl", [
    "$scope", "$http",
    function ($scope, $http) {

    $http.get("/admin/api/users").success(function(data) {
        $scope.users = data;
    });
}]);

/** Edit/Create a user */
shnappy.controller("UserEditCtrl", [
    "$scope", "$http", "$routeParams", "$location",
    function ($scope, $http, $routeParams, $location) {

    if ( $routeParams.userID && $routeParams.userID !== "create" ) {
        $scope.editing = true;

        $http.get("/admin/api/users/" + $routeParams.userID)
            .success(function(data) {
                $scope.user = data;
                $scope.access = {};
                data.sites.map(function (siteID) {
                    $scope.access[siteID] = true;
                });
            });
    }
    else {
        $scope.user = {};
        $scope.access = {};
    }

    $http.get("/admin/api/sites").success(function(data) {
        $scope.sites = data;
    });

    $scope.save = function () {
        var user = angular.copy($scope.user);
        user.sites = Object.keys($scope.access)
            .filter(function (siteID) { return $scope.access[siteID]; })
            .map(function (siteID) { return siteID; });

        var request;
        if ( user.userID ) {
            request = $http({
                method: 'PATCH',
                url: "/admin/api/users/" + user.userID,
                data: user
            });
        }
        else {
            request = $http({
                method: 'POST',
                url: '/admin/api/users',
                data: user
            });
        }

        request.success(function () { $location.url("/admin/users"); });
    };

    $scope.cancel = function () {
        $location.url("/admin/users");
    };

    $scope.delete = function () {
        if ( confirm("Are you sure you want to delete this user?") ) {
            $http.delete(
                '/admin/api/users/' + $scope.user.userID
            ).success(function () {
                $location.url("/admin/users");
            });
        }
    };
}]);



/** Returns the title of a piece of content */
shnappy.filter('contentTitle', function() {
    return function(content) {
        return content.title || content.text;
    };
});

/** Generates a preview blurb for a piece of content */
shnappy.filter('contentPreview', function() {
    return function(content) {
        if ( content.slug )
            return "/" + content.slug;
        else if ( content.url )
            return content.url;
    };
});

/** Returns only content that has a direct link */
shnappy.filter('linked', function() {
    return function( content ) {
        return (content || []).filter(function (item) {
            return item.navSort;
        });
    };
});

/** Returns only unlinked content */
shnappy.filter('unlinked', function() {
    return function( content ) {
        return (content || []).filter(function (item) {
            return !item.navSort;
        });
    };
});

/** Returns a list of CSS classes to attach to a content link */
shnappy.filter('contentClasses', function() {
    return function(content, scope) {
        var classes = [ content.type ];

        if ( scope.index && scope.index === content.contentID )
            classes.push("index");

        return classes.join(' ');
    };
});

/** Allows for editing a site */
shnappy.controller("ContentCtrl", [
    "$rootScope", "$scope", "$http", "$routeParams", "$location",
    function ($rootScope, $scope, $http, $routeParams, $location) {

    $http.get("/admin/api/sites/" + $routeParams.siteID + "/content")
        .success(function (data) {
            $scope.content = data;
        });

    $http.get("/admin/api/sites/" + $routeParams.siteID + "/index")
        .success(function (data) {
            $scope.index = data.contentID;
        });

    // Shows the edit form for a piece of content
    function edit( contentID ) {
        if ( contentID ) {
            $http.get("/admin/api/content/" + contentID)
                .success(function (data) {
                    $scope.editing = Shnappy.Content.parse( data );
                });
        }
        else {
            $scope.editing = null;
        }
    }

    $scope.edit = function ( item ) {
        $location.search( item.contentID );
        edit( item.contentID );
    };

    // If a contentID was specified in the query, load it up for editing
    edit( Object.keys( $location.search() )[0] );

    $scope.save = function () {
        $http({
            method: 'PATCH',
            url: "/admin/api/content/" + $scope.editing.contentID,
            data: $scope.editing.getJson()
        }).success(function () {
            $(".saved").show().fadeOut(2000);
        });
    };
}]);

/** Displays a form to edit a given page */
shnappy.directive('edit', ['$compile', function ($compile) {
    return {
        restrict: 'E',
        scope: { content: '=' },
        link: function (scope, elem) {
            var tpl = getTemplate( "Content-" + scope.content.getType() );
            var child = scope.$new();
            child.content = scope.content.data;
            elem.replaceWith( $compile(tpl)(child) );
        }
    };
}]);

/** A for rendering the edit a specific component */
shnappy.directive('component', ['$compile', function ($compile) {
    return {
        restrict: 'E',
        scope: { component: '=' },
        link: function (scope, elem) {
            var tpl = getTemplate( "Component-" + scope.component.getType() );
            elem.replaceWith( $compile(tpl)(scope) );
        }
    };
}]);

