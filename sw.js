/* Service worker: instant repeat visits, fresh content after every publish */
const VERSION = 'ps-v1';
const CORE = ['./', 'index.html', 'projects.html', 'project.html', 'assets/css/style.css', 'assets/css/pages.css',
  'assets/js/common.js', 'assets/js/home.js', 'assets/js/projects.js', 'assets/js/project.js', 'data/content.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const put = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; };
const networkFirst = req => fetch(req).then(r => put(req, r)).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }));
const cacheFirst = req => caches.match(req).then(hit => hit || fetch(req).then(r => put(req, r)));
const swr = req => caches.match(req).then(hit => { const net = fetch(req).then(r => put(req, r)).catch(() => hit); return hit || net; });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (/admin/.test(url.pathname) || url.searchParams.has('draft')) return;           // editor: always live
    if (/\/assets\/(img|uploads)\//.test(url.pathname)) return e.respondWith(cacheFirst(req)); // images never change name
    return e.respondWith(networkFirst(req));                                            // pages, code, content
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return e.respondWith(swr(req));
  if (url.hostname === 'i.ytimg.com') return e.respondWith(cacheFirst(req));
});
