const CACHE_NAME = 'appwow-v1';

self.addEventListener('install', (event) => {
    console.log('[AppWow SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[AppWow SW] Caching files');
            return cache.addAll([
                './',
                './index.html'
            ]);
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
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                        console.log('[AppWow SW] Cached new resource:', event.request.url);
                    });
                }
                return response;
            });
        }).catch((error) => {
            console.log('[AppWow SW] Fetch failed, trying cache:', error);
            return caches.match('./index.html');
        })
    );
});

