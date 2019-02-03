/* This code is based on the blog from Nicolas Bevacqua, https://css-tricks.com/serviceworker-for-offline/
*  Honors to him.
*/
var version = 'V6::';
self.addEventListener("install", function(event) {
    console.log('WORKER: install event in progress.');

    event.waitUntil(
        caches
            .open(version + 'cache')
            .then(function(cache) {
                /* Fill the cache with offline fundamentals. */
                return cache.addAll([
                    'restaurant.html',
                    'js/dbhelper.js',
                    'js/restaurant_info.js',
                    'js/main.js',
                    'css/restaurant-detail.css',
                    'css/common-styles.css'
                ]);
            })
            .then(function() {
                console.log('WORKER: install completed');
            })
            .catch(function(ex){
               console.log('WORKER: install failed');
               console.log(ex);
            })
    );
});

self.addEventListener("fetch", function(event) {
    console.log('WORKER: fetch event in progress.');

    if (event.request.method !== 'GET') {
        /* The request will go to the network as usual. */
        console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
        return;
    }

    event.respondWith(
        caches
            /* 'ignoreSearch' means to ignore the query string in the URL (e.g. the part after *.html */
            .match(event.request, {ignoreSearch: true})
            .then(function(cached) {
                /* Even if the response is in our cache, we go to the network as well.
                 This pattern is known for producing "eventually fresh" responses,
                 where we return cached responses immediately, and meanwhile pull
                 a network response and store that in the cache.
                 Read more:
                 https://ponyfoo.com/articles/progressive-networking-serviceworker
                 */
                var networked = fetch(event.request)
                    // We handle the network request with success and failure scenarios.
                    .then(fetchedFromNetwork)
                    // Catch errors on the fetchedFromNetwork handler as well.
                    .catch(function(error){
                        console.log(error);
                    });

                /* We return the cached response immediately if there is one, and fall
                 back to waiting on the network as usual.
                 */
                console.log('WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);
                return cached || networked;

                function fetchedFromNetwork(response) {
                    /* We copy the response before replying to the network request.
                     This is the response that will be stored on the ServiceWorker cache.
                     */
                    var cacheCopy = response.clone();

                    console.log('WORKER: fetch response from network.', event.request.url);

                    caches
                        // We open a cache to store the response for this request.
                        .open(version + 'cache')
                        .then(function add(cache) {
                            cache.put(event.request, cacheCopy);
                        })
                        .then(function() {
                            console.log('WORKER: fetch response stored in cache.', event.request.url);
                        });

                    // Return the response so that the promise is settled in fulfillment.
                    return response;
                }

            })
    );
});

/**
 * Remove old caches when a new service worker version is installed.
 */
self.addEventListener("activate", function(event) {
    console.log('WORKER: activate event in progress.');

    event.waitUntil(
        caches
            .keys()
            .then(function (keys) {
                // We return a promise that settles when all outdated caches are deleted.
                return Promise.all(
                    keys
                        .filter(function (key) {
                            // Filter by keys that don't start with the latest version prefix.
                            return !key.startsWith(version);
                        })
                        .map(function (key) {
                            return caches.delete(key);
                        })
                );
            })
            .then(function() {
                console.log('WORKER: activate completed.');
            })
    );
});