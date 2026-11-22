/* ==========================================================================
   Teclatlon — Dictation mode: hear a letter, then type it.
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

  /* ---------- Dictation: hear a random letter, then type it ----------
     This is the one mode that asks for a key through sound, so all of it
     is written around a single rule: a letter that never reaches the
     ears must not leave the activity stuck.
       - the screen says what the activity is and offers to repeat the
         letter (#dictationPanel), so the request is never a mystery;
       - `waiting` is released by a timer as well as by the reading, so a
         dropped utterance cannot lock the keyboard with no visible sign;
       - with no installed voice the letter is shown instead of spoken,
         so the activity still works. */
  /* How long the keyboard stays deaf after a letter is asked for. A
     reading normally ends first (and tts.js guarantees the callback
     even when it does not); this is the net for an utterance that dies
     silently, so it sits above that watchdog on purpose. */
  var DICTATION_UNLOCK_MS = 6000;

  function dictationLetters() {
    return T.physical().rows.reduce(function (letters, row) {
      row.forEach(function (key) {
        if (key.ch && /^[a-zñ]$/i.test(key.ch)) letters.push(key.ch);
      });
      return letters;
    }, []);
  }

  function dictationPanel(show) {
    $('#dictationPanel').classList.toggle('hidden', !show);
    if (!show) {
      dictationLetter(null);
      $('#gameProgress').classList.add('hidden');
    }
  }

  /* A round is one pass over the whole keyboard: every letter once, in a
     random order. The queue is that order; its first letter is the one
     being asked for. A right key takes it off the queue, a wrong key asks
     the same letter again. */
  function shuffled(list) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  /* The shared progress bar: letters done out of the whole keyboard. */
  function paintDictationProgress() {
    var total = S.game.letters.length;
    var done = total - S.game.queue.length;
    T.paintProgress(total ? done / total : 0,
      App.i18n.t('dictationProgress').replace('{done}', done).replace('{total}', total));
  }

  /** Puts the current letter on screen, or hides it with no argument.

      The letter is ALWAYS shown while a letter is pending. This is not
      a shortcut: no browser can tell whether its own speech is audible.
      The voice list is no proof (a machine can have voices and read
      nothing), and `onstart` is no proof either — the engine can start
      "talking" into muted output or the wrong device and produce
      silence. Both were tried as signals here and both left somebody
      staring at a panel that said nothing. So the sound is treated as
      what it is: a bonus on top of a letter that is always legible. */
  function dictationLetter(letter) {
    if (letter) $('#dictationLetter').textContent = letter;
    $('#dictationFallback').classList.toggle('hidden', !letter);
  }

  /* Says the current letter (the head of the queue). It does not pick
     another one: a letter stays the same until it is typed right. */
  function speakDictationLetter() {
    if (!S.game || S.game.type !== 'dictation') return;
    if (!S.game.letter) S.game.letter = S.game.queue[0];
    S.game.phase = 'running';
    S.game.waiting = true;
    renderDictationActions();
    dictationLetter(S.game.letter);
    if (S.dictationUnlock) clearTimeout(S.dictationUnlock);
    S.dictationUnlock = setTimeout(function () {
      S.dictationUnlock = null;
      if (S.game && S.game.type === 'dictation') S.game.waiting = false;
    }, DICTATION_UNLOCK_MS);
    var name = App.i18n.t('dictationLetterNames.' + S.game.letter);
    /* The letter's name and nothing else. The panel already says which
       letter it is and what to do with it, and a word around it is one
       more thing to sit through before the exercise can start. */
    App.tts.speak(name, function () {
      if (S.game && S.game.type === 'dictation') S.game.waiting = false;
    });
  }

  function playDictation() {
    if (S.dictationTimer) clearTimeout(S.dictationTimer);
    if (S.dictationUnlock) clearTimeout(S.dictationUnlock);
    /* phase 'ready': the panel explains the activity and waits. Nothing
       is asked for and no key counts until the person starts, so a key
       pressed while reading the instructions is not read as a mistake. */
    var letters = dictationLetters();
    S.game = { type: 'dictation', letters: letters, queue: shuffled(letters), letter: null, waiting: true, phase: 'ready' };
    paintDictationProgress();
    $('#gameTitle').textContent = App.i18n.t('modeDictationName');
    $('#gameInstruction').textContent = App.i18n.t('dictationInstruction');
    /* The card only ever holds the target and the challenge progress,
       both of which this mode does without, and the panel below replaces
       it as the thing to look at. */
    $('#gameCard').classList.add('hidden');
    dictationPanel(true);
    $('#keyboardPanel').classList.add('hidden');
    $('#numpadPanel').classList.add('hidden');
    $('#targetZone').classList.add('hidden');
    $('#challengeZone').classList.add('hidden');
    $('#guide').classList.add('hidden');
    T.clearFeedback();
    T.startMetrics();
    T.showScreen('screenGame');
    renderDictationActions();
  }

  /* The two buttons: start is offered only while waiting to begin, and
     listen again only once there is a letter to repeat. */
  function renderDictationActions() {
    var ready = S.game.phase === 'ready';
    var start = $('#btnDictationStart');
    var again = $('#btnDictationAgain');
    start.classList.toggle('hidden', !ready);
    start.disabled = !ready;
    again.disabled = ready || !S.game.letter;
  }

  function dictationKey(ch) {
    if (!S.game || S.game.type !== 'dictation') return;
    /* Before the activity starts there is no letter to match, so a key
       pressed while reading the panel is not a mistake. */
    if (S.game.phase !== 'running' || S.game.waiting) return;
    S.metrics.keys += 1;
    if (ch === S.game.letter) {
      S.metrics.hits += 1;
      S.game.waiting = true;
      App.feedback.success($('#feedback'));
      App.feedback.successSound(null, true);
      S.dictationTimer = setTimeout(nextDictationLetter, 550);
    } else {
      S.metrics.misses += 1;
      S.game.waiting = true;
      App.feedback.encourage($('#feedback'), true);
      S.dictationTimer = setTimeout(speakDictationLetter, 300);
    }
  }

  /* The letter was typed right: it leaves the queue. The round ends when
     the queue is empty, so the activity has an end and gives its star. */
  function nextDictationLetter() {
    if (!S.game || S.game.type !== 'dictation') return;
    S.game.queue.shift();
    paintDictationProgress();
    if (S.game.queue.length === 0) {
      finishDictation();
      return;
    }
    S.game.letter = S.game.queue[0];
    speakDictationLetter();
  }

  /* The whole keyboard is done: the star for the mode, the same closing
     screen as the other activities, then back to the menu. */
  function finishDictation() {
    S.game = null;
    dictationPanel(false);
    var m = S.metrics;
    var acc = m && m.keys ? Math.round((m.hits / m.keys) * 100) : 0;
    T.award('dictation');
    App.achievements.onActivityFinished({ state: S.state, lessons: T.lessons().map(function (l) { return l.id; }), perfect: acc === 100 });
    App.feedback.celebrate(T.finalMessage() + ' ' + App.i18n.t('transferMessage'), T.goMenu, T.starLine());
  }

  T.dictationKey = dictationKey;
  T.dictationPanel = dictationPanel;
  T.playDictation = playDictation;
  T.speakDictationLetter = speakDictationLetter;
})(window.Teclatlon);
