const CACHE_NAME = 'allstars-v1';

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

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});

// Network first, fall back to cache
self.addEventListener('fetch', function(event) {
  // Don't cache the large Unity build files — always fetch from network
  const url = new URL(event.request.url);
  const isBuildFile = url.pathname.includes('/Build/');

  if (isBuildFile) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        return response;
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});
