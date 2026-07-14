// Minimal service worker — exists so Chrome/Edge consider the app
// installable. Network-first, falls back to cache when offline.
const CACHE = 'lumabonga-v1';
const SHELL = [
  '/', '/index.html',
  '/lumabonga-data.jsx', '/lumabonga-creative.jsx', '/lumabonga-stock.jsx', '/lumabonga-product.jsx',
  '/manifest.json', '/gawahbonga.png', '/icon-192.png', '/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
