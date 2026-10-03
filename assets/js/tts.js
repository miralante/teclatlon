/* ==========================================================================
   Teclatlon — Text to speech (Web Speech API)
   Exposes window.App.tts.speak(text, onEnd) / .stop() / .hasVoice().
   Voice and language follow App.i18n.lang() (rate 0.9).
   Requires i18n.js loaded first.

   Two contracts the dictation mode is built on, both learned the hard
   way: this API reports success it does not deliver, and it does not
   promise to call back.

   1. `speak()` ALWAYS calls onEnd, exactly once. An utterance can be
      dropped without any event ever firing (no installed voice, a
      backgrounded tab, the cancel/speak race below), and the dictation
      mode gates the keyboard on that callback — a silent non-callback
      locks the whole activity with nothing on screen to explain it.
      So onEnd also runs on `error` and on a watchdog timer.
   2. `hasVoice()` is the honest question; `available` is not. The API
      can be present with zero installed voices, which is completely
      silent: nothing is read aloud and no event ever says why.
   3. `confirmed()` reports whether a reading has actually STARTED in
      this page session. This is the only evidence the platform ever
      gives that the engine is talking, and it is the only honest
      answer to "is the sound coming out?": a voice list is not proof,
      because a machine can list voices and still read nothing at all
      (muted output, wrong device, a voice that fails silently). No
      caller should assume sound is audible before this is true.
   ========================================================================== */
(function () {
  'use strict';

  window.App = window.App || {};

  var synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
  var voices = [];
  /* Serial number of the current reading. Every new one supersedes the
     last, so a deferred speak() from a superseded call can never reach
     the synth and read a stale letter out loud. */
  var seq = 0;
  var watchdog = null;
  /* Set the first time an utterance reaches `onstart`. False for the
     whole session on a machine that never speaks — which is exactly
     when a caller needs to stop waiting for sound. */
  var spokenOnce = false;

  function activeLanguage() {
    return (window.App.i18n && window.App.i18n.lang()) || 'es-ES';
  }

  function loadVoices() {
    if (!synth) return;
    try { voices = synth.getVoices() || []; } catch (e) { voices = []; }
  }

  if (synth) {
    loadVoices();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', loadVoices);
    else synth.onvoiceschanged = loadVoices;
  }

  /**
   * True only when the platform really has a voice to read with. Safe to
   * call on every reading: an empty list is re-read from the synth.
   * @returns {boolean}
   */
  function hasVoice() {
    if (!synth) return false;
    if (!voices.length) loadVoices();
    return voices.length > 0;
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

  /**
   * True once a reading has actually started in this session. Until
   * then, callers that depend on sound must assume they may be mute.
   * @returns {boolean}
   */
  function confirmed() {
    return spokenOnce;
  }

  function clearWatchdog() {
    if (watchdog) { clearTimeout(watchdog); watchdog = null; }
  }

  /**
   * Reads a text aloud. Cancels any previous reading. Strips simple HTML
   * tags (e.g. <mark>, <b>) so the tags themselves are never read aloud.
   * @param {string} text
   * @param {function} [onEnd] - called exactly once, when the reading
   *   finishes, fails, or the watchdog gives up waiting for it.
   * @param {function} [onStart] - called when the engine actually begins
   *   speaking. The only proof the platform gives that sound is coming
   *   out; also flips confirmed() for the rest of the session.
   * @returns {boolean} true when the utterance was queued to be read
   */
  function speak(text, onEnd, onStart) {
    var plain = String(text || '').replace(/<[^>]+>/g, '');
    var done = onEnd || function () { /* nothing to release */ };
    var mine = ++seq;
    clearWatchdog();
    if (synth) synth.cancel();
    if (!synth || !plain) { done(); return false; }

    var u;
    try {
      u = new SpeechSynthesisUtterance(plain);
      u.lang = activeLanguage();
      u.rate = 0.9;
      u.pitch = 1;
      /* Assigning a voice the utterance will not accept THROWS, and a
         throw here would escape speak() and take the caller's whole
         activity down with it — the letter would never be read and the
         keyboard would stay locked. A named voice is only an
         optimisation: the utterance picks a default for the language on
         its own, so a rejected voice is not a failure. */
      var voice = pickVoice(u.lang.slice(0, 2));
      if (voice) { try { u.voice = voice; } catch (e) { /* default voice */ } }
    } catch (e) {
      done();
      return false;
    }

    var finished = false;
    function end() {
      if (finished) return;
      finished = true;
      clearWatchdog();
      done();
    }
    u.onend = end;
    u.onerror = end;
    u.onstart = function () {
      spokenOnce = true;
      if (onStart) onStart();
    };

    /* Ceiling on how long we wait for a callback the browser may never
       send. Short texts are read in well under the floor; long ones can
       outrun the ~15 s speech timeout in some engines without ever
       firing `end`. */
    watchdog = setTimeout(end, Math.max(2500, plain.length * 300 + 2000));

    /* Chrome drops an utterance queued in the same task as the cancel()
       above, so the reading goes in the next one — and only if no newer
       reading has superseded this one in the meantime. */
    setTimeout(function () {
      if (mine !== seq) return;
      try { synth.speak(u); } catch (e) { end(); }
    }, 0);
    return true;
  }

  /** Stops the current reading. A stopped reading never calls back:
      the caller is the one that asked for the silence. */
  function stop() {
    seq++;
    clearWatchdog();
    if (synth) synth.cancel();
  }

  window.App.tts = {
    speak: speak,
    stop: stop,
    /* "The API exists" — keep for callers that only gate on the API. */
    available: !!synth,
    hasVoice: hasVoice,
    confirmed: confirmed
  };
})();
