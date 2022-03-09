const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/index.js",
  "/style.css",
  "/indexDB.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

const PRECACHE = "static-cache-v2";
const RUNTIME = "data-cache-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheNames) => {
          if (cacheNames !== PRECACHE && cacheNames !== RUNTIME) {
            return caches.delete(cacheNames);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.startsWith("/api/")) {
    event.respondWith(
      caches
        .open(RUNTIME)
        .then((cachedResponse) => {
          return fetch(event.request)
            .then((response) => {
              if (response.status === 200) {
                cachedResponse.put(event.request.url, response.clone());
              }
              return response;
            })
            .catch((error) => {
              return cachedResponse.match(event.request);
            });
        })
        .catch((error) => console.log(error))
    );
    return;
  }

  event.respondWith(
    caches.open(PRECACHE).then((cacheNames) => {
      return cacheNames.match(event.request).then((response) => {
        return response || fetch(event.request);
      });
    })
  );
});
