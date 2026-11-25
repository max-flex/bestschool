// BestSchool – Service Worker: macht die App offline nutzbar und installierbar.
// App-Dateien: Netzwerk zuerst (immer die neueste Version), ohne Verbindung aus dem Zwischenspeicher.
// Sprachaufnahmen (audio/**/*.mp3): aus dem eigenen Zwischenspeicher zuerst. Ihre Dateinamen sind
// Prüfsummen des Satzes, ändern sich also nie – deshalb bleiben sie auch bei App-Updates erhalten.
// Bei Änderungen an den App-Dateien CACHE_NAME erhöhen.
const CACHE_NAME = 'bestschool-v5';
const AUDIO_CACHE = 'bestschool-audio';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './audio/de/index.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME && n !== AUDIO_CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Sprachaufnahmen: Zwischenspeicher zuerst
  if (/\/audio\/.+\.mp3$/.test(url.pathname)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(cache => cache.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      })))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
