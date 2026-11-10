/* ==========================================================================
   Teclatlon — Entry point: wires the buttons and boots the app.
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

  /* ---------- Name ---------- */
  function saveName() {
    var v = $('#inputName').value.trim().slice(0, 20);
    S.state.name = v;
    T.save();
    T.goMenu();
  }

  $('#btnSaveName').addEventListener('click', saveName);
  $('#btnSkipName').addEventListener('click', function () {
    S.state.name = '';
    T.save();
    T.goMenu();
  });
  $('#inputName').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveName();
    }
  });

  var confirmingClear = false;
  $('#btnClearAll').addEventListener('click', function () {
    var btn = this;
    if (!confirmingClear) {
      confirmingClear = true;
      btn.textContent = App.i18n.t('confirmClear');
      setTimeout(function () {
        confirmingClear = false;
        btn.textContent = App.i18n.t('btnClearProgress');
      }, 4000);
      return;
    }
    confirmingClear = false;
    App.storage.remove(T.SLUG);
    /* The unlocked logros live under their own key ('teclatlon:achievements',
       see assets/js/achievements.js). They are progress too, so they go. */
    App.storage.remove('achievements');
    S.doneThisSession = {};
    S.state = T.freshState();
    T.save();
    btn.textContent = App.i18n.t('btnClearProgress');
    $('#inputName').value = '';
    $('#nameNotice').textContent = App.i18n.t('clearedNotice');
    T.renderKeyboards();
    T.applyOptions();
    T.updateStars();
    /* Re-render the menu so the per-mode completion badges (the
       ⭐ on each .mode-card) and the header greeting clear as
       well. Without this they stay in the DOM from the previous
       render, because we already cleared state but never asked the
       menu to repaint. */
    T.renderMenu();
  });

  /* ---------- Menu and navigation ---------- */
  $('#gameMenu').addEventListener('click', function (e) {
    var t = e.target.closest('.mode-card');
    if (!t) return;
    var m = t.dataset.mode;
    if (m === 'placement') T.playPosition();
    else if (m === 'lessons') T.goLessons();
    else if (m === 'words') T.playWords();
    else if (m === 'allKeys') T.playChallenge();
    else if (m === 'numbers') T.playNumbers();
    else if (m === 'dictation') T.playDictation();
    else if (m === 'free') T.goFree();
    else if (m === 'templates') T.goTemplates();
  });


  $('#btnChangeName').addEventListener('click', T.goName);
  $('#btnBackToMenu').addEventListener('click', T.goMenu);
  $('#btnBackToMenuTemplates').addEventListener('click', T.goMenu);

  $('#btnExitGame').addEventListener('click', function () {
    var mode = S.game && S.game.cfg ? S.game.cfg.mode : null;
    if (S.dictationTimer) clearTimeout(S.dictationTimer);
    if (S.dictationUnlock) clearTimeout(S.dictationUnlock);
    if (App.tts) App.tts.stop();
    S.game = null;
    T.clearFeedback();
    T.markTarget(null);
    if (mode === 'lesson') T.goLessons();
    else if (mode === 'template') T.goTemplates();
    else T.goMenu();
  });

  /* Start the activity: the panel has been read, so the first letter is
     asked for now. Deliberately explicit — the person decides when the
     exercise begins rather than having a letter fired at them while
     they are still reading what the mode is. */
  $('#btnDictationStart').addEventListener('click', function () {
    if (!S.game || S.game.type !== 'dictation' || S.game.phase !== 'ready') return;
    T.speakDictationLetter(true);
  });

  /* Ask for the current letter again. The mode speaks each letter once
     and then waits, so this is the only way back for anyone who did not
     catch it the first time. */
  $('#btnDictationAgain').addEventListener('click', function () {
    if (!S.game || S.game.type !== 'dictation' || S.game.phase !== 'running') return;
    T.speakDictationLetter(false);
  });


  /* ---------- Free writing ---------- */
  $('#btnExitFree').addEventListener('click', function () {
    if (App.tts) App.tts.stop();
    T.goMenu();
  });
  var freeArea = $('#freeArea');
  var listenFree = $('#btnListenFree');
  function updateListenFree() {
    listenFree.disabled = !freeArea.value.trim();
  }
  freeArea.addEventListener('input', updateListenFree);
  listenFree.addEventListener('click', function () {
    var t = $('#freeArea').value.trim();
    if (t && App.tts && App.tts.speak) App.tts.speak(t);
  });
  $('#btnClearFree').addEventListener('click', function () {
    freeArea.value = '';
    if (App.tts) App.tts.stop();
    updateListenFree();
    freeArea.focus();
  });

  /* ---------- Language selector ---------- */
  /* Manual override for the browser-language auto-detection done in
     index.html's pre-paint script and i18n.js#detect. Persists to
     the same 'teclatlon:locale' key i18n.js already reads, so once
     set it wins over auto-detection on every future visit.
     App.i18n.setLocale() reloads the page — there's no in-place
     re-render of already-painted text. */
  $$('.btn-language').forEach(function (b) {
    b.setAttribute('aria-pressed', String(b.dataset.locale === App.i18n.locale()));
    b.addEventListener('click', function () {
      App.i18n.setLocale(b.dataset.locale);
    });
  });

  /* ---------- Boot ---------- */
  /* Computer-only gate (SPEC.md section 2): the pre-paint script
     in index.html sets <html data-app-blocked="mobile"> on
     phones/tablets. In that case we surface the overlay (already
     in the DOM) with the right i18n strings and abort the rest
     of the boot -- there's no game engine to set up, no listeners
     to wire, no audio context to create on a device the app cannot
     use. */
  if (document.documentElement.getAttribute('data-app-blocked') === 'mobile') {
    var blockOverlay = document.getElementById('mobileBlock');
    if (blockOverlay) {
      App.i18n.apply(blockOverlay);
      blockOverlay.removeAttribute('hidden');
      /* App.i18n.apply(document) ran earlier (i18n.js#init) and may
         have overwritten the gate title with the regular 'Teclatlon'
         one. Put the gate wording back so the browser tab also says
         the app is blocked on this device. */
      document.title = App.i18n.t('computerOnly') + ' — Teclatlon';
    }
    return;
  }

  $('#freeArea').setAttribute('placeholder', App.i18n.t('freeAreaPlaceholder'));
  T.renderRows($('#numpad'), DATA.numpad);
  T.renderKeyboards();
  T.applyOptions();
  /* No need to listen to prefers-color-scheme any more: it only repainted
     when the system switched to dark with the "auto" theme, and that theme
     no longer exists. */
  T.updateStars();

  /* Hash routing — supports direct navigation via URL hash
     (e.g. page.goto('/#/screenMenu') in tests). */
  function routeHash() {
    var h = location.hash.replace(/^#\/?/, '');
    if (h === 'screenMenu' || h === 'menu')            { T.goMenu(); return true; }
    if (h === 'screenLessons' || h === 'lessons')      { T.goLessons(); return true; }
    if (h === 'screenTemplates' || h === 'templates')  { T.goTemplates(); return true; }
    if (h === 'screenName' || h === 'name')             { T.goName(); return true; }
    if (h === 'screenFree' || h === 'free')              { T.goFree(); return true; }
    /* A game only exists while it runs, so a deep link to one has nothing
       to show: go to the menu instead of leaving every screen hidden. */
    if (h === 'screenGame' || h === 'game')              { T.goMenu(); return true; }
    return false;
  }

  /* Boot: pick the right first screen. Deferred to 'load' so that
     hash routing (routeHash) runs synchronously first during page
     load and the boot screen does not override it. */
  window.addEventListener('load', function () {
    /* If routeHash handled a hash (e.g. /#/screenMenu), don't also
       call goName/goMenu here — the hash handler already picked a screen. */
    if (routeHash()) return;
    if (S.state.name) {
      T.goMenu();
    } else {
      T.goName();
    }
  });

  window.addEventListener('hashchange', routeHash);
})(window.Teclatlon);
