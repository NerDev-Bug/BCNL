// Service Worker with Security Best Practices
const CACHE_NAME = 'bcnl-v1';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// URLs to cache on install (static assets only)
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Sensitive endpoints that should NEVER be cached
const SENSITIVE_PATHS = [
  '/api/',
  '/auth/',
  '/admin/',
  '/payment',
  '/checkout',
  '/profile',
];

// Check if URL should be cached
function shouldCache(url) {
  // Don't cache sensitive endpoints
  if (SENSITIVE_PATHS.some(path => url.includes(path))) {
    return false;
  }
  
  // Don't cache external resources (Firebase, APIs, etc.)
  if (url.startsWith('http') && !url.startsWith(self.location.origin)) {
    return false;
  }
  
  // Only cache static assets
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => url.includes(ext)) || url === self.location.origin + '/' || url === self.location.origin + '/index.html';
}

// Install event: cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(urlsToCache.filter(url => shouldCache(url)));
    }).catch((err) => {
      console.error('[SW] Cache install failed:', err);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests (POST, PUT, DELETE should always go to network)
  if (request.method !== 'GET') {
    return;
  }
  
  // Never cache sensitive endpoints
  if (!shouldCache(url.href)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if available and not expired
      if (cachedResponse) {
        const cachedDate = cachedResponse.headers.get('date');
        if (cachedDate) {
          const age = Date.now() - new Date(cachedDate).getTime();
          if (age < CACHE_MAX_AGE) {
            return cachedResponse;
          }
        } else {
          return cachedResponse;
        }
      }

      // Otherwise, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses or non-cacheable content
          if (!response || response.status !== 200 || response.type === 'error' || response.type === 'opaque') {
            return response;
          }

          // Only cache if it's a cacheable resource
          if (shouldCache(url.href)) {
            const responseToCache = response.clone();
            // Add cache date header
            const headers = new Headers(responseToCache.headers);
            headers.set('date', new Date().toUTCString());
            
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers,
              }));
            }).catch((err) => {
              console.error('[SW] Cache put failed:', err);
            });
          }

          return response;
        })
        .catch(() => {
          // Return a fallback response if offline
          console.log('[SW] Offline: request failed for', request.url);
          // Only show offline message for HTML pages
          if (request.headers.get('accept')?.includes('text/html')) {
            return new Response('Offline - resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            });
          }
          // For other resources, return error
          return new Response('', { status: 503 });
        });
    })
  );
});

// Background sync (optional: for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Add your sync logic here
      Promise.resolve()
    );
  }
});
