/* ==========================================================================
   Teclatlon — Text to speech (Web Speech API)
   Exposes window.App.tts.speak(text, onEnd) and App.tts.stop()
   Voice and language follow App.i18n.lang() (rate 0.9).
   Requires i18n.js loaded first.
   ========================================================================== */
(function () {
  'use strict';

  window.App = window.App || {};

  var available = 'speechSynthesis' in window;
  var voices = [];

  function activeLanguage() {
    return (window.App.i18n && window.App.i18n.lang()) || 'es-ES';
  }

  function pickVoice(prefix) {
    var picked = null;
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.indexOf(prefix) === 0) {
        picked = voices[i];
        if (voices[i].lang === activeLanguage()) break;
      }
    }
    return picked;
  }

  function loadVoices() {
    if (!available) return;
    voices = window.speechSynthesis.getVoices();
  }

  if (available) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  /**
   * Reads a text aloud. Cancels any previous reading. Strips simple HTML
   * tags (e.g. <mark>, <b>) so the tags themselves are never read aloud.
   * @param {string} text
   * @param {function} [onEnd] - callback on finish (optional)
   */
  function speak(text, onEnd) {
    var plain = String(text || '').replace(/<[^>]+>/g, '');
    if (!available || !plain) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    var lang = activeLanguage();
    var u = new SpeechSynthesisUtterance(plain);
    u.lang = lang;
    u.rate = 0.9;
    u.pitch = 1;
    var voice = pickVoice(lang.slice(0, 2));
    if (voice) u.voice = voice;
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  }

  /** Stops the current reading. */
  function stop() {
    if (available) window.speechSynthesis.cancel();
  }

  window.App.tts = {
    speak: speak,
    stop: stop,
    available: available
  };
})();
