/**
 * Activate given nav link and deactivate others
 * @param navLink
 */
function activateNavLink(navLink) {
    $('a.nav-link.active').removeClass("active");
    navLink.addClass("active");
}

/**
 * Navigate to the tab represented by the given hash or current hash
 * @param customHash
 */
function goToHashTab(customHash) {
    var hash = customHash || window.location.hash;
    if (hash) {
        var navToActive = $('a.nav-link[href="' + hash + '"]');
        if (navToActive) {
            navToActive.tab('show');
            activateNavLink(navToActive);
        }
    }
}

// Load tab corresponding to hash on startup
goToHashTab();

/**
 * Activate nav link and set hash when nav link clicked
 */
$('.nav a').click(function(event) {
    window.location.hash = event.target.hash;
    activateNavLink($(this));
});

/**
 * Go to tab when tab link within a tab is clicked
 */
$('a.tab-link').click(function(event) {
    if (event.target.hash) {
        goToHashTab(event.target.hash);
    }
});