
const CACHE_NAME = 'ashus-v1';
const DYNAMIC_CACHE = 'ashus-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Noto+Kufi+Arabic:wght@400;600;800&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Handle Navigation (HTML) - Network First, fallback to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 2. Handle Images & Models - Stale While Revalidate
  // This ensures 3D models load fast from cache if visited before
  if (
    event.request.destination === 'image' || 
    event.request.url.includes('.gltf') ||
    event.request.url.includes('.glb')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Default - Network First, Fallback to Cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
