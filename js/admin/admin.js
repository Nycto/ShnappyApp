
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
}

