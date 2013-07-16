
/** Look for clicks on any login buttons */
$(window.document).on('click', '.login-button', function (e) {
    e.preventDefault();
    navigator.id.request();
});

/** Handle logins via Mozilla Persona */
navigator.id.watch({
    loggedInUser: null,
    onlogin: function(assertion) {
        $.ajax({
            type: 'POST',
            url: '/admin/api/login',
            data: {assertion: assertion},
        }).done(function () {
            window.location.reload();
        }).fail(function () {
            navigator.id.logout();
        });
    },
    onlogout: function() {
        $.ajax({
            type: 'POST',
            url: '/admin/api/logout'
        }).always(function () {
            window.location.reload();
        });
    }
});

