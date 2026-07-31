/* ============================================================
   Teclatlon — Service Worker
   Cache-first strategy for the app shell (works offline).
   When adding new files: add them to ARCHIVOS and bump VERSION.
   ============================================================ */
var VERSION = 'teclatlon-v1';

var ARCHIVOS = [
  './index.html',
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
      /* cache: 'reload' avoids storing stale copies from the browser's HTTP cache */
      var peticiones = ARCHIVOS.map(function (a) {
        return new Request(a, { cache: 'reload' });
      });
      return cache.addAll(peticiones);
    }).then(function () {
      return self.skipWaiting();
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
  event.respondWith(
    caches.match(event.request).then(function (respuesta) {
      if (respuesta) return respuesta;
      return fetch(event.request).then(function (r) {
        /* Also cache new same-origin resources — but never cache a
           redirect. Safari (and the Fetch spec) rejects a top-level
           navigation served by the SW that carries a Location header
           ("Response served by service worker has redirections"), so we
           follow the redirect and cache only the final 200. */
        if (r.status === 200) {
          var copia = r.clone();
          caches.open(VERSION).then(function (cache) {
            cache.put(event.request, copia);
          });
        }
        return r;
      }).catch(function () {
        /* Offline / network failure: reply with a tiny inline HTML that
           stays at the current URL and offers a link to the app. */
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
