/* ==========================================================================
   Teclatlon — Shared utilities
   Exposes window.App.utils
   Load with: <script src="assets/js/utils.js"></script>
   ========================================================================== */
(function () {
  'use strict';

  window.App = window.App || {};

  /**
   * Shuffles a copy of the array (Fisher-Yates).
   * Never use sort(() => Math.random() - 0.5).
   */
  function shuffle(array) {
    var copy = array.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /** Shortcut for querySelector. */
  function $(selector) {
    return document.querySelector(selector);
  }

  /** Shortcut for querySelectorAll (returns an Array). */
  function $$(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  /** true if the user prefers less animation. */
  function reducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* Keep the screen awake while typing (Screen Wake Lock). Progressive
     enhancement: if the browser doesn't support it, nothing happens.
     Requires a user gesture, so it's requested on the first tap/click;
     it's requested again on regaining visibility (the lock is released
     automatically when the tab is hidden). */
  if ('wakeLock' in navigator) {
    var wakeLockSentinel = null;
    var pedirWakeLock = function () {
      navigator.wakeLock.request('screen').then(function (sentinel) {
        wakeLockSentinel = sentinel;
      }).catch(function () { /* denied or unavailable: keep going without the lock */ });
    };
    document.addEventListener('pointerdown', function primeraVez() {
      pedirWakeLock();
      document.removeEventListener('pointerdown', primeraVez);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && wakeLockSentinel) {
        pedirWakeLock();
      }
    });
  }

  window.App.utils = {
    shuffle: shuffle,
    $: $,
    $$: $$,
    reducedMotion: reducedMotion
  };
})();
