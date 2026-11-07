/* ==========================================================================
   Teclatlon — Physical keyboard input (the only real input) and keyboard option buttons.
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

  /* ---------- Physical keyboard: the only real input ---------- */
  /* Maps the DOM KeyboardEvent.key value of each "less frequent key"
     (see DATA.lessons "Special keys") to an internal id. The id is
     what ends up in data-ch on the on-screen decorative key
     (DATA.layouts.extended) and in a lesson step's `specialKey` field
     -- normalizeKey() is the only place that knows about the real DOM
     key names, same as it's the only place that knows 'Spacebar'
     means ' '. */
  var SPECIAL_KEY_DOM = { Home: 'home', End: 'end', PageUp: 'pageUp', PageDown: 'pageDown', Delete: 'delete' };

  function normalizeKey(k) {
    if (k === 'Spacebar') k = ' ';
    if (SPECIAL_KEY_DOM[k]) return SPECIAL_KEY_DOM[k];
    if (typeof k !== 'string' || k.length !== 1) return null;
    return k.toLowerCase();
  }

  document.addEventListener('keydown', function (e) {
    if (T.settingsOpen()) {
      if (e.key === 'Escape') T.closeSettings();
      else T.handleDrawerTab(e);
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var focused = document.activeElement;
    /* Space and Enter belong to a focused button, not to the exercise:
       while a game is running this handler calls preventDefault() on
       every key, which would leave a keyboard-driven button (the
       dictation "listen again") impossible to press. Every other key
       still reaches the exercise — a letter typed with a button focused
       is a letter. Checked before normalizeKey() because Enter is not a
       single character and would be dropped as "not a game key". */
    if (focused && focused.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar')) return;
    var ch = normalizeKey(e.key);
    if (!ch) return;
    T.flashKey(T.stripAccents(ch), true);
    if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) return;
    if (!S.game) return;
    e.preventDefault();
    if (e.repeat) return;
    if (S.game.type === 'challenge') T.challengeKey(ch);
    else if (S.game.type === 'dictation') T.dictationKey(ch);
    else T.gameKey(ch, e.shiftKey);
  });

  document.addEventListener('keyup', function (e) {
    var ch = normalizeKey(e.key);
    if (ch) T.flashKey(T.stripAccents(ch), false);
  });

  /* ---------- Keyboard options (delegation: there are several panels) ---------- */
  document.addEventListener('click', function (e) {
    var bt = e.target.closest('.btn-keyboard');
    if (bt) {
      S.state.options.keyboard = bt.dataset.keyboard;
      T.save();
      T.renderKeyboards();
      return;
    }
    var bl = e.target.closest('.btn-layout');
    if (bl) {
      S.state.options.layout = bl.dataset.layout === 'us' ? 'us' : 'es';
      T.save();
      T.renderKeyboards();
      /* Lesson, placement, words, numbers and dictation build their steps
         or letters once, when the round starts, so the new keyboard only
         applies from the next round. The all-keys challenge re-reads the
         layout at once and needs no notice. */
      if (S.game && (S.game.type === 'seq' || S.game.type === 'dictation')) {
        S.game.layoutNotice = true;
        $('#feedback').textContent = App.i18n.t('keyboardLayoutNextRound');
      }
      return;
    }
    var bc = e.target.closest('.btn-color');
    if (bc) {
      S.state.options.color = bc.dataset.color === 'fingers' ? 'fingers' : 'hands';
      T.save();
      T.renderKeyboards();
    }
  });
})(window.Teclatlon);
