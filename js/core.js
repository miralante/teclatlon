/* ==========================================================================
   Teclatlon — Core: shared state, progress, layout data and screen switching.
   Part of the classic-script split of app.js (see doc/en/technical.md §2.2).
   Shares state through window.Teclatlon: T.store (S) and module exports (T).
   Cross-module calls go through T.<name> so load order only matters for
   top-level code. Load order is set in index.html.
   ========================================================================== */
(function (T) {
  'use strict';

  // The one shared mutable store. Every module reads and writes these
  // through S, so a reassignment (state = {...}) is seen everywhere.
  var S = T.store = { state: null, game: null, doneThisSession: {}, dictationTimer: null, dictationUnlock: null, lastHand: null };
  var $ = App.utils.$;
  var $$ = App.utils.$$;

  var SLUG = 'keyboard';
  var SCREENS = ['screenName', 'screenMenu', 'screenLessons', 'screenTemplates', 'screenGame', 'screenFree'];
  /* ---------- State and progress ---------- */
  /* One-time migration from the legacy Spanish-keyed shape (nombre,
     estrellas, completado, opciones.{teclado,tema,texto,foco,espacial,
     metricas}) saved by older versions of this app. Mutates `raw` in
     place so the very next save() persists the English-keyed shape and
     the legacy keys disappear from localStorage for good. */
  function migrateLegacyState(raw) {
    if (typeof raw.nombre === 'string' && raw.name === undefined) raw.name = raw.nombre;
    if (raw.estrellas !== undefined && raw.stars === undefined) raw.stars = raw.estrellas;
    if (raw.completado && !raw.completed) raw.completed = raw.completado;
    if (raw.opciones && !raw.options) {
      var o = raw.opciones;
      raw.options = {
        keyboard: o.teclado, color: o.color, theme: o.tema, textSize: o.texto,
        focusMode: o.foco, keySound: o.espacial
      };
    }
    delete raw.nombre; delete raw.estrellas; delete raw.completado; delete raw.opciones;
    return raw;
  }

  S.state = migrateLegacyState(App.storage.get(SLUG));
  S.state.name = typeof S.state.name === 'string' ? S.state.name : '';
  S.state.stars = S.state.stars || 0;
  S.state.completed = S.state.completed || {};
  S.state.options = S.state.options || {};
  if (!DATA.layouts[S.state.options.keyboard]) {
    S.state.options.keyboard = 'normal';
  }
  /* Physical keyboard: 'es' (Spanish, with Ñ) or 'us' (English, with ;).
     Until the person picks one in Settings it follows the browser
     language, so an English browser gets the US keyboard. */
  if (!DATA.physical[S.state.options.layout]) {
    S.state.options.layout = (App.i18n && App.i18n.locale && App.i18n.locale() === 'en') ? 'us' : 'es';
  }
  if (S.state.options.color !== 'fingers') S.state.options.color = 'hands';
  if (['light', 'dark', 'contrast'].indexOf(S.state.options.theme) === -1) S.state.options.theme = 'light';
  if (['small', 'normal', 'large', 'huge'].indexOf(S.state.options.textSize) === -1) S.state.options.textSize = 'normal';
  /* Migrate legacy focusMode → 3 separate options. */
  if (S.state.options.focusMode !== undefined) {
    /* Legacy focusMode enabled → enable all three new options. */
    if (S.state.options.focusMode) {
      S.state.options.hideLegend = true;
      S.state.options.hideNumpad = true;
      S.state.options.dimCelebration = true;
    }
    delete S.state.options.focusMode;
  }
  S.state.options.hideLegend = !!S.state.options.hideLegend;
  S.state.options.hideNumpad = !!S.state.options.hideNumpad;
  S.state.options.dimCelebration = !!S.state.options.dimCelebration;
  S.state.options.keySound = S.state.options.keySound === undefined ? true : !!S.state.options.keySound;
  S.state.options.errorSound = !!S.state.options.errorSound;
  S.state.options.showFingerText = S.state.options.showFingerText === undefined ? true : !!S.state.options.showFingerText;
  /* Rest reminder interval (minutes). The default and the allowed range
     live in feedback.js, the module that owns the notice, so the panel
     and the countdown can't drift apart. Anything unusable (a value from
     an older version, or a hand-edited localStorage) is normalised
     there, and out-of-range numbers are pulled back into the range. */
  S.state.options.restMinutes = App.feedback.normaliseRestMinutes(S.state.options.restMinutes);
  /* Practice clock in the header. Off by default: the clock is an extra
     the person asks for, and until they ask there is nothing on screen. */
  S.state.options.showTimer = !!S.state.options.showTimer;

  /* Activities finished in THIS page load. Only the ⭐ badges and the
     "done" counts read it: a new session starts with a clean board so
     nobody thinks an activity is already finished and skips it. It is
     deliberately not saved. `state.completed` still holds the permanent
     record, because it unlocks the next lesson and awards the star. */
  S.doneThisSession = {};

  function readSuiteSounds() {
    try {
      var saved = JSON.parse(localStorage.getItem('apptonomia:sounds') || 'null');
      return saved && typeof saved === 'object' ? saved : null;
    } catch (e) { return null; }
  }

  var suiteSounds = readSuiteSounds();
  if (suiteSounds) {
    if (typeof suiteSounds.success === 'boolean') S.state.options.keySound = suiteSounds.success;
    if (typeof suiteSounds.error === 'boolean') S.state.options.errorSound = suiteSounds.error;
  }

  function syncSuiteSounds() {
    try {
      localStorage.setItem('apptonomia:sounds', JSON.stringify({
        success: S.state.options.keySound,
        error: S.state.options.errorSound
      }));
    } catch (e) { /* ignore */ }
  }

  function save() { App.storage.set(SLUG, S.state); syncSuiteSounds(); }

  /* Persist the migrated (English-keyed) shape to localStorage right
     away. feedback.js reads localStorage directly and independently
     of this module's in-memory state, so without this, a legacy
     Spanish-keyed save (e.g. opciones.espacial) would still be on
     disk -- and misread as "off" -- for every action before the next
     save() call this session happens to trigger. */
  save();

  /* In-progress game. null outside screenGame.
     type 'seq': { cfg: { mode, title, steps, starKey, onFinish }, idx, pos, waiting }
     type 'challenge': { set: { ch: true } }
     type 'dictation': { letters, letter, waiting, phase } */
  S.game = null;
  S.dictationTimer = null;
  S.dictationUnlock = null;

  function capitalize(name) {
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
  }

  function finalMessage() {
    return S.state.name
      ? App.i18n.t('wellDoneWithName').replace('{name}', capitalize(S.state.name))
      : App.i18n.t('wellDone');
  }

  function updateStars() {
    $('#stars').textContent = '⭐ ' + S.state.stars;
  }

  /* "Ya tienes X estrellas · A por las Y estrellas" (stars-engine.js). It goes
     with the star message when a star is earned, not in the header. */
  function starLine() {
    return window.ApptonomiaStars.line(S.state.stars, {
      reached: App.i18n.t('starsReached'),
      goal: App.i18n.t('starsGoal')
    });
  }

  /* Closing star text for every completed activity, not only when a star
     is new: it always says how many stars there are and what is next, so
     the goal is never missing. A new star gets its own sentence first. */
  function starClosing(earned) {
    var line = starLine();
    return earned ? App.i18n.t('starEarned') + ' ' + line : line;
  }

  /* Returns true when this award earned a star (a lesson or challenge is only starred once). */
  function award(key) {
    S.doneThisSession[key] = true;
    if (!S.state.completed[key]) {
      S.state.completed[key] = true;
      S.state.stars += 1;
      save();
      updateStars();
      return true;
    }
    return false;
  }

  /* ---------- Key data ---------- */
  /* The physical keyboard in use ('es' or 'us', see DATA.physical). */
  function physical() {
    return DATA.physical[S.state.options.layout] || DATA.physical.es;
  }

  /* Number row first, then the letter rows, as the finger map reads them. */
  function physicalRows() {
    var p = physical();
    return [p.numberRow].concat(p.rows);
  }

  function visibleRows() {
    var set = DATA.layoutSets[S.state.options.layout] || DATA.layoutSets.es;
    return set[S.state.options.keyboard] || set.simple;
  }

  function isExtended() {
    return S.state.options.keyboard === 'extended';
  }

  function typeableKeys(rows) {
    var out = {};
    rows.forEach(function (f) {
      /* k.special (Home/End/PageUp/PageDown/Delete, DATA.layouts.extended)
         has a real 'ch' so the special-keys lesson can target it, but it's
         not part of the core alphanumeric layout this challenge covers. */
      f.forEach(function (k) { if (k.ch && !k.special) out[k.ch] = true; });
    });
    return out;
  }

  /* Strips accents/diacritics: á/é/í/ó/ú (and any future NFD-decomposable
     mark) collapse to their plain vowel. Used to resolve accented
     Spanish characters to the physical key that produces them -- there's
     no separate 'é' key, just 'e' composed with the dead accent key,
     the same idea as capitals collapsing onto their base letter via
     Shift (see expectedBaseChar()).
     The tilde (U+0303) is kept on purpose: ñ is its own physical key
     on the Spanish keyboard, next to L, not an accented n. Stripping it
     made the guide light the N key and point at the middle finger for
     a Ñ target, so pressing the real N was marked as an error. */
  function stripAccents(s) {
    if (!s || !s.normalize) return s;
    return s.normalize('NFD')
      .replace(/[̀-ͯ]/g, function (mark) { return mark === '̃' ? mark : ''; })
      .normalize('NFC');
  }

  /* ---------- Screens ---------- */
  function showScreen(id) {
    SCREENS.forEach(function (p) {
      var el = document.getElementById(p);
      if (!el) return;
      el.classList.toggle('hidden', p !== id);
      el.setAttribute('aria-hidden', p !== id ? 'true' : 'false');
    });
  }

  function lessons() { return DATA.lessons[App.i18n.locale()] || DATA.lessons.es; }
  function templates() { return DATA.templates[App.i18n.locale()] || DATA.templates.es; }

  T.SLUG = SLUG;
  T.award = award;
  T.capitalize = capitalize;
  T.finalMessage = finalMessage;
  T.isExtended = isExtended;
  T.lessons = lessons;
  T.physical = physical;
  T.physicalRows = physicalRows;
  T.save = save;
  T.showScreen = showScreen;
  T.starLine = starLine;
  T.starClosing = starClosing;
  T.stripAccents = stripAccents;
  T.templates = templates;
  T.typeableKeys = typeableKeys;
  T.updateStars = updateStars;
  T.visibleRows = visibleRows;
})(window.Teclatlon = window.Teclatlon || {});
