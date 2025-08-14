const cacheName = 'todo-cache-v3';
const filesToCache = [
  '/PuliziaStrade-FI/',
  '/PuliziaStrade-FI/index.html',
  '/PuliziaStrade-FI/manifest.json',
  '/PuliziaStrade-FI/sedan.png',
  '/PuliziaStrade-FI/pulizia_firenze.geojson',
  '/PuliziaStrade-FI/icona.png',
  '/PuliziaStrade-FI/pulsante.js',
  '/PuliziaStrade-FI/stile.css',
  '/PuliziaStrade-FI/codice.js',
  '/PuliziaStrade-FI/preferiti.js',
  '/PuliziaStrade-FI/tema.js'
  
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
