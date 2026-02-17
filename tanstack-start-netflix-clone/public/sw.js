// Service Worker for offline support
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Files to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
];

// Cache TTL in milliseconds
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const IMAGE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ============================================
// INSTALL: Pre-cache static assets
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// ============================================
// ACTIVATE: Clean up old caches
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old version caches
            return name.startsWith('static-') || 
                   name.startsWith('api-') || 
                   name.startsWith('images-');
          })
          .filter((name) => {
            return name !== STATIC_CACHE && 
                   name !== API_CACHE && 
                   name !== IMAGE_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// ============================================
// FETCH: Intercept all network requests
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (can't cache POST, etc.)
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Route to appropriate caching strategy
  if (isApiRequest(url)) {
    event.respondWith(networkFirstWithCache(request, API_CACHE, API_CACHE_TTL));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstWithNetwork(request, IMAGE_CACHE, IMAGE_CACHE_TTL));
  } else {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

// ============================================
// HELPER: Check request types
// ============================================
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname === 'localhost' && url.port === '3001';
}

function isImageRequest(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/) ||
         url.hostname.includes('tmdb.org') ||
         url.hostname.includes('image.tmdb.org');
}

// ============================================
// STRATEGY: Network First with Cache Fallback
// Best for: API data (want fresh, but show stale if offline)
// ============================================
async function networkFirstWithCache(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone and cache successful responses
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      cache.put(request, cachedResponse);
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cachedResponse;
    }
    
    // No cache, return error response
    return new Response(JSON.stringify({ error: 'Offline and no cached data' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ============================================
// STRATEGY: Cache First with Network Fallback
// Best for: Images (rarely change, save bandwidth)
// ============================================
async function cacheFirstWithNetwork(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is still valid
    const cachedAt = cachedResponse.headers.get('sw-cached-at');
    const isExpired = cachedAt && (Date.now() - parseInt(cachedAt, 10)) > ttl;
    
    if (!isExpired) {
      return cachedResponse;
    }
  }
  
  try {
    // Fetch from network
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache the response
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      cache.put(request, cachedResponse);
    }
    
    return response;
  } catch (error) {
    // Network failed, return expired cache if available
    if (cachedResponse) {
      console.log('[SW] Serving expired cache (offline):', request.url);
      return cachedResponse;
    }
    
    // Return placeholder image for failed image requests
    return new Response('', { status: 404 });
  }
}

// ============================================
// STRATEGY: Stale While Revalidate
// Best for: Static assets (show cached, update in background)
// ============================================
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Start network fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached immediately if available, otherwise wait for network
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // Both failed - return offline page for navigation requests
  if (request.mode === 'navigate') {
    return cache.match('/offline.html');
  }
  
  return new Response('Offline', { status: 503 });
}

// ============================================
// MESSAGE: Clear caches on demand
// ============================================
self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_CACHES') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});
