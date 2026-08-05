/* ==========================================================================
   Teclatlon — Positive reinforcement and encouragement messages
   Exposes window.App.feedback.success(zone, pan) / .encourage(zone) /
   .celebrate(msg, after) / .successSound(pan).
   Mistakes are never punished; feedback stays brief (<= 2 s).
   Messages follow the active language (App.i18n.pick). Requires i18n.js.

   Audio:
   - Built with Web Audio (no audio files). Fails silently.
   - Optional spatial audio: when state.opciones.espacial is true, each
     tone is panned (StereoPannerNode) by the column of the key that
     triggered it (-1 = left, +1 = right). Off by default so the
     experience stays calm.
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
      if (data && data.opciones && typeof data.opciones[key] === 'boolean') {
        return data.opciones[key];
      }
    } catch (e) { /* ignore */ }
    return fallback;
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

  function tone(frequency, duration, type, pan) {
    var ctx = audioContext();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      var destination = ctx.destination;
      if (typeof pan === 'number' && readOption('espacial', false)) {
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
  function successSound(pan) {
    tone(523.25, 0.15, 'sine', pan);          /* C */
    setTimeout(function () { tone(659.25, 0.2, 'sine', pan); }, 120); /* E */
  }

  function cheerSound() {
    /* Soft and neutral, never harsh */
    tone(392, 0.2, 'sine');
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
    successSound(pan);
    return msg;
  }

  /**
   * Encouragement message after a mistake. Never punitive.
   * @param {Element} [zone]
   * @returns {string} the message used
   */
  function encourage(zone) {
    var msg = randomPick('feedback.encourage');
    if (zone) {
      zone.textContent = msg;
      zone.classList.remove('success');
      zone.classList.add('encourage');
    }
    cheerSound();
    return msg;
  }

  /* Rounds completed in this page session (never in localStorage, never
     pressure — just a kind phrase every 5 rounds). */
  var sessionRounds = 0;

  /**
   * Brief celebration screen (uses .celebration from components.css).
   * Creates the element if it doesn't exist. Hides itself after 2 s.
   * @param {string} message - e.g. 'Well done!'
   * @param {function} [after] - callback when it hides
   */
  function celebrate(message, after) {
    sessionRounds += 1;
    if (sessionRounds % 5 === 0) {
      var rest = window.App.i18n ? window.App.i18n.t('core.rest') : '';
      if (rest) message = message + ' ' + rest;
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
    successSound();

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
    successSound: successSound
  };
})();