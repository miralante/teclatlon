/* ==========================================================================
   Teclatlon — Sequence modes: placement, lessons, words, numbers and templates.
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

  /* ---------- Game modes ---------- */
  function playPosition() {
    T.startSequence({
      mode: 'placement', title: App.i18n.t('modePlacementName'),
      steps: keepStepsOnLayout(DATA.placement[App.i18n.locale()] || DATA.placement.es),
      starKey: 'placement', onFinish: T.goMenu
    });
  }

  /* Builds the trailing review step that walks every key the lesson
     has introduced (this one + all previous lessons) and that is also
     visible in the currently selected layout. The sequence is built
     row-by-row in the same physical order the layout shows them, so
     the player practises the full keyboard rather than just the new
     letters of the lesson. Returns null when there is nothing to
     review (the special-keys lesson and lessons that don't declare
     any `keys`). */
  function buildLessonReview(l) {
    if (!l || !Array.isArray(l.keys) || l.keys.length === 0) return null;
    var allLessons = T.lessons();
    var idx = allLessons.indexOf(l);
    if (idx < 0) return null;
    var accumulated = {};
    for (var i = 0; i <= idx; i++) {
      var t = allLessons[i].keys;
      if (!Array.isArray(t)) continue;
      for (var j = 0; j < t.length; j++) accumulated[t[j]] = true;
    }
    /* Build the review string by walking the visible layout row by
       row (top to bottom, left to right within each row), keeping
       only characters that are both in the accumulated set AND
       typeable in the current layout. Special-key rows (extended's
       Home/End/etc. row) are skipped: they aren't alphanumeric
       practice targets. */
    var typeable = T.typeableKeys(T.visibleRows());
    var parts = [];
    T.visibleRows().forEach(function (row) {
      var rowChars = '';
      row.forEach(function (k) {
        if (!k.ch || k.special) return;
        if (accumulated[k.ch] && typeable[k.ch]) rowChars += k.ch;
      });
      if (rowChars) parts.push(rowChars);
    });
    if (parts.length === 0) return null;
    return { text: App.i18n.t('lessonReview'), seq: parts.join(' ') };
  }

  function playLesson(l) {
    /* Most lessons' steps are plain strings (a typed sequence). The
       special-keys lesson uses { specialKey: 'home' } objects instead
       -- see isSpecialStep(). */
    var steps = l.steps.map(function (s) {
      return typeof s === 'string' ? { text: l.intro, seq: s } : { text: l.intro, specialKey: s.specialKey };
    });
    var review = buildLessonReview(l);
    if (review) steps.push(review);
    steps = keepStepsOnLayout(steps);
    T.startSequence({
      mode: 'lesson', title: App.i18n.t('lessonTitle').replace('{title}', l.title),
      steps: steps, starKey: l.id, onFinish: T.goLessons
    });
  }

  /* Drops the lesson or placement steps that need a key the active
     physical keyboard does not have (the Ñ on a US keyboard, the ;
     on a Spanish one), instead of asking for a key that can't be
     pressed. Special-key steps always stay. */
  function keepStepsOnLayout(steps) {
    var chars = {};
    T.physicalRows().forEach(function (row) {
      row.forEach(function (k) { if (k.ch) chars[k.ch] = true; });
    });
    return steps.filter(function (p) {
      if (T.isSpecialStep(p)) return true;
      for (var i = 0; i < p.seq.length; i++) {
        var c = p.seq[i];
        if (c !== ' ' && !chars[c.toLowerCase()]) return false;
      }
      return true;
    });
  }

  function playWords() {
    /* Before: 4 random words. Now (SPEC principle 7, mastery of the
       full keyboard): we select a set from the bank that covers every
       key of the current layout at least 5 times, with a cap of 50
       words so the round isn't endless. Every round is different
       because the algorithm shuffles ties at random. */
    var MIN_PER_KEY = 5;
    var MAX_WORDS = 50;
    var baseTarget = T.typeableKeys(T.visibleRows());
    /* Ñ is only required in Spanish: in English it's a key on the
       Spanish physical keyboard but not a letter of the language, and
       it wouldn't make sense to ask the player to press it in an
       English round. The rest of the target (letters a-z, symbols
       ,.- and space) are universal. */
    var target = {};
    Object.keys(baseTarget).forEach(function (k) {
      if (k === 'ñ' && App.i18n.locale() !== 'es') return;
      target[k] = true;
    });
    var bank = DATA.words[App.i18n.locale()] || DATA.words.es;
    var steps = [];

    /* If a name is saved and it fits the layout, it goes first with
       its own text ("Type your name") and contributes to the coverage
       count. If it doesn't fit (some character isn't in the layout),
       it is silently skipped so it doesn't break coverage. */
    var nameSeq = '';
    if (S.state.name) {
      var plainName = T.stripAccents(S.state.name.toLowerCase());
      if (T.seqFitsLayout(plainName, target)) {
        nameSeq = plainName;
        /* The name is shown with its first letter capitalised, as a name
           is written, even when it was saved in lowercase. Only the
           display changes: `seq` stays lowercase so the player is not
           asked to press Shift. The uppercase form is kept only when it is
           still one character, so the display and `seq` line up. */
        var firstUpper = plainName.charAt(0).toUpperCase();
        var displayName = firstUpper.length === 1 ? firstUpper + plainName.slice(1) : plainName;
        steps.push({ text: App.i18n.t('typeYourName'), seq: plainName, display: displayName });
      }
    }

    /* The greedy algorithm starts from a coverage pre-seeded with the
       name (if it entered). That way the name "counts" toward the
       minimum of 5 presses per key instead of being excluded by the
       set cover. */
    var initialCoverage = {};
    Object.keys(target).forEach(function (k) { initialCoverage[k] = 0; });
    if (nameSeq) {
      for (var ni = 0; ni < nameSeq.length; ni++) {
        var nc = nameSeq[ni];
        if (target[nc]) initialCoverage[nc] = (initialCoverage[nc] || 0) + 1;
      }
    }

    var chosen = T.pickWordSet(bank, target, initialCoverage, MIN_PER_KEY, MAX_WORDS);
    chosen.forEach(function (w) {
      steps.push({ text: App.i18n.t('typeTheWord'), seq: w });
    });

    T.startSequence({
      mode: 'words', title: App.i18n.t('modeWordsName'),
      steps: steps, starKey: 'words', onFinish: T.goMenu
    });
  }

  function playTemplate(p) {
    var steps = p.lines.map(function (line) {
      return { text: App.i18n.t('templateInstruction'), seq: line };
    });
    T.startSequence({
      mode: 'template', title: p.title,
      steps: steps, starKey: 'template_' + p.id, onFinish: T.goTemplates
    });
  }

  function playNumbers() {
    T.startSequence({
      mode: 'numbers', title: App.i18n.t('modeNumbersName'),
      steps: DATA.numpadSteps[App.i18n.locale()] || DATA.numpadSteps.es,
      starKey: 'numbers', onFinish: T.goMenu
    });
  }

  T.playLesson = playLesson;
  T.playNumbers = playNumbers;
  T.playPosition = playPosition;
  T.playTemplate = playTemplate;
  T.playWords = playWords;
})(window.Teclatlon);
