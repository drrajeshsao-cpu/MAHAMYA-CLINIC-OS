const CACHE='mahamaya-clinic-os-v1.2.3-mobile-hard-fix';
const ASSETS=['./','./index.html','./styles.css?v=1.2.3','./app.js?v=1.2.3','./manifest.json','./cloud-sync.js?v=1.2.3','./firebase-config.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
