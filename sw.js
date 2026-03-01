// ZeitApp Service Worker
// Version hochzählen bei jedem App-Update damit Browser die neue Version lädt
const CACHE_VERSION = 'zeitapp-v1';
const CACHE_FILES = ['./'];

// Installation - Cache befüllen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(CACHE_FILES);
    })
  );
});

// Aktivierung - alten Cache löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Network first, dann Cache als Fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Erfolgreiche Antwort im Cache speichern
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: aus Cache laden
        return caches.match(event.request);
      })
  );
});

// Skip waiting wenn neue Version verfügbar
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
