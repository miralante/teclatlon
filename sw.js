/* ============================================================
   Teclatlon — Service Worker
   Cache-first strategy for the app shell (works offline).
   When adding new files: add them to ARCHIVOS and bump VERSION.
   ============================================================ */
var VERSION = 'teclatlon-v19';

var ARCHIVOS = [
  './index.html',
  './404.html',
  './manifest.json',
  './app.js',
  './data.js',
  './strings.es.js',
  './strings.en.js',
  './styles.css',
  './legal/index.html',
  './legal/styles.css',
  './legal/strings.es.js',
  './legal/strings.en.js',
  './assets/css/tokens.css',
  './assets/css/base.css',
  './assets/css/components.css',
  './assets/fonts/atkinson-hyperlegible-400.woff2',
  './assets/fonts/atkinson-hyperlegible-700.woff2',
  './assets/fonts/nunito-variable.woff2',
  './assets/js/utils.js',
  './assets/js/i18n.js',
  './assets/js/tts.js',
  './assets/js/storage.js',
  './assets/js/feedback.js',
  './assets/img/icono.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSION).then(function (cache) {
      /* One file at a time, never cache.addAll -- addAll aborts the
         whole batch on the first failure, which leaves the cache empty
         and bricks the app (the catch-all fetch below would then
         serve 0-byte responses for every asset). Put each file
         individually so a single missing/failing asset doesn't take
         the rest down. cache:'reload' skips the HTTP cache so the SW
         always sees the latest server version during install. */
      var fallos = [];
      return Promise.all(ARCHIVOS.map(function (a) {
        return fetch(new Request(a, { cache: 'reload' })).then(function (r) {
          if (r && r.ok) return cache.put(a, r);
          fallos.push(a + ' -> ' + (r ? r.status : 'no-response'));
          return null;
        }).catch(function (err) {
          fallos.push(a + ' -> ' + err);
          return null;
        });
      })).then(function () {
        if (fallos.length) {
          /* Don't crash the install: log and move on. The fetch
             handler below falls back to the network for anything
             missing in the cache. */
          console.warn('[sw] install: ' + fallos.length + ' files failed to cache', fallos);
        }
        return self.skipWaiting();
      });
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(
        claves.filter(function (c) { return c !== VERSION; })
          .map(function (c) { return caches.delete(c); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  /* Network-first, cache fallback. Earlier this SW used pure
     cache-first, which pinned already-installed clients to the first
     version of every asset and made deploys invisible until the user
     cleared site data. Network-first keeps the latest server version
     authoritative whenever the device is online; the cache only kicks
     in when the network is unreachable (offline / CDN outage). */
  event.respondWith(
    fetch(event.request).then(function (r) {
      /* Cache successful same-origin responses (final 200 only --
         Safari rejects a top-level navigation served by the SW that
         carries a Location header, "Response served by service
         worker has redirections"). */
      if (r && r.status === 200) {
        var copia = r.clone();
        caches.open(VERSION).then(function (cache) {
          cache.put(event.request, copia);
        });
      }
      return r;
    }).catch(function () {
      /* Offline / network failure: try the cache, otherwise reply
         with a tiny inline HTML that stays at the current URL. */
      return caches.match(event.request).then(function (deCache) {
        if (deCache) return deCache;
        return new Response(
          '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<title>Sin conexión</title><style>body{font-family:system-ui,sans-serif;' +
          'margin:2rem auto;max-width:32rem;padding:0 1rem;line-height:1.5}' +
          'a{color:#1d4ed8}</style></head><body>' +
          '<h1>Sin conexión</h1>' +
          '<p>No hemos podido cargar esta página. Comprueba tu conexión a ' +
          'Internet y vuelve a intentarlo.</p>' +
          '<p><a href="./index.html">Volver a Teclatlon</a></p>' +
          '</body></html>',
          { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    })
  );
});
