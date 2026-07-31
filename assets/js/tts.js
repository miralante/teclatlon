/* ==========================================================================
   Teclatlon — Text to speech (Web Speech API)
   Exposes window.App.tts.speak(texto, onEnd) and App.tts.stop()
   Voice and language follow App.i18n.lang() (rate 0.9).
   Requires i18n.js loaded first.
   ========================================================================== */
(function () {
  'use strict';

  window.App = window.App || {};

  var disponible = 'speechSynthesis' in window;
  var voces = [];

  function idiomaActivo() {
    return (window.App.i18n && window.App.i18n.lang()) || 'es-ES';
  }

  function elegirVoz(prefijo) {
    var elegida = null;
    for (var i = 0; i < voces.length; i++) {
      if (voces[i].lang && voces[i].lang.indexOf(prefijo) === 0) {
        elegida = voces[i];
        if (voces[i].lang === idiomaActivo()) break;
      }
    }
    return elegida;
  }

  function cargarVoces() {
    if (!disponible) return;
    voces = window.speechSynthesis.getVoices();
  }

  if (disponible) {
    cargarVoces();
    window.speechSynthesis.onvoiceschanged = cargarVoces;
  }

  /**
   * Reads a text aloud. Cancels any previous reading.
   * @param {string} texto
   * @param {function} [onEnd] - callback on finish (optional)
   */
  function speak(texto, onEnd) {
    if (!disponible || !texto) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    var lang = idiomaActivo();
    var u = new SpeechSynthesisUtterance(texto);
    u.lang = lang;
    u.rate = 0.9;
    u.pitch = 1;
    var voz = elegirVoz(lang.slice(0, 2));
    if (voz) u.voice = voz;
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  }

  /** Stops the current reading. */
  function stop() {
    if (disponible) window.speechSynthesis.cancel();
  }

  window.App.tts = {
    speak: speak,
    stop: stop,
    disponible: disponible
  };
})();
