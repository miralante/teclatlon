/* Teclatlon · service worker registration.

   External file for the same reason as locale-picker-config.js: the
   production CSP is `script-src 'self'`, so the inline registration that
   every route used to carry was blocked and the PWA never installed
   (navigator.serviceWorker.controller stayed null in production).

   One file serves every route. The SW URL is resolved from this script's
   own src, so /, /about/, /legal/, /team/, /config/ and /404.html all
   reach the same root sw.js without a per-page relative path. */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  var here = document.currentScript && document.currentScript.src;
  if (!here) return;

  /* Reload once when a NEW worker takes control. Only when a worker already
     controlled this page: the very first install claims the page without a
     reload. */
  var hadController = !!navigator.serviceWorker.controller;
  var reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });

  /* This file lives at /assets/js/register-sw.js, so the SW is two
     levels up at the site root. updateViaCache: 'none' keeps the sw.js
     update check off the HTTP cache. */
  navigator.serviceWorker.register(new URL('../../sw.js', here).href, { updateViaCache: 'none' })
    .then(function (registration) {
      /* Ask for a new sw.js whenever the tab comes back into view. */
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') registration.update().catch(function () {});
      });
    })
    .catch(function () {});
})();
