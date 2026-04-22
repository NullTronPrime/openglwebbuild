// FIX: Bumped cache name from 'allstars-v1' to 'allstars-v2'.
// When the game crashes and the user reloads, the old SW would serve
// the cached index.html rather than fetching a fresh copy.
// Changing the name forces all stale caches to be deleted on activation,
// so every reload after a crash always gets the latest shell files.
const CACHE_NAME = 'allstars-v2';

// Cache the shell files on install
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './TemplateData/style.css',
        './TemplateData/favicon.ico',
      ]);
    })
  );
});

// FIX: On activation, delete ALL old caches whose name doesn't match
// the current CACHE_NAME. This ensures crash-reloads never serve
// a stale index.html that could contain the old productVersion "3.0.1"
// or other outdated config values.
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return clients.claim();
    })
  );
});

// Network first, fall back to cache
self.addEventListener('fetch', function(event) {
  // Don't cache the large Unity build files — always fetch from network.
  // Also never cache the main data file hosted on GitHub (different origin anyway).
  const url = new URL(event.request.url);
  const isBuildFile = url.pathname.includes('/Build/');

  if (isBuildFile) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // FIX: Only cache GET requests — the Cache API throws a TypeError if you
        // try to cache POST/PUT/DELETE requests ("Request method 'POST' is unsupported").
        // This was causing uncaught promise rejections on every non-GET fetch.
        if (event.request.method === 'GET' && response.ok && response.type !== 'opaque') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});