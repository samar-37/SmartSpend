const CACHE = 'expense-app-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/dashboard.html',
  '/css/style.css',
  '/css/auth.css',
  '/css/charts.css',
  '/js/main.js',
  '/assets/manifest.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request).catch(()=>caches.match('/'))));
});