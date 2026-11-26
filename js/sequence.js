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
       - S.metrics is filled in every game (startMetrics, gameKey,
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
    S.metrics = { keys: 0, hits: 0, misses: 0, startMs: Date.now() };
  }

  function updateLiveMetrics() {
    var zone = $('#liveMetrics');
    if (!zone) return;
    if (!S.state.options.metrics || !S.game || !S.metrics) {
      zone.classList.add('hidden');
      return;
    }
    zone.classList.remove('hidden');
    var m = S.metrics;
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
    /* The real-text review and the progress bar belong to one round only:
       every mode that opens the game screen clears them first. */
    $('#reviewZone').classList.add('hidden');
    $('#gameProgress').classList.add('hidden');
    T.dictationPanel(false);
  }

  function startSequence(cfg) {
    /* Nothing to type means nothing to start: loadStep() needs a current
       step, and an empty list would fail as soon as the screen opens. */
    if (!cfg.steps || !cfg.steps.length) return;
    S.game = { type: 'seq', cfg: cfg, idx: 0, pos: 0, waiting: false, stepMisses: [] };
    $('#gameTitle').textContent = cfg.title;
    var inNumpad = cfg.mode === 'numbers';
    showGameCard();
    $('#keyboardPanel').classList.toggle('hidden', inNumpad);
    $('#numpadPanel').classList.toggle('hidden', !inNumpad);
    $('#targetZone').classList.remove('hidden');
    $('#challengeZone').classList.add('hidden');
    $('#guide').classList.remove('hidden');
    clearFeedback();
    $('#blockPause').classList.add('hidden');
    startMetrics();
    paintBlockStars();
    T.showScreen('screenGame');
    loadStep();
  }

  /* A long round (words game) earns stars the way the all-keys challenge
     does: one star per block, under the progress bar, lit when its block is
     finished and pulsing on the block being typed. A round with no block
     starts shows none. Same markup and styles as the phase stars in
     challenge.js (#challengeStars, .challenge-star). */
  function paintBlockStars() {
    var zone = $('#challengeZone');
    var steps = S.game.cfg.steps;
    var total = steps.filter(function (p) { return p.blockStart; }).length + 1;
    if (total === 1) {
      zone.classList.add('hidden');
      return;
    }
    var idx = S.game.idx;
    var earned = 0;
    steps.forEach(function (p, i) { if (p.blockStart && i <= idx) earned += 1; });
    /* Past the last step the round is over: every block, including the last, is lit. */
    if (idx >= steps.length) earned = total;
    var html = '';
    for (var i = 0; i < total; i++) {
      var lit = i < earned;
      html += '<span class="challenge-star' +
        (lit ? ' earned' : '') +
        (i === earned && !lit ? ' active' : '') +
        '">' + (lit ? '★' : '☆') + '</span>';
    }
    $('#challengeStars').innerHTML = html;
    zone.classList.remove('hidden');
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
    $('#targetZone').classList.remove('hidden');
    $('#guide').classList.remove('hidden');
    $('#gameInstruction').textContent = currentStep().text || '';
    renderTarget();
    updateGuide();
    updateProgress();
  }

  /* The shared progress bar (assets/css/components.css) for every sequence
     activity (placement, lessons, words, numbers, real texts): the share of
     the round done so far, letter by letter. Special-key steps count as one
     letter. The challenge and dictation rounds do not come through here. */
  function updateProgress() {
    var on = !!S.game && S.game.type === 'seq';
    if (!on) {
      $('#gameProgress').classList.add('hidden');
      return;
    }
    var p = currentStep();
    var len = p && p.seq ? p.seq.length : 1;
    paintProgress((S.game.idx + S.game.pos / len) / S.game.cfg.steps.length);
  }

  /* Paints the shared progress bar (assets/css/components.css) with the
     share of the round done, 0 to 1. Every activity that shows it calls
     this: sequences here, the all-keys challenge in challenge.js. */
  function paintProgress(share, valueText) {
    var bar = $('#gameProgress');
    var pct = Math.max(0, Math.min(100, Math.round(share * 100)));
    bar.classList.remove('hidden');
    $('#gameProgressFill').style.width = pct + '%';
    bar.setAttribute('aria-valuenow', String(pct));
    bar.setAttribute('aria-label', App.i18n.t('gameProgressAria'));
    if (valueText) bar.setAttribute('aria-valuetext', valueText);
    else bar.removeAttribute('aria-valuetext');
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
    /* A step may carry a `display` form of the same length as `seq` (the
       typed name, shown with a capital first letter). Matching still uses
       `seq`, so the display never changes what key the player must press. */
    var seq = p.display || p.seq;
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
    S.metrics.keys += 1;

    if (isSpecialStep(p)) {
      /* Single-action step: no character sequence to walk through,
         it's done as soon as the right key is detected. */
      if (ch === p.specialKey) {
        S.metrics.hits += 1;
        App.feedback.successSound(T.panOf(ch));
        stepCompleted(ch);
      } else {
        S.metrics.misses += 1;
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
      S.metrics.hits += 1;
      App.feedback.successSound(T.panOf(ch));
      S.game.pos += 1;
      renderTarget();
      updateProgress();
      if (S.game.pos >= seq.length) stepCompleted(ch);
      else updateGuide();
    } else {
      S.metrics.misses += 1;
      /* Per step, so the real-text review can mark the lines that needed a correction. */
      S.game.stepMisses[S.game.idx] = (S.game.stepMisses[S.game.idx] || 0) + 1;
      T.keysOf(ch).forEach(function (t) {
        t.classList.add('miss');
        setTimeout(function () { t.classList.remove('miss'); }, 500);
      });
      App.feedback.encourage($('#feedback'));
    }
  }

  function stepCompleted(lastCh) {
    var game = S.game;
    S.game.waiting = true;
    T.markTarget(null);
    /* The success tone for the last key of the step is panned to that
       key's column (spatial-sound option). Earlier keystrokes inside
       the same step are silent in feedback.js; only the step-complete
       "ding" is panned. */
    App.feedback.success($('#feedback'), T.panOf(lastCh));
    setTimeout(function () {
      /* Only this round may move on: if the person left it and started another
         within the half second, the new round must not be advanced. */
      if (S.game !== game) return;
      S.game.waiting = false;
      S.game.idx += 1;
      paintBlockStars();
      if (S.game.idx >= S.game.cfg.steps.length) {
        endSequence(S.game.stepMisses);
      } else if (currentStep().blockStart) {
        showBlockPause();
      } else {
        clearFeedback();
        loadStep();
      }
    }, 500);
  }

  /* A long round is split into blocks (words game). Before the first step of
     a new block the round waits here: no key counts until "Seguir" is pressed.
     The pause is not a celebration and does not end the round. */
  function showBlockPause() {
    var game = S.game;
    var steps = game.cfg.steps;
    var total = steps.filter(function (p) { return p.blockStart; }).length + 1;
    var done = steps.slice(0, game.idx + 1).filter(function (p) { return p.blockStart; }).length;
    S.game.waiting = true;
    $('#targetZone').classList.add('hidden');
    $('#guide').classList.add('hidden');
    $('#gameInstruction').textContent = App.i18n.t('wordsBlockDone').replace('{n}', done).replace('{total}', total);
    $('#blockPause').classList.remove('hidden');
    $('#btnBlockContinue').onclick = function () {
      if (S.game !== game) return;
      $('#blockPause').classList.add('hidden');
      S.game.waiting = false;
      clearFeedback();
      loadStep();
    };
    $('#btnBlockContinue').focus();
  }

  /* Real texts show the lines typed before the achievement (showReview);
     the award is already given here, so the review changes no stars. */
  function showReview(cfg, stepMisses, finish) {
    $('#gameCard').classList.add('hidden');
    $('#keyboardPanel').classList.add('hidden');
    $('#guide').classList.add('hidden');
    $('#gameInstruction').textContent = App.i18n.t('reviewIntro');
    var list = $('#reviewLines');
    list.innerHTML = '';
    cfg.steps.forEach(function (step, i) {
      var misses = stepMisses[i] || 0;
      var li = document.createElement('li');
      li.className = 'review-line' + (misses ? ' review-line--missed' : '');
      li.textContent = step.seq;
      if (misses) {
        var note = document.createElement('span');
        note.className = 'review-note';
        note.textContent = App.i18n.t('reviewMissed').replace('{n}', misses);
        li.appendChild(note);
      }
      list.appendChild(li);
    });
    $('#reviewZone').classList.remove('hidden');
    $('#btnReviewRepeat').onclick = function () { cfg.review.retry(); };
    $('#btnReviewDone').onclick = function () {
      $('#reviewZone').classList.add('hidden');
      finish();
    };
    var title = $('#reviewTitle');
    title.setAttribute('tabindex', '-1');
    title.focus();
  }

  function endSequence(stepMisses) {
    var cfg = S.game.cfg;
    S.game = null;
    updateProgress();
    var m = S.metrics;
    var earned = T.award(cfg.starKey);
    var acc = m && m.keys ? Math.round((m.hits / m.keys) * 100) : 0;
    App.achievements.onActivityFinished({ state: S.state, lessons: T.lessons().map(function (l) { return l.id; }), perfect: acc === 100 });
    /* Return to the mode list immediately so completion never leaves the
       learner stranded behind a browser-dependent celebration timer. The
       celebration remains visible on the destination screen. */
    var finish = function () {
      if (cfg.onFinish) cfg.onFinish();
      afterFinish(cfg);
    };
    if (cfg.review) { showReview(cfg, stepMisses || [], finish); return; }
    finish();
  }

  function afterFinish(cfg) {
    /* "A por más" gets the app's own action, not the shared default. The
       default of the shared celebration block is to leave the activity the
       way a multi-page app does: it looks for a ".back-link" and, when
       there is none, reloads the page. This app has no back link (it is a
       single page with its own screens), so the reload was what happened:
       the whole app restarted from the name screen and the practice clock
       — a number that lives in memory, in feedback.js — went back to zero.
       The activity's entry point here is the hub the round was started
       from (the lesson list, the template list, the menu), which is what
       cfg.onFinish already returns to. */
    App.feedback.celebrate(T.finalMessage(), cfg.onFinish || null, T.starLine());
  }

  T.clearFeedback = clearFeedback;
  T.paintProgress = paintProgress;
  T.gameKey = gameKey;
  T.isSpecialStep = isSpecialStep;
  T.showGameCard = showGameCard;
  T.startMetrics = startMetrics;
  T.startSequence = startSequence;
  T.updateGuide = updateGuide;
})(window.Teclatlon);
