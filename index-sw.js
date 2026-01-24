// ================================
// VTL UNIVERSAL SERVICE WORKER
// AppWow + Linx Asset Engine
// ================================

const CACHE_NAME = 'vtl-evosystem-v1';

// Core App Shell (HTML pages only)
const CORE_FILES = [
    './',
    './index.html',
    './carlinx.html',
    './linxlocal.html',
    './linxmart.html',
    './homelinx.html',
    './arcadia.html',
    './mylynx.html'
];

// Install Event - Pre-cache core pages
self.addEventListener('install', event => {
    console.log('[VTL SW] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[VTL SW] Caching core pages');
            return cache.addAll(CORE_FILES);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', event => {
    console.log('[VTL SW] Activating...');
    
    event.waitUntil(
        caches.keys().then(names => {
            return Promise.all(
                names.map(name => {
                    if (name !== CACHE_NAME) {
                        console.log('[VTL SW] Removing old cache:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Universal Asset Caching
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Strategy:
    // 1) Serve from cache if available
    // 2) Fetch from network
    // 3) Auto-cache anything under /assets/

    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) {
                return cached;
            }

            return fetch(request).then(response => {
                // Only cache successful responses from same origin
                if (
                    response.status === 200 &&
                    url.origin === self.location.origin &&
                    url.pathname.startsWith('/assets/')
                ) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, clone);
                        console.log('[VTL SW] Cached asset:', url.pathname);
                    });
                }

                return response;
            }).catch(() => {
                // Optional fallback: return homepage if offline
                return caches.match('./index.html');
            });
        })
    );
});
