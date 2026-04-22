const CACHE_NAME = 'allstars-v4';

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

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  if (url.pathname.includes('/Build/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  const balancingMatch = url.pathname.match(/(.*SerializedBalancingDataContainer_[\d.]+)\.0(\.bytes)$/);
  if (balancingMatch) {
    const rewritten = new URL(url.href);
    rewritten.pathname = balancingMatch[1] + balancingMatch[2];
    event.respondWith(fetch(rewritten.href));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (event.request.method === 'GET' && response.ok && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});