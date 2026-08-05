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

  /**
   * Returns a stereo pan value (-1..1) for a key column (0 = leftmost).
   * The pan is only used when the user has enabled spatial audio.
   * @param {number} column - 0-based position of the key in its row
   * @param {number} total - total number of columns in the row
   * @returns {number} pan in [-1, 1]
   */
  function panOfColumn(column, total) {
    if (!total || total <= 1) return 0;
    return (column / (total - 1)) * 2 - 1;
  }

  /**
   * Returns the column of a key inside its row, searching across all
   * rows of DATA (letters, number row) and the numpad. Returns null
   * if the key is not found.
   * @param {string} ch
   * @param {boolean} inNumpad
   * @returns {number|null}
   */
  function columnOf(ch, inNumpad) {
    if (!ch) return null;
    var rows = inNumpad ? window.DATA.numpad : window.DATA.rows.concat([window.DATA.numberRow]);
    for (var i = 0; i < rows.length; i++) {
      for (var j = 0; j < rows[i].length; j++) {
        if (rows[i][j].ch === ch) return j;
      }
    }
    return null;
  }

  /* Keep the screen awake while typing (Screen Wake Lock). Progressive
     enhancement: if the browser doesn't support it, nothing happens.
     Requires a user gesture, so it's requested on the first tap/click;
     it's requested again on regaining visibility (the lock is released
     automatically when the tab is hidden). */
  if ('wakeLock' in navigator) {
    var wakeLockSentinel = null;
    var requestWakeLock = function () {
      navigator.wakeLock.request('screen').then(function (sentinel) {
        wakeLockSentinel = sentinel;
      }).catch(function () { /* denied or unavailable: keep going without the lock */ });
    };
    document.addEventListener('pointerdown', function firstTime() {
      requestWakeLock();
      document.removeEventListener('pointerdown', firstTime);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && wakeLockSentinel) {
        requestWakeLock();
      }
    });
  }

  window.App.utils = {
    shuffle: shuffle,
    $: $,
    $$: $$,
    reducedMotion: reducedMotion,
    panOfColumn: panOfColumn,
    columnOf: columnOf
  };
})();
