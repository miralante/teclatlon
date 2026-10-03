/* ==========================================================================
   Teclatlon — Positive reinforcement and encouragement messages
   Exposes window.App.feedback.success(zone, pan) / .encourage(zone, forceSound) /
   .celebrate(msg, after) / .successSound(pan, force) / .errorSound(force).
   Mistakes are never punished; feedback stays brief (<= 2 s).
   `celebrate` also carries the rest reminder: every N minutes of
   practice (N = state.options.restMinutes, 20 by default) it appends
   the `core.rest` phrase and starts counting again.
   Messages follow the active language (App.i18n.pick). Requires i18n.js.

   Audio:
   - Built with Web Audio (no audio files). Fails silently.
   - Optional key audio: when state.options.keySound is true,
     each tone is panned (StereoPannerNode) by the column of the key
     that triggered it (-1 = left, +1 = right). Off by default so the
     experience stays calm.
   - Optional error audio: when state.options.errorSound is true,
     a short low-pitch tone plays on a wrong key press.
   (Vibration was removed: navigator.vibrate() only works on touch
   devices, and Teclatlon is computer-only — see SPEC.md §2.)
   ========================================================================== */
(function () {
  'use strict';

  window.App = window.App || {};

  function randomPick(key) {
    if (window.App.i18n) return window.App.i18n.pick(key);
    return '';
  }

  function readOption(key, fallback) {
    try {
      var data = window.App.storage && window.App.storage.get('keyboard');
      if (data && data.options && typeof data.options[key] === 'boolean') {
        return data.options[key];
      }
    } catch (e) { /* ignore */ }
    return fallback;
  }

  function readSharedSound(key) {
    try {
      var saved = JSON.parse(localStorage.getItem('miralante:sounds') || 'null');
      if (saved && typeof saved[key] === 'boolean') return saved[key];
    } catch (e) { /* ignore */ }
    return null;
  }

  function soundOption(key, fallback) {
    var shared = readSharedSound(key);
    return shared === null ? readOption(key, fallback) : shared;
  }

  /* Soft sound with Web Audio (no audio files). Fails silently. */
  var audioCtx = null;

  function audioContext() {
    if (audioCtx) return audioCtx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { audioCtx = new AC(); } catch (e) { audioCtx = null; }
    return audioCtx;
  }

  /* Resume audio context if suspended (browser autoplay policy requires
     user gesture before AudioContext can run). */
  function resumeAudio() {
    var ctx = audioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function tone(frequency, duration, type, pan) {
    var ctx = audioContext();
    if (!ctx) return;
    resumeAudio();
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      var destination = ctx.destination;
      if (typeof pan === 'number' && soundOption('keySound', true)) {
        var panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(destination);
      } else {
        osc.connect(gain);
        gain.connect(destination);
      }
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) { /* silent */ }
  }

  /* Two-note "ding" used as the success cue. Exposed so callers that
     want the sound without the on-screen "⭐ Well done!" message
     (e.g. the all-keys challenge, which fires one tone per key and
     mustn't spam the live region) can play it directly. */
  function successSound(pan, force) {
    if (!force && !soundOption('keySound', true)) return;
    tone(523.25, 0.15, 'sine', pan);          /* C */
    setTimeout(function () {
      if (force || soundOption('keySound', true)) tone(659.25, 0.2, 'sine', pan);
    }, 120); /* E */
  }

  /* Short low-pitch tone: distinct from the C-E success ding.
     Plays when a key is wrong and error sound is enabled. */
  function errorSound(force) {
    if (!force && !soundOption('errorSound', false)) return;
    tone(180, 0.12, 'triangle', null);
  }

  function cheerSound() {
    /* Mistakes stay silent: audio is reserved for correctly pressed keys. */
  }

  /**
   * Positive reinforcement in a feedback zone (element with aria-live).
   * @param {Element} [zone] - element to write the message into
   * @param {number} [pan] - spatial pan (-1..1) for the success tone
   * @returns {string} the message used
   */
  function success(zone, pan) {
    var msg = randomPick('feedback.success');
    if (zone) {
      zone.textContent = '⭐ ' + msg;
      zone.classList.remove('encourage');
      zone.classList.add('success');
    }
    return msg;
  }

  /**
   * Encouragement message after a mistake. Never punitive.
   * @param {Element} [zone]
   * @returns {string} the message used
   */
  function encourage(zone, forceSound) {
    var msg = randomPick('feedback.encourage');
    if (zone) {
      zone.textContent = msg;
      zone.classList.remove('success');
      zone.classList.add('encourage');
    }
    errorSound(forceSound);
    return msg;
  }

  /* ---------- Rest reminder (per session, never persisted) ----------
     A kind nudge to take a break after a while of practice — never
     pressure, never a penalty. Two rules shape it:

     1. It counts *practice* time, not wall-clock time. The counter
        only advances while the page is in front of the person and
        they have typed something in the last IDLE_MS, so a tab left
        open in the background (or a long read of the instructions)
        does not silently "earn" a reminder they never needed.
     2. It lives in a module variable, never in localStorage, so a new
        session always starts the counter at zero. When the configured
        number of minutes is reached, the phrase is appended to the
        next celebration and the counter resets — which is what makes
        it come back every N minutes from then on.

     The chosen interval is a user setting (state.options.restMinutes),
     read straight from localStorage the same way the sound options
     above are read; the default and the allowed range are published on
     App.feedback so app.js has a single source of truth. */
  var DEFAULT_REST_MINUTES = 20;
  /* Any whole number of minutes is valid: the panel is a spin box, not
     a menu, so there is no fixed list to pick from — only a range to
     stay inside (1 minute … 4 hours), which the input's min/max and
     its arrows mirror. */
  var REST_MIN = 1;
  var REST_MAX = 240;
  var IDLE_MS = 60 * 1000;   /* no key and no click for 1 min → not practising */
  var TICK_MS = 15 * 1000;   /* how often the counter adds the elapsed time */

  var restElapsed = 0;       /* practice time since load or last reminder */
  var lastTick = Date.now();
  var lastActive = Date.now();

  /* Any key or click means the person is here. Capture phase on
     `document`, so it sees the event before the game handlers
     (which may stop propagation) get it. */
  function noteActivity() { lastActive = Date.now(); }
  document.addEventListener('keydown', noteActivity, true);
  document.addEventListener('pointerdown', noteActivity, true);

  /**
   * The one rule for a rest interval: a whole number of minutes inside
   * the range. Anything else (an empty field, a half-typed value, a
   * number from an older version, a hand-edited localStorage) becomes
   * the default, and out-of-range numbers are pulled back to the
   * nearest end instead of being thrown away. Shared by the countdown
   * below, by app.js when it normalises the saved setting, and by the
   * panel when it commits what was typed.
   * @param {number|string|null|undefined} value
   * @returns {number} minutes, always usable
   */
  function normaliseRestMinutes(value) {
    if (value === null || value === undefined || value === '') {
      return DEFAULT_REST_MINUTES;
    }
    var minutes = Math.round(Number(value));
    if (!isFinite(minutes)) return DEFAULT_REST_MINUTES;
    if (minutes < REST_MIN) return REST_MIN;
    if (minutes > REST_MAX) return REST_MAX;
    return minutes;
  }

  /** Configured reminder interval in minutes, or the default. */
  function restMinutes() {
    try {
      var data = window.App.storage && window.App.storage.get('keyboard');
      if (data && data.options) return normaliseRestMinutes(data.options.restMinutes);
    } catch (e) { /* ignore */ }
    return DEFAULT_REST_MINUTES;
  }

  /* Adds the time elapsed since the previous call, but only while the
     page is visible and the person typed recently. Called by the
     interval *and* before every check, so a round finished 3 minutes
     after the last tick still sees the right total. */
  function tick() {
    var now = Date.now();
    var delta = now - lastTick;
    lastTick = now;
    if (delta <= 0) return;
    if (document.hidden) return;
    if (now - lastActive > IDLE_MS) return;
    restElapsed += delta;
  }
  setInterval(tick, TICK_MS);

  function restDue() {
    tick();
    return restElapsed >= restMinutes() * 60 * 1000;
  }

  /**
   * Brief celebration screen (uses .celebration from components.css).
   * Creates the element if it doesn't exist. Hides itself after 2 s.
   * @param {string} message - e.g. 'Well done!'
   * @param {function} [after] - callback when it hides
   */
  function celebrate(message, after) {
    if (restDue()) {
      var rest = window.App.i18n ? window.App.i18n.t('core.rest') : '';
      if (rest) message = message + ' ' + rest;
      restElapsed = 0; /* the next reminder starts counting from here */
    }
    var layer = document.getElementById('app-celebration');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'app-celebration';
      layer.className = 'celebration hidden';
      layer.setAttribute('role', 'status');
      layer.innerHTML =
        '<div class="emoji">🎉</div>' +
        '<div class="message"></div>';
      document.body.appendChild(layer);
    }
    layer.querySelector('.message').textContent = message;
    layer.classList.remove('hidden');
    var duration = (window.App.utils && window.App.utils.reducedMotion()) ? 1200 : 2000;
    setTimeout(function () {
      layer.classList.add('hidden');
      if (after) after();
    }, duration);
  }

  window.App.feedback = {
    success: success,
    encourage: encourage,
    celebrate: celebrate,
    successSound: successSound,
    errorSound: errorSound,
    /* Rest-reminder contract, read by app.js so the settings panel and
       the notice can never disagree on the default, the range or how an
       out-of-range value is treated. */
    DEFAULT_REST_MINUTES: DEFAULT_REST_MINUTES,
    REST_MIN: REST_MIN,
    REST_MAX: REST_MAX,
    normaliseRestMinutes: normaliseRestMinutes
  };
})();
