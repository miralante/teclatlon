/* ==========================================================================
   Teclatlon — Positive reinforcement and encouragement messages
   Exposes window.App.feedback.success(zona, pan) / .encourage(zona) /
   .celebrate(msg, after) / .sonidoAcierto(pan).
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

  function alAzar(clave) {
    if (window.App.i18n) return window.App.i18n.pick(clave);
    return '';
  }

  function leerOpcion(clave, defecto) {
    try {
      var datos = window.App.storage && window.App.storage.get('keyboard');
      if (datos && datos.opciones && typeof datos.opciones[clave] === 'boolean') {
        return datos.opciones[clave];
      }
    } catch (e) { /* ignore */ }
    return defecto;
  }

  /* Soft sound with Web Audio (no audio files). Fails silently. */
  var audioCtx = null;

  function contexto() {
    if (audioCtx) return audioCtx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { audioCtx = new AC(); } catch (e) { audioCtx = null; }
    return audioCtx;
  }

  function tono(frecuencia, duracion, tipo, pan) {
    var ctx = contexto();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = tipo || 'sine';
      osc.frequency.value = frecuencia;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracion);
      var destino = ctx.destination;
      if (typeof pan === 'number' && leerOpcion('espacial', false)) {
        var panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(destino);
      } else {
        osc.connect(gain);
        gain.connect(destino);
      }
      osc.start();
      osc.stop(ctx.currentTime + duracion);
    } catch (e) { /* silent */ }
  }

  /* Two-note "ding" used as the success cue. Exposed so callers that
     want the sound without the on-screen "⭐ ¡Muy bien!" message
     (e.g. the all-keys challenge, which fires one tone per key and
     mustn't spam the live region) can play it directly. */
  function sonidoAcierto(pan) {
    tono(523.25, 0.15, 'sine', pan);          /* C */
    setTimeout(function () { tono(659.25, 0.2, 'sine', pan); }, 120); /* E */
  }

  function sonidoAnimo() {
    /* Soft and neutral, never harsh */
    tono(392, 0.2, 'sine');
  }

  /**
   * Positive reinforcement in a feedback zone (element with aria-live).
   * @param {Element} [zona] - element to write the message into
   * @param {number} [pan] - spatial pan (-1..1) for the success tone
   * @returns {string} the message used
   */
  function success(zona, pan) {
    var msg = alAzar('feedback.success');
    if (zona) {
      zona.textContent = '⭐ ' + msg;
      zona.classList.remove('encourage');
      zona.classList.add('success');
    }
    sonidoAcierto(pan);
    return msg;
  }

  /**
   * Encouragement message after a mistake. Never punitive.
   * @param {Element} [zona]
   * @returns {string} the message used
   */
  function encourage(zona) {
    var msg = alAzar('feedback.encourage');
    if (zona) {
      zona.textContent = msg;
      zona.classList.remove('success');
      zona.classList.add('encourage');
    }
    sonidoAnimo();
    return msg;
  }

  /* Rounds completed in this page session (never in localStorage, never
     pressure — just a kind phrase every 5 rounds). */
  var rondasSesion = 0;

  /**
   * Brief celebration screen (uses .celebration from components.css).
   * Creates the element if it doesn't exist. Hides itself after 2 s.
   * @param {string} mensaje - e.g. 'Well done!'
   * @param {function} [despues] - callback when it hides
   */
  function celebrate(mensaje, despues) {
    rondasSesion += 1;
    if (rondasSesion % 5 === 0) {
      var rest = window.App.i18n ? window.App.i18n.t('core.rest') : '';
      if (rest) mensaje = mensaje + ' ' + rest;
    }
    var capa = document.getElementById('app-celebration');
    if (!capa) {
      capa = document.createElement('div');
      capa.id = 'app-celebration';
      capa.className = 'celebration hidden';
      capa.setAttribute('role', 'status');
      capa.innerHTML =
        '<div class="emoji">🎉</div>' +
        '<div class="mensaje"></div>';
      document.body.appendChild(capa);
    }
    capa.querySelector('.mensaje').textContent = mensaje;
    capa.classList.remove('hidden');
    sonidoAcierto();

    var duracion = (window.App.utils && window.App.utils.reducedMotion()) ? 1200 : 2000;
    setTimeout(function () {
      capa.classList.add('hidden');
      if (despues) despues();
    }, duracion);
  }

  window.App.feedback = {
    success: success,
    encourage: encourage,
    celebrate: celebrate,
    sonidoAcierto: sonidoAcierto
  };
})();