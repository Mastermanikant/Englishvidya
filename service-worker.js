/* ═══════════════════════════════════════════════════════════════
   English Vidya — Production Service Worker v2
   Strategy  : Cache-First for shell + data, SWR for lesson files
   Offline   : Full offline support with graceful fallback
   Versioning: Update CACHE_VERSION to bust old caches on deploy
   ═══════════════════════════════════════════════════════════════ */

const CACHE_VERSION   = 'ev-v2';
const SHELL_CACHE     = `${CACHE_VERSION}-shell`;
const DATA_CACHE      = `${CACHE_VERSION}-data`;
const LESSON_CACHE    = `${CACHE_VERSION}-lessons`;
const ALL_CACHES      = [SHELL_CACHE, DATA_CACHE, LESSON_CACHE];

// ── Core shell — always pre-cached on install ──────────────────
const SHELL_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './data/site/categories-index.json',
  './data/site/search-index.json',
  './data/site/articles-index.json',
  './offline.html'
];

// ── Offline fallback page (created below) ─────────────────────
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="hi" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Offline — English Vidya</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:#0c1222;color:#e2e8f0;
         display:flex;align-items:center;justify-content:center;
         min-height:100vh;text-align:center;padding:2rem}
    .logo{font-size:3rem;margin-bottom:1rem}
    h1{font-size:1.5rem;font-weight:700;color:#818cf8;margin-bottom:.75rem}
    p{color:#94a3b8;line-height:1.6;margin-bottom:1.5rem;font-size:.95rem}
    .btn{display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);
         color:#fff;padding:.75rem 2rem;border-radius:2rem;text-decoration:none;
         font-weight:600;font-size:.95rem;cursor:pointer;border:none}
    .badge{display:inline-block;background:#1e293b;color:#64748b;
           padding:.3rem .8rem;border-radius:1rem;font-size:.8rem;margin-top:1rem}
  </style>
</head>
<body>
  <div>
    <div class="logo">📵</div>
    <h1>Internet नहीं है</h1>
    <p>
      आप offline हैं। Internet connection check करें।<br>
      जो pages पहले खुले थे वो cache से खुल सकते हैं।
    </p>
    <button class="btn" onclick="location.reload()">🔄 फिर से कोशिश करें</button>
    <br>
    <span class="badge">English Vidya — Offline Mode</span>
  </div>
</body>
</html>`;

// ═══════════════════════════════════════════════════════════════
//  INSTALL — Pre-cache shell assets
// ═══════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);

      // Store offline fallback page in cache storage
      await shell.put(
        new Request('./offline.html'),
        new Response(OFFLINE_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      );

      // Pre-cache all shell assets (ignoring individual failures)
      const results = await Promise.allSettled(
        SHELL_ASSETS.map(url => shell.add(url).catch(e => console.warn('[SW] Shell miss:', url, e.message)))
      );
      const ok = results.filter(r => r.status === 'fulfilled').length;
      console.log(`[SW] Install: ${ok}/${SHELL_ASSETS.length} shell assets cached.`);
    })()
  );
  self.skipWaiting(); // Activate immediately
});

// ═══════════════════════════════════════════════════════════════
//  ACTIVATE — Delete old caches
// ═══════════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const stale = keys.filter(k => !ALL_CACHES.includes(k));
      await Promise.all(stale.map(k => {
        console.log('[SW] Purging old cache:', k);
        return caches.delete(k);
      }));
      await self.clients.claim();
      console.log('[SW] Activated. Cache version:', CACHE_VERSION);
    })()
  );
});

// ═══════════════════════════════════════════════════════════════
//  FETCH — Smart routing strategy
// ═══════════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const req  = event.request;
  const url  = new URL(req.url);

  // Only handle GET requests from our own origin
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // ── Strategy A: Grammar Lessons (Network-First, 5s timeout) ──
  // Lessons update rarely but may get refreshed — try network first
  if (path.includes('/data/grammar/lessons/') || path.includes('/data/grammar/')) {
    event.respondWith(networkFirstWithCache(req, LESSON_CACHE, 5000));
    return;
  }

  // ── Strategy B: Vocabulary & Site Index (Cache-First) ─────────
  // These are large static files — serve from cache instantly
  if (path.includes('/data/vocabulary/') || path.includes('/data/site/')) {
    event.respondWith(cacheFirstWithNetwork(req, DATA_CACHE));
    return;
  }

  // ── Strategy C: App Shell (Stale-While-Revalidate) ───────────
  // HTML/CSS/JS — serve cached immediately, update in background
  if (path.endsWith('.html') || path.endsWith('.css') || path.endsWith('.js') ||
      path === '/' || path === '') {
    event.respondWith(staleWhileRevalidate(req, SHELL_CACHE));
    return;
  }

  // ── Strategy D: Everything else (Network with cache fallback) ─
  event.respondWith(networkWithCacheFallback(req, SHELL_CACHE));
});

// ═══════════════════════════════════════════════════════════════
//  STRATEGY IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════

/** Cache-First: Serve from cache; fetch + store if missing */
async function cacheFirstWithNetwork(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/** Network-First: Try network with timeout; fallback to cache */
async function networkFirstWithCache(request, cacheName, timeoutMs = 5000) {
  const cache = await caches.open(cacheName);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const fresh = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);

    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response(JSON.stringify({ error: 'offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/** Stale-While-Revalidate: Serve cache immediately; update in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch in background (don't await — fire and forget)
  const fetchPromise = fetch(request).then(fresh => {
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  }).catch(() => null);

  // Return cached immediately if available, otherwise wait for network
  if (cached) return cached;

  const fresh = await fetchPromise;
  if (fresh) return fresh;

  // Last resort: offline fallback
  const offline = await cache.match('./offline.html') ||
                  await caches.match('./offline.html');
  return offline || new Response('Offline', { status: 503 });
}

/** Network with cache fallback — for miscellaneous assets */
async function networkWithCacheFallback(request, cacheName) {
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    const cache  = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    // If it's a navigation (HTML page request), serve offline fallback
    if (request.mode === 'navigate') {
      const offline = await caches.match('./offline.html');
      if (offline) return offline;
    }
    return new Response('Resource not available offline', { status: 503 });
  }
}

// ═══════════════════════════════════════════════════════════════
//  BACKGROUND SYNC — Lesson pre-fetch on idle
// ═══════════════════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Pre-cache a list of lesson URLs sent by the main app
  if (event.data.type === 'PRECACHE_LESSONS') {
    const urls = event.data.urls || [];
    caches.open(LESSON_CACHE).then(cache => {
      Promise.allSettled(urls.map(url => cache.add(url)))
        .then(results => {
          const ok = results.filter(r => r.status === 'fulfilled').length;
          console.log(`[SW] Pre-cached ${ok}/${urls.length} lessons.`);
          // Notify all clients
          self.clients.matchAll().then(clients =>
            clients.forEach(c => c.postMessage({
              type: 'PRECACHE_DONE',
              count: ok,
              total: urls.length
            }))
          );
        });
    });
  }

  // Force cache refresh on demand
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => {
      console.log('[SW] All caches cleared.');
      event.source && event.source.postMessage({ type: 'CACHE_CLEARED' });
    });
  }

  // Skip waiting (for update prompt flow)
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
