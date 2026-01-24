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

// ================================
// INSTALL EVENT - Cache core pages
// ================================
self.addEventListener('install', event => {
    console.log('[VTL SW] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[VTL SW] Caching core pages');
            return cache.addAll(CORE_FILES);
        })
    );

    self.skipWaiting();
});

// ================================
// ACTIVATE EVENT - Clean old caches
// ================================
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
        })
    );

    self.clients.claim();
});

// ================================
// MESSAGE EVENT - Force update
// ================================
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ================================
// FETCH EVENT - Smart caching engine
// ================================
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // IMPORTANT: Never cache PDFs (prevents grey-screen bug)
    if (url.pathname.endsWith('.pdf')) {
        event.respondWith(fetch(request));
        return;
    }

    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) {
                return cached;
            }

            return fetch(request).then(response => {

                // Cache only same-origin assets (/assets/)
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
                // Offline fallback
                return caches.match('./index.html');
            });
        })
    );
});
