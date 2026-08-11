const CACHE='mahamaya-clinic-os-v1.2.2-cloud-path-mobile-fix';
const ASSETS=['./','./index.html','./styles.css?v=1.2.2','./app.js?v=1.2.2','./manifest.json','./cloud-sync.js?v=1.2.2','./firebase-config.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
