/* ═══════════════════════════════════════════════
   English Vidya — Service Worker (sw.js)
   Strategy: Cache-First for assets, Network-First for data
   ═══════════════════════════════════════════════ */

const CACHE_NAME = 'english-vidya-v1';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Core shell assets — always cache these
const SHELL_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './data/site/categories-index.json',
  './data/site/search-index.json',
  './data/site/articles-index.json'
];

// ── Install: Pre-cache shell ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching shell assets');
      return cache.addAll(SHELL_ASSETS);
    }).catch(err => console.warn('[SW] Install cache failed:', err))
  );
  self.skipWaiting();
});

// ── Activate: Clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Stale-While-Revalidate ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and external requests
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin.split('//')[1])) {
    return;
  }

  // Data JSON files: Cache-First (they rarely change during a session)
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          if (fresh.ok) cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return cached || new Response('{}', { headers: { 'Content-Type': 'application/json' } });
        }
      })
    );
    return;
  }

  // Shell (HTML, CSS, JS): Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then((fresh) => {
        if (fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      }).catch(() => null);

      return cached || fetchPromise || new Response('Offline', { status: 503 });
    })
  );
});
