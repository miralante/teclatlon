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
  /* This file lives at /assets/js/register-sw.js, so the SW is two
     levels up at the site root. */
  navigator.serviceWorker.register(new URL('../../sw.js', here).href).catch(function () {});
})();
