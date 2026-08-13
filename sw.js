const CACHE='mahamaya-clinic-os-v1-7-2-permanent-statements-fix';
const ASSETS=['./','./index.html','./styles.css?v=1.7.2','./app.js?v=1.7.2','./manifest.json','./cloud-sync.js?v=1.7.2','./firebase-config.js','./icons/favicon-64.png','./icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-192.png','./icons/icon-maskable-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
