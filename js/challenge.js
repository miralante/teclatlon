/* ==========================================================================
   Teclatlon — "All keys" challenge in three phases.
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

  /* Closing line for the meaningful-learning anchor: connects the
     exercise to writing real messages on a real computer. Appended to
     the celebration overlay itself, since this activity has no
     separate "round complete" screen to hold it. */
  function celebrateWithTransfer(after, earned) {
    var completed = false;
    function finish() {
      if (completed) return;
      completed = true;
      if (after) after();
    }
    var shown = App.feedback.celebrate(T.finalMessage() + ' ' + App.i18n.t('transferMessage') + ' ' + T.starClosing(earned), finish);
    /* Keep navigation reliable if a browser suppresses the celebration
       timer while a special-key event is being dispatched. The fallback
       waits as long as the message stays up, so it never cuts it short. */
    setTimeout(finish, shown + 500);
  }

  /* ---------- Challenge: all keys ---------- */
  /* Challenge phases:
     0 = left-to-right, 1 = right-to-left, 2 = random.
     The order of the keys changes between phases, but the phases are
     an internal detail of this mode: the guide next to the hand only
     ever says which key to press and with which finger, never which
     phase it is (see challengeGuide()). Each completed phase lights up
     its star in #challengeStars and the challenge carries on; it only
     finishes — with the star for the mode and the achievement — once
     the last phase is done. */
  var CHALLENGE_PHASES = 3;

  function playChallenge() {
    /* 'order' is the key sequence for the current phase, built on demand
       by challengeSequence() (see nextPendingKey). */
    S.game = { type: 'challenge', set: {}, phase: 0, stars: 0, order: null };
    $('#gameTitle').textContent = App.i18n.t('allKeysTitle');
    $('#gameInstruction').textContent = App.i18n.t('allKeysInstruction');
    T.showGameCard();
    $('#keyboardPanel').classList.remove('hidden');
    $('#numpadPanel').classList.add('hidden');
    $('#targetZone').classList.add('hidden');
    $('#challengeZone').classList.remove('hidden');
    $('#guide').classList.remove('hidden');
    T.clearFeedback();
    T.markTarget(null);
    $$('.key.done').forEach(function (t) { t.classList.remove('done'); });
    T.startMetrics();
    T.showScreen('screenGame');
    updateChallenge();
  }

  function advanceChallengePhase() {
    S.game.stars += 1;
    S.game.phase += 1;
    S.game.set = {};
    /* New phase, new order (left→right / right→left / shuffled). */
    S.game.order = null;
    $$('.key.done').forEach(function (t) { t.classList.remove('done'); });
    /* Light up the star for the phase just finished right away: the
       learner has to see it before the next phase starts, and the
       next updateChallenge() is 800 ms away. */
    updateChallengeStars();
    /* Brief feedback before continuing */
    App.feedback.success($('#feedback'));
    setTimeout(function () {
      T.clearFeedback();
      updateChallenge();
    }, 800);
  }

  function endChallenge() {
    /* The last phase earns its star too, exactly like the ones before
       it, so the closing celebration shows the full row of stars lit
       instead of leaving the final one empty. */
    S.game.stars = CHALLENGE_PHASES;
    updateChallengeStars();
    S.game = null;
    T.achieve('allKeys');
    /* Achievement checks that used to live inside checkGoal() */
    var m = S.state.metrics;
    if (m && m.keys) {
      if (S.state.stars >= 1) T.achieve('firstStar');
      if (S.state.stars >= 10) T.achieve('tenStars');
      var accuracy = Math.round((m.hits / m.keys) * 100);
      if (accuracy === 100) T.achieve('perfectRound');
    }
    var earned = T.award('allKeys');
    celebrateWithTransfer(T.goMenu, earned);
  }

  function challengeKey(ch) {
    var typeable = T.typeableKeys(T.visibleRows());
    if (!typeable[ch] || S.game.set[ch]) return;
    /* Only accept the key if it is the current expected target. */
    var expected = nextPendingKey();
    if (!expected || ch !== expected.ch) return;
    S.game.set[ch] = true;
    S.state.metrics.keys += 1;
    S.state.metrics.hits += 1;
    T.keysOf(ch).forEach(function (t) { t.classList.add('done'); });
    /* Quiet per-key ack: just the "ding" panned to that column.
       Avoids spamming success messages during the challenge but lets
       the spatial-sound option be audible. */
    App.feedback.successSound(T.panOf(ch));
    updateChallenge();
  }

  function reapplyChallenge() {
    /* The keyboard layout may have changed under us, so the order built
       from the old layout is stale: drop it and let nextPendingKey()
       rebuild it for the current one. */
    S.game.order = null;
    Object.keys(S.game.set).forEach(function (ch) {
      T.keysOf(ch).forEach(function (t) { t.classList.add('done'); });
    });
    updateChallenge();
  }

  /* Build the order in which the challenge asks for the keys, once per
     phase. Phase 0 = left-to-right, phase 1 = right-to-left, phase 2 =
     shuffled. The order is fixed for the whole phase on purpose: the
     guide, the .target highlight and challengeKey() all read it, and
     while it was rebuilt on every call the random phase drew a fresh
     key each time — so the key shown on screen was almost never the key
     the next press was compared against, and that phase could not be
     finished. */
  function challengeSequence(phase) {
    var rows = T.visibleRows().slice();
    if (phase === 1) rows = rows.reverse();
    var keys = [];
    rows.forEach(function (row) {
      var line = row.filter(function (k) { return k.ch && !k.special; });
      if (phase === 1) line = line.reverse();
      keys = keys.concat(line);
    });
    if (phase === 2) keys = App.utils.shuffle(keys);
    return keys;
  }

  /* Pick the next key the player still has to press in the "all keys"
     challenge, following the phase's order. */
  function nextPendingKey() {
    if (!S.game) return null;
    if (!S.game.order) S.game.order = challengeSequence(S.game.phase);
    for (var i = 0; i < S.game.order.length; i++) {
      var k = S.game.order[i];
      if (k && k.ch && !S.game.set[k.ch]) return k;
    }
    return null;
  }

  /* Render the hand guide and the on-screen keyboard highlight for the
     next key still pending in the challenge. The marker reuses the
     same "target" class the rest of the modes use to light up the
     target key, so the visual cue is consistent across modes.

     The guide next to the hand only tells the learner which key to
     press and with which finger — the phase is an internal detail of
     this mode and is never named on screen. Visibility follows
     state.options.showFingerText exactly like renderHands(): the text
     is written either way and the "hidden" class is what switches it,
     so turning the setting off and on again mid-challenge restores
     the sentence instead of leaving an empty box. */
  function challengeGuide() {
    var k = nextPendingKey();
    if (!k) {
      T.markTarget(null);
      $('#guideText').textContent = '';
      $('#handsSvg').innerHTML = T.handsSVG(null, null);
      return;
    }
    var ch = k.ch;
    var finger = k.finger || T.fingerOf(ch);
    T.markTarget(ch);
    T.renderHands(finger, null);
    var keyText;
    if (ch === ' ') keyText = App.i18n.t('keyLabel.space') || ch;
    else if (ch.length === 1 && /[a-zA-Z]/.test(ch)) keyText = ch.toUpperCase();
    else keyText = ch;
    var text;
    if (finger === 'th') {
      text = App.i18n.t('challengeNextKeyThumb').replace('{key}', keyText);
    } else if (finger) {
      text = App.i18n.t('challengeNextKey')
        .replace('{key}', keyText)
        .replace('{finger}', App.i18n.t('finger.' + finger + '.name'))
        .replace('{hand}', App.i18n.t('finger.' + finger + '.hand'));
    } else {
      text = App.i18n.t('findKey');
    }
    $('#guideText').textContent = text;
    $('#guideText').classList.toggle('hidden', !S.state.options.showFingerText);
  }

  function updateChallenge() {
    var total = 0, done = 0;
    T.visibleRows().forEach(function (f) {
      f.forEach(function (k) {
        if (!k.ch || k.special) return;
        total += 1;
        if (S.game.set[k.ch]) done += 1;
      });
    });
    $('#challengeFill').style.width = (total ? Math.round(done / total * 100) : 0) + '%';
    $('#challengeText').textContent = App.i18n.t('doneOfTotal').replace('{done}', done).replace('{total}', total);
    updateChallengeStars();
    if (total > 0 && done === total) {
      /* Clear the next-key highlight and the hand guide so the
         completion feedback doesn't leave a stale "press X" prompt
         on screen while the success banner shows. */
      T.markTarget(null);
      $('#guideText').textContent = '';
      $('#handsSvg').innerHTML = T.handsSVG(null, null);
      if (S.game.phase < CHALLENGE_PHASES - 1) {
        advanceChallengePhase();
      } else {
        endChallenge();
      }
      return;
    }
    challengeGuide();
  }

  function updateChallengeStars() {
    var starsEl = $('#challengeStars');
    if (!starsEl) return;
    var html = '';
    for (var i = 0; i < CHALLENGE_PHASES; i++) {
      var earned = i < S.game.stars;
      var active = i === S.game.phase && !earned;
      html += '<span class="challenge-star' +
        (earned ? ' earned' : '') +
        (active ? ' active' : '') +
        '">' + (earned ? '★' : '☆') + '</span>';
    }
    starsEl.innerHTML = html;
  }

  T.challengeKey = challengeKey;
  T.playChallenge = playChallenge;
  T.reapplyChallenge = reapplyChallenge;
})(window.Teclatlon);
