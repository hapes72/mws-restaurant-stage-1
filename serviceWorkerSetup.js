var refreshing;

if ('serviceWorker' in navigator) { /* Ignore unsupported browsers */
    console.log('CLIENT: service worker registration in progress.');
    navigator.serviceWorker.register('ServiceWorker.js').then(function() {
        console.log('CLIENT: service worker registration complete.');

        navigator.serviceWorker.addEventListener('controllerchange', function() {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    }, function() {
        console.log('CLIENT: service worker registration failure.');
    });
} else {
    console.log('CLIENT: service worker is not supported.');
}

