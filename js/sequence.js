/* ==========================================================================
   Teclatlon — Sequence engine: runs a list of steps (placement, lessons, words, numbers, templates).
   Part of the classic-script split of app.js (see doc/en/technical.md §2.2).
   Shares state through window.Teclatlon: T.store (S) and module exports (T).
   Cross-module calls go through T.<name> so load order only matters for
   top-level code. Load order is set in index.html.
   ========================================================================== */
(function (T) {
  'use strict';
  var S = T.store;
  var $ = App.utils.$;
  var $$ = App.utils.$$;

  /* ---------- Live metrics (accuracy and speed) ---------- */
  /* Prepared, but no UI yet. Kept on purpose for the future live-metrics
     feature (accuracy % and keys per minute):
       - S.state.metrics is filled in every game (startMetrics, gameKey,
         dictation.js, challenge.js) even though nothing shows it yet.
       - updateLiveMetrics() paints into #liveMetrics, which does not exist
         in index.html today, and nothing calls it. To activate it, call it
         from startSequence and gameKey.
       - Still missing: the #liveMetrics element, a #btnMetrics button in
         the settings drawer (state.options.metrics already exists, default
         false), and the .live-metrics-pills / .live-metric styles.
       - The accuracyShort and keysPerMinuteShort strings already exist in
         strings.es.js and strings.en.js.
     The tests debug.spec.js and scripts/ui-smoke.js expect those elements
     and will fail until the UI is implemented. */
  function startMetrics() {
    S.state.metrics = { keys: 0, hits: 0, misses: 0, startMs: Date.now() };
  }

  function updateLiveMetrics() {
    var zone = $('#liveMetrics');
    if (!zone) return;
    if (!S.state.options.metrics || !S.game || !S.state.metrics) {
      zone.classList.add('hidden');
      return;
    }
    zone.classList.remove('hidden');
    var m = S.state.metrics;
    var accuracy = m.keys ? Math.round((m.hits / m.keys) * 100) : 100;
    var minutes = Math.max((Date.now() - m.startMs) / 60000, 1 / 60);
    var kpm = Math.round(m.keys / minutes);
    zone.innerHTML = '';
    var pills = document.createElement('div');
    pills.className = 'live-metrics-pills';
    var accPill = document.createElement('span');
    accPill.className = 'live-metric';
    accPill.textContent = App.i18n.t('accuracyShort').replace('{n}', accuracy);
    pills.appendChild(accPill);
    var spdPill = document.createElement('span');
    spdPill.className = 'live-metric';
    spdPill.textContent = App.i18n.t('keysPerMinuteShort').replace('{n}', kpm);
    pills.appendChild(spdPill);
    zone.appendChild(pills);
  }

  /* ---------- Sequence engine ---------- */
  /* The target/challenge card and the dictation panel are mutually
     exclusive: the card is the thing to look at in every mode except
     dictation, which puts its own panel in that same place. Every mode
     that opens the game screen comes through here, so neither one can
     be left behind by whichever mode ran before it. */
  function showGameCard() {
    $('#gameCard').classList.remove('hidden');
    T.dictationPanel(false);
  }

  function startSequence(cfg) {
    S.game = { type: 'seq', cfg: cfg, idx: 0, pos: 0, waiting: false };
    $('#gameTitle').textContent = cfg.title;
    var inNumpad = cfg.mode === 'numbers';
    showGameCard();
    $('#keyboardPanel').classList.toggle('hidden', inNumpad);
    $('#numpadPanel').classList.toggle('hidden', !inNumpad);
    $('#targetZone').classList.remove('hidden');
    $('#challengeZone').classList.add('hidden');
    $('#guide').classList.remove('hidden');
    clearFeedback();
    startMetrics();
    T.showScreen('screenGame');
    loadStep();
  }

  function currentStep() { return S.game.cfg.steps[S.game.idx]; }

  /* A step is either a typed sequence ({ seq: 'hola' }, matched
     character by character) or a single special key ({ specialKey:
     'home' }, matched in one shot against the raw KeyboardEvent.key --
     see DATA.lessons "Special keys" and normalizeKey()). Special-key
     steps have no printable character and no fixed finger (the
     convention varies too much by keyboard), so they skip the
     finger-guide highlighting entirely. */
  function isSpecialStep(p) { return !!p && typeof p.specialKey === 'string'; }

  function expectedChar() {
    var p = currentStep();
    return (p && !isSpecialStep(p)) ? p.seq[S.game.pos] : null;
  }

  function loadStep() {
    S.game.pos = 0;
    $('#gameInstruction').textContent = currentStep().text || '';
    renderTarget();
    updateGuide();
  }

  function renderTarget() {
    var p = currentStep();
    var zone = $('#targetZone');
    zone.innerHTML = '';
    /* "Real texts" (template) lines are full sentences, unlike the
       single letter/word targets of the other modes -- wrapping
       letter-by-letter breaks words mid-way across the line. Grouping
       each word's letters in a nested flex span keeps a word together
       as one wrap unit while spaces stay valid wrap points; the
       smaller '--compact' box size (styles.css) fits more of a
       sentence per line before that wrap is even needed. */
    var compact = S.game.cfg.mode === 'template';
    zone.classList.toggle('target-zone--compact', compact);
    if (isSpecialStep(p)) {
      var label = App.i18n.t('keyLabel.' + p.specialKey);
      zone.setAttribute('aria-label', App.i18n.t('pressKeyAria').replace('{key}', label));
      var pill = document.createElement('span');
      pill.className = 'letter current wide';
      pill.textContent = label;
      zone.appendChild(pill);
      return;
    }
    var seq = p.seq;
    zone.setAttribute('aria-label', App.i18n.t('typeAria').replace('{seq}', seq));
    var target = zone;
    for (var i = 0; i < seq.length; i++) {
      var ch = seq[i];
      if (ch === ' ') {
        target = zone;
      } else if (compact && (i === 0 || seq[i - 1] === ' ')) {
        target = document.createElement('span');
        target.className = 'word';
        zone.appendChild(target);
      }
      var s = document.createElement('span');
      s.className = 'letter' + (i < S.game.pos ? ' done' : (i === S.game.pos ? ' current' : ''));
      s.textContent = ch === ' ' ? '␣' : ch;
      target.appendChild(s);
    }
  }

  /* expectedChar() keeps its original case and accent ('A' for a
     required capital, 'é' for an accented vowel) so renderTarget() can
     display it as typed. Everything that looks up a physical key
     (finger tables, data-ch on the on-screen keyboard) needs the base
     lowercase, unaccented letter instead -- there's no separate 'A'
     key (just 'a' held with Shift) and no separate 'é' key either
     (just 'e' composed with the dead accent key), so both collapse
     onto the same physical target as their base letter. */
  function expectedBaseChar() {
    var ch = expectedChar();
    return ch ? T.stripAccents(ch.toLowerCase()) : null;
  }

  function expectedShift() {
    var ch = expectedChar();
    return !!ch && ch !== ch.toLowerCase();
  }

  function updateGuide() {
    if (isSpecialStep(currentStep())) {
      T.markTarget(currentStep().specialKey);
      T.renderHands(null, null);
      return;
    }
    var base = expectedBaseChar();
    var finger = T.fingerOf(base, S.game.cfg.mode === 'numbers');
    T.markTarget(base);
    T.renderHands(finger, expectedShift() ? T.oppositeShiftSide(finger) : null);
  }

  function clearFeedback() {
    var f = $('#feedback');
    f.textContent = '';
    f.className = 'feedback';
    /* A layout change made during a round stays on screen until the round
       ends, so it survives the clear between steps. */
    if (S.game && S.game.layoutNotice) f.textContent = App.i18n.t('keyboardLayoutNextRound');
  }

  function gameKey(ch, shiftHeld) {
    if (S.game.waiting) return;
    var p = currentStep();
    S.state.metrics.keys += 1;

    if (isSpecialStep(p)) {
      /* Single-action step: no character sequence to walk through,
         it's done as soon as the right key is detected. */
      if (ch === p.specialKey) {
        S.state.metrics.hits += 1;
        App.feedback.successSound(T.panOf(ch));
        stepCompleted(ch);
      } else {
        S.state.metrics.misses += 1;
        App.feedback.encourage($('#feedback'));
      }
      return;
    }

    var seq = p.seq;
    var expected = seq[S.game.pos];
    var needsShift = expected !== expected.toLowerCase();
    /* Lowercase steps don't check the Shift state at all -- an
       accidentally-held Shift key while typing a lowercase letter
       still counts as correct, matching the app's general policy of
       not penalising things the exercise didn't ask about. */
    if (ch === expected.toLowerCase() && (!needsShift || shiftHeld)) {
      S.state.metrics.hits += 1;
      App.feedback.successSound(T.panOf(ch));
      S.game.pos += 1;
      renderTarget();
      if (S.game.pos >= seq.length) stepCompleted(ch);
      else updateGuide();
    } else {
      S.state.metrics.misses += 1;
      T.keysOf(ch).forEach(function (t) {
        t.classList.add('miss');
        setTimeout(function () { t.classList.remove('miss'); }, 500);
      });
      App.feedback.encourage($('#feedback'));
    }
  }

  function stepCompleted(lastCh) {
    S.game.waiting = true;
    T.markTarget(null);
    /* The success tone for the last key of the step is panned to that
       key's column (spatial-sound option). Earlier keystrokes inside
       the same step are silent in feedback.js; only the step-complete
       "ding" is panned. */
    App.feedback.success($('#feedback'), T.panOf(lastCh));
    setTimeout(function () {
      if (!S.game) return;
      S.game.waiting = false;
      S.game.idx += 1;
      if (S.game.idx >= S.game.cfg.steps.length) {
        endSequence();
      } else {
        clearFeedback();
        loadStep();
      }
    }, 500);
  }

  function endSequence() {
    var cfg = S.game.cfg;
    S.game = null;
    var m = S.state.metrics;
    var earned = T.award(cfg.starKey);
    var acc = m && m.keys ? Math.round((m.hits / m.keys) * 100) : 0;
    App.achievements.onActivityFinished({ state: S.state, lessons: T.lessons().map(function (l) { return l.id; }), perfect: acc === 100 });
    /* Return to the mode list immediately so completion never leaves the
       learner stranded behind a browser-dependent celebration timer. The
       celebration remains visible on the destination screen. */
    if (cfg.onFinish) cfg.onFinish();
    App.feedback.celebrate(T.finalMessage() + ' ' + App.i18n.t('transferMessage') + ' ' + T.starClosing(earned));
  }

  T.clearFeedback = clearFeedback;
  T.gameKey = gameKey;
  T.isSpecialStep = isSpecialStep;
  T.showGameCard = showGameCard;
  T.startMetrics = startMetrics;
  T.startSequence = startSequence;
  T.updateGuide = updateGuide;
})(window.Teclatlon);
