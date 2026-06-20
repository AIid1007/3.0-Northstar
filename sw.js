/* sw.js — offline cache for the static shell + assets */
const CACHE = 'northstar-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './storage.js',
  './nudges.js',
  './gamification.js',
  './quiz.js',
  './api.js',
  './timer.js',
  './views.js',
  './app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.host === 'api.anthropic.com') return;
  if (e.request.method !== 'GET') return;

  if (url.host.includes('gstatic.com') || url.host.includes('googleapis.com')) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          return res;
        }).catch(() => cached)
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        if (res && res.status === 200 && (url.origin === location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
