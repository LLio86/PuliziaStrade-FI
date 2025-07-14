const cacheName = 'todo-cache-v1';
const filesToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/sedan.png',
  '/pulizia_firenze.geojson',
  '/icona.png',
  '/pulsante.js',
  '/stile.css',
  '/codice.js',
  '/tema.js'
  
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
