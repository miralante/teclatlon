/* ==========================================================================
   Teclatlon — Settings drawer, options, practice clock and rest-reminder box.
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

  /* ---------- Accessibility settings ---------- */
  function onOffLabel(key, active) {
    return App.i18n.t(key + (active ? 'On' : 'Off'));
  }

  function updateSettingsButton(id, key, active) {
    var b = $(id);
    b.setAttribute('aria-pressed', String(active));
    b.textContent = onOffLabel(key, active);
  }

  /* Applies state.options to the page (theme/text-size custom
     attributes on <html>, focus-mode class) and syncs every toggle
     button's aria-pressed + on/off label. Called at boot and after
     every settings change. The same theme/text-size/focus attributes
     are set earlier, before first paint, by the inline script in
     index.html (reads localStorage directly) -- this just keeps
     everything consistent once app.js has taken over. */
  function applyOptions() {
    var html = document.documentElement;
    /* The theme is applied as stored. The "auto" option was removed: it set
       no attribute and deferred to prefers-color-scheme. A saved "auto" was
       migrated to "light" in core.js, because it is not in the list. */
    html.setAttribute('data-theme', S.state.options.theme);
    if (S.state.options.textSize === 'normal') html.removeAttribute('data-text-size');
    else html.setAttribute('data-text-size', S.state.options.textSize);
    html.classList.toggle('hide-legend', S.state.options.hideLegend);
    html.classList.toggle('hide-numpad', S.state.options.hideNumpad);
    html.classList.toggle('dim-celebration', S.state.options.dimCelebration);

    $$('.btn-text-size').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.textSize === S.state.options.textSize));
    });
    $$('.btn-theme').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.theme === S.state.options.theme));
    });
    updateSettingsButton('#btnHideLegend', 'hideLegendLabel', S.state.options.hideLegend);
    updateSettingsButton('#btnHideNumpad', 'hideNumpadLabel', S.state.options.hideNumpad);
    updateSettingsButton('#btnDimCelebration', 'dimCelebrationLabel', S.state.options.dimCelebration);
    updateSettingsButton('#btnKeySound', 'keySoundLabel', S.state.options.keySound);
    updateSettingsButton('#btnErrorSound', 'errorSoundLabel', S.state.options.errorSound);
    updateSettingsButton('#btnFingerText', 'fingerTextLabel', S.state.options.showFingerText);
    /* The finger text is rewritten on every key, so turning the setting
       off/on has to act on the guide that is already on screen instead
       of waiting for the next keystroke to redraw it. */
    ['#guideText', '#guideTextFree'].forEach(function (sel) {
      var guide = $(sel);
      if (guide) guide.classList.toggle('hidden', !S.state.options.showFingerText);
    });
    /* The rest-reminder number box keeps its own value, so sync it
       instead of aria-pressed. Writing it here is also what shows a
       clamped or corrected number back to the person, and what parks
       the ▲/▼ pair at the ends of the range: at the top there is
       nothing left to add, at the bottom nothing left to take off. */
    var restInput = $('#restMinutesInput');
    if (restInput) {
      var restValue = S.state.options.restMinutes;
      restInput.value = String(restValue);
      var restUp = $('#restMinutesUp');
      var restDown = $('#restMinutesDown');
      if (restUp) restUp.disabled = restValue >= App.feedback.REST_MAX;
      if (restDown) restDown.disabled = restValue <= App.feedback.REST_MIN;
    }
    updateSettingsButton('#btnShowTimer', 'showTimerLabel', S.state.options.showTimer);
    ensureTimerTicking();
  }

  /* ---------- Practice clock (header) ---------- */
  /* Two halves that must not drift apart: `updateSessionTimer()` paints
     the number, and `ensureTimerTicking()` decides whether anything is
     asking for it to change. Turning the setting off stops the interval
     outright rather than leaving it running behind a hidden element —
     a clock nobody can see is a clock that should not be running.

     The seconds come from App.feedback.practiceSeconds(), the same
     counter that decides when the rest reminder speaks, so the number on
     screen is the number the reminder is waiting on. */
  var timerIntervalId = null;

  function paintSessionTimer() {
    var el = $('#sessionTimer');
    if (!el) return;
    if (!S.state.options.showTimer) {
      el.classList.add('hidden');
      el.textContent = '';
      el.removeAttribute('aria-label');
      return;
    }
    var minutes = Math.floor(App.feedback.practiceSeconds() / 60);
    el.classList.remove('hidden');
    el.textContent = App.i18n.t('sessionTimerValue').replace('{n}', minutes);
    el.setAttribute('aria-label',
      App.i18n.t('sessionTimerAria').replace('{n}', minutes));
  }

  function ensureTimerTicking() {
    /* Paint first, always — including when the setting is off, because
       the "off" branch of paintSessionTimer() is what takes the clock off
       the screen. Returning before it left the last number painted: the
       option and aria-pressed said off while the header still showed the
       clock, because only the way *up* had been implemented. */
    paintSessionTimer();
    if (!S.state.options.showTimer) {
      if (timerIntervalId !== null) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
      }
      return;
    }
    if (timerIntervalId === null) {
      timerIntervalId = setInterval(paintSessionTimer, 1000);
    }
  }

  /* ---------- Settings side drawer ---------- */
  var settingsTrigger = null;

  function focusableSettingsElements() {
    return $$('#settingsDrawer button, #settingsDrawer [href], #settingsDrawer input, #settingsDrawer select, #settingsDrawer textarea')
      .filter(function (el) { return !el.disabled; });
  }

  function settingsOpen() {
    return !$('#settingsDrawer').hidden;
  }

  function openSettings() {
    settingsTrigger = document.activeElement;
    var backdrop = $('#settingsBackdrop');
    var drawer = $('#settingsDrawer');
    backdrop.hidden = false;
    drawer.hidden = false;
    requestAnimationFrame(function () {
      backdrop.classList.add('visible');
      drawer.classList.add('open');
    });
    $('#btnOpenSettings').setAttribute('aria-expanded', 'true');
    $('#btnCloseSettings').focus();
    applyOptions();
  }

  function closeSettings() {
    var backdrop = $('#settingsBackdrop');
    var drawer = $('#settingsDrawer');
    backdrop.classList.remove('visible');
    drawer.classList.remove('open');
    $('#btnOpenSettings').setAttribute('aria-expanded', 'false');
    var hide = function () { backdrop.hidden = true; drawer.hidden = true; };
    if (App.utils.reducedMotion()) hide();
    else setTimeout(hide, 250);
    if (settingsTrigger) settingsTrigger.focus();
  }

  /* Keeps Tab/Shift+Tab cycling inside the open drawer (basic focus
     trap -- accessibility rule: complete keyboard navigation). */
  function handleDrawerTab(e) {
    if (e.key !== 'Tab') return;
    var focusable = focusableSettingsElements();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#btnOpenSettings')) { openSettings(); return; }
    if (e.target.closest('#btnCloseSettings')) { closeSettings(); return; }
    if (e.target === $('#settingsBackdrop')) { closeSettings(); return; }

    var bTextSize = e.target.closest('.btn-text-size');
    if (bTextSize) { S.state.options.textSize = bTextSize.dataset.textSize; T.save(); applyOptions(); return; }

    var bTheme = e.target.closest('.btn-theme');
    if (bTheme) { S.state.options.theme = bTheme.dataset.theme; T.save(); applyOptions(); return; }

    if (e.target.closest('#btnHideLegend')) { S.state.options.hideLegend = !S.state.options.hideLegend; T.save(); applyOptions(); return; }
    if (e.target.closest('#btnHideNumpad')) { S.state.options.hideNumpad = !S.state.options.hideNumpad; T.save(); applyOptions(); return; }
    if (e.target.closest('#btnDimCelebration')) { S.state.options.dimCelebration = !S.state.options.dimCelebration; T.save(); applyOptions(); return; }
    if (e.target.closest('#btnKeySound')) { S.state.options.keySound = !S.state.options.keySound; T.save(); applyOptions(); return; }
    if (e.target.closest('#btnErrorSound')) { S.state.options.errorSound = !S.state.options.errorSound; T.save(); applyOptions(); return; }
    if (e.target.closest('#btnFingerText')) { S.state.options.showFingerText = !S.state.options.showFingerText; T.save(); applyOptions(); return; }
    if (e.target.closest('#btnShowTimer')) { S.state.options.showTimer = !S.state.options.showTimer; T.save(); applyOptions(); return; }
  });

  /* ---------- Rest reminder number box ---------- */
  /* A number box, not a menu, so any whole number of minutes goes.
     It is read on 'change' and not on 'input': that is the moment the
     number is finished (leaving the field, pressing an arrow, or
     Enter), so a half-typed "1" on the way to "15" is never stored and
     never clamped under the person's fingers. An empty or nonsensical
     field falls back to the interval already in use, and applyOptions
     writes back whatever the normaliser decided, so the box always
     shows a usable value. */
  (function () {
    var restInput = $('#restMinutesInput');
    if (!restInput) return;
    restInput.addEventListener('change', function () {
      var value = App.feedback.normaliseRestMinutes(restInput.value);
      if (value === S.state.options.restMinutes) {
        restInput.value = String(value);
        return;
      }
      S.state.options.restMinutes = value;
      T.save();
      applyOptions();
    });

    /* The ▲/▼ pair. Each press is one minute and is saved straight
       away, like the arrows of the native stepper would; stepping from
       what is in the field (or from the interval in use when the field
       is empty) and letting the normaliser clamp keeps both ways of
       changing it on the same rule. */
    function step(delta) {
      var from = restInput.value === '' ? S.state.options.restMinutes : Number(restInput.value);
      if (!isFinite(from)) from = S.state.options.restMinutes;
      var value = App.feedback.normaliseRestMinutes(Math.round(from) + delta);
      restInput.value = String(value);
      if (value === S.state.options.restMinutes) return;
      S.state.options.restMinutes = value;
      T.save();
      applyOptions();
    }
    var up = $('#restMinutesUp');
    var down = $('#restMinutesDown');
    if (up) up.addEventListener('click', function () { step(1); });
    if (down) down.addEventListener('click', function () { step(-1); });
  }());

  T.applyOptions = applyOptions;
  T.closeSettings = closeSettings;
  T.handleDrawerTab = handleDrawerTab;
  T.settingsOpen = settingsOpen;
})(window.Teclatlon);
