
const CACHE_NAME = 'pet-consign-v5';
const ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './constants.tsx',
  './types.ts',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
