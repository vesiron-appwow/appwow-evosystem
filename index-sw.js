const CACHE_NAME = 'appwow-v1';
const urlsToCache = [
    './',
    './index.html',
    './linxlocal.html',
    './carlinx.html',
    './linxmart.html',
    './homelinx.html',
    './arcadia.html',
    './mylynx.html'
];

self.addEventListener('install', (event) => {
    console.log('[AppWow SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[AppWow SW] Caching app shell');
            return cache.addAll(urlsToCache.map(url => {
                return new Request(url, { cache: 'reload' });
            })).catch((error) => {
                console.log('[AppWow SW] Cache addAll error:', error);
                // Try to cache individual files even if some fail
                return Promise.allSettled(
                    urlsToCache.map(url => cache.add(url).catch(err => {
                        console.log('[AppWow SW] Failed to cache:', url, err);
                    }))
                );
            });
        }).then(() => {
            console.log('[AppWow SW] Installation complete');
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[AppWow SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[AppWow SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[AppWow SW] Activation complete');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                console.log('[AppWow SW] Serving from cache:', event.request.url);
                return cachedResponse;
            }
            
            console.log('[AppWow SW] Fetching from network:', event.request.url);
            return fetch(event.request).then((response) => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }
                
                // Only cache same-origin requests
                if (event.request.url.startsWith(self.location.origin)) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                        console.log('[AppWow SW] Cached new resource:', event.request.url);
                    });
                }
                
                return response;
            });
        }).catch((error) => {
            console.log('[AppWow SW] Fetch failed:', error);
            // Try to return cached index.html as fallback
            return caches.match('./index.html');
        })
    );
});

