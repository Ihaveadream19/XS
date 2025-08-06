const CACHE_NAME = 'xalostore-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css', // Falls du eine separate CSS-Datei hast
  '/manifest.json',
  '/source.json' // Wichtig: Diese Datei muss immer neu geladen werden!
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache-Strategie: 'Network-first' für source.json
      if (event.request.url.includes('source.json')) {
        return fetch(event.request)
          .then((networkResponse) => {
            return caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
          })
          .catch(() => {
            return response || caches.match('/');
          });
      }

      // Für alle anderen Anfragen (außer source.json), versuche den Cache zuerst
      if (response) {
        return response;
      }

      return fetch(event.request);
    })
  );
});
