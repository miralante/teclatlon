/* ==========================================================================
   Teclatlon — Logic
   Learn to type on the computer's physical keyboard.
   The on-screen keyboard is VISUAL only (not tappable): it shows the
   target key, reflects each keystroke, and colours keys by hand or
   by finger (touch-typing method with F/J home-row landmarks).
   Requires assets/js (App.utils, App.tts, App.storage, App.feedback) and data.js.
   ========================================================================== */
(function () {
  'use strict';

  var $ = App.utils.$;
  var $$ = App.utils.$$;
  var SLUG = 'keyboard';
  var SCREENS = ['screenName', 'screenMenu', 'screenLessons', 'screenTemplates', 'screenGame', 'screenFree'];
  /* Screens that render an on-screen keyboard and therefore need the
     keyboard-view selector (.keyboard-options--header) visible. The
     menu, lessons and templates lists don't show a keyboard, so the
     selector is hidden on those to avoid dangling controls with no
     keyboard to apply them to. Keep this list explicit rather than
     inferred from screen contents so a new list-only screen stays
     selector-less by default. */
  var SCREENS_WITH_KEYBOARD = ['screenName', 'screenGame', 'screenFree'];

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
        focusMode: o.foco, spatialSound: o.espacial, metrics: o.metricas
      };
    }
    delete raw.nombre; delete raw.estrellas; delete raw.completado; delete raw.opciones;
    return raw;
  }

  var state = migrateLegacyState(App.storage.get(SLUG));
  state.name = typeof state.name === 'string' ? state.name : '';
  state.stars = state.stars || 0;
  state.completed = state.completed || {};
  state.options = state.options || {};
  if (!DATA.layouts[state.options.keyboard]) {
    state.options.keyboard = 'simple';
  }
  if (state.options.color !== 'fingers') state.options.color = 'hands';
  if (['auto', 'light', 'dark', 'contrast'].indexOf(state.options.theme) === -1) state.options.theme = 'light';
  if (['small', 'normal', 'large', 'huge'].indexOf(state.options.textSize) === -1) state.options.textSize = 'normal';
  state.options.focusMode = !!state.options.focusMode;
  state.options.spatialSound = !!state.options.spatialSound;
  state.options.metrics = !!state.options.metrics;

  function save() { App.storage.set(SLUG, state); }

  /* Persist the migrated (English-keyed) shape to localStorage right
     away. feedback.js reads localStorage directly and independently
     of this module's in-memory state, so without this, a legacy
     Spanish-keyed save (e.g. opciones.espacial) would still be on
     disk -- and misread as "off" -- for every action before the next
     save() call this session happens to trigger. */
  save();

  /* In-progress game. null outside screenGame.
     type 'seq': { cfg: { mode, title, steps, starKey, onFinish }, idx, pos, waiting }
     type 'challenge': { set: { ch: true } } */
  var game = null;

  function capitalize(name) {
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
  }

  function finalMessage() {
    return state.name
      ? App.i18n.t('wellDoneWithName').replace('{name}', capitalize(state.name))
      : App.i18n.t('wellDone');
  }

  /* Closing line for the meaningful-learning anchor: connects the
     exercise to writing real messages on a real computer. Appended to
     the celebration overlay itself, since this activity has no
     separate "round complete" screen to hold it. */
  function celebrateWithTransfer(after) {
    App.feedback.celebrate(finalMessage() + ' ' + App.i18n.t('transferMessage'), after);
  }

  function updateStars() {
    $('#stars').textContent = '⭐ ' + state.stars;
  }

  function award(key) {
    if (!state.completed[key]) {
      state.completed[key] = true;
      state.stars += 1;
      save();
      updateStars();
    }
  }

  /* ---------- Key data ---------- */
  function visibleRows() {
    return DATA.layouts[state.options.keyboard] || DATA.layouts.simple;
  }

  function isExtended() {
    return state.options.keyboard === 'extended';
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
     Shift (see expectedBaseChar()). */
  function stripAccents(s) {
    return (s && s.normalize) ? s.normalize('NFD').replace(/[̀-ͯ]/g, '') : s;
  }

  function fingerOf(ch, inNumpad) {
    if (!ch) return null;
    if (ch === ' ') return 'th';
    if (inNumpad) return DATA.numpadFingers[ch] || null;
    var rows = [DATA.numberRow].concat(DATA.rows);
    for (var i = 0; i < rows.length; i++) {
      for (var j = 0; j < rows[i].length; j++) {
        if (rows[i][j].ch === ch) return rows[i][j].finger;
      }
    }
    return null;
  }

  /* Stereo pan for the spatial-sound option (-1 = full left, +1 = full
     right). Computed from the key's column within its row so the
     success tone comes from the same side as the key the player just
     hit. The numpad is intentionally excluded (no horizontal spread
     to speak of) and returns 0 (centre). */
  function panOf(ch) {
    if (!ch) return 0;
    if (game && game.cfg && game.cfg.mode === 'numbers') return 0;
    var rows = [DATA.numberRow].concat(DATA.rows);
    for (var i = 0; i < rows.length; i++) {
      var typeable = rows[i].filter(function (k) { return !!k.ch; });
      if (typeable.length < 2) continue;
      for (var j = 0; j < typeable.length; j++) {
        if (typeable[j].ch === ch) {
          return (j / (typeable.length - 1)) * 2 - 1;
        }
      }
    }
    return 0;
  }

  /* ---------- Visual keyboard (never clickable: pointer-events none) ---------- */
  function createKey(k) {
    var d = document.createElement('div');
    var hand = k.finger === 'th' ? 'both' : (k.finger.charAt(0) === 'l' ? 'left' : 'right');
    var widthClass = k.wide === true ? ' wide' : (k.wide === 'media' ? ' medium' : '');
    d.className = 'key f-' + k.finger + ' h-' + hand + widthClass + (k.decor ? ' decorative' : '');
    if (k.ch) d.dataset.ch = k.ch;
    d.textContent = k.label ? App.i18n.t('keyLabel.' + k.label) : k.ch;
    if (k.bump) {
      var m = document.createElement('span');
      m.className = 'mark';
      d.appendChild(m);
    }
    return d;
  }

  function renderRows(cont, rows) {
    cont.innerHTML = '';
    rows.forEach(function (row) {
      var f = document.createElement('div');
      f.className = 'row-keys';
      row.forEach(function (k) { f.appendChild(createKey(k)); });
      cont.appendChild(f);
    });
  }

  function renderKeyboards() {
    $$('.keyboard').forEach(function (c) {
      renderRows(c, visibleRows());
    });
    $$('.numpad-inline').forEach(function (c) {
      c.classList.toggle('hidden', !isExtended());
      renderRows(c, DATA.numpad);
    });
    $$('.keyboard, .numpad, .numpad-inline, .hands').forEach(function (c) {
      c.classList.toggle('color-fingers', state.options.color === 'fingers');
      c.classList.toggle('color-hands', state.options.color === 'hands');
    });
    updateOptionsUI();
    /* Recompute the whole guide (not just markTarget): switching
       keyboard type mid-game doesn't change fingers today (only
       "simple/normal/extended" are physical layouts), but keeps the
       guide consistent if a layout ever changes finger mapping. */
    if (game && game.type === 'seq') updateGuide();
    if (game && game.type === 'challenge') reapplyChallenge();
  }

  function updateOptionsUI() {
    $$('.btn-keyboard').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.keyboard === state.options.keyboard));
    });
    var detailKey = ({
      simple: 'btnSimpleDetail',
      normal: 'btnNormalDetail',
      extended: 'btnExtendedDetail'
    })[state.options.keyboard];
    $$('.keyboard-detail').forEach(function (p) {
      p.textContent = detailKey ? App.i18n.t(detailKey) : '';
    });
    $$('.btn-color').forEach(function (b) {
      b.setAttribute('aria-pressed', String(state.options.color === 'fingers'));
      b.textContent = App.i18n.t(state.options.color === 'fingers' ? 'btnColorsFingers' : 'btnColorsHands');
    });
    $$('.keyboard-legend').forEach(function (l) {
      l.textContent = App.i18n.t(state.options.color === 'fingers' ? 'legendFingers' : 'legendHands');
    });
  }

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
    if (state.options.theme === 'auto') html.removeAttribute('data-theme');
    else html.setAttribute('data-theme', state.options.theme);
    if (state.options.textSize === 'normal') html.removeAttribute('data-text-size');
    else html.setAttribute('data-text-size', state.options.textSize);
    html.classList.toggle('focus-mode', state.options.focusMode);

    $$('.btn-text-size').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.textSize === state.options.textSize));
    });
    $$('.btn-theme').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.theme === state.options.theme));
    });
    updateSettingsButton('#btnFocusMode', 'focusModeLabel', state.options.focusMode);
    updateSettingsButton('#btnSpatialSound', 'spatialSoundLabel', state.options.spatialSound);
    updateSettingsButton('#btnMetrics', 'metricsLabel', state.options.metrics);
    updateLiveMetrics();
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
    if (bTextSize) { state.options.textSize = bTextSize.dataset.textSize; save(); applyOptions(); return; }

    var bTheme = e.target.closest('.btn-theme');
    if (bTheme) { state.options.theme = bTheme.dataset.theme; save(); applyOptions(); return; }

    if (e.target.closest('#btnFocusMode')) { state.options.focusMode = !state.options.focusMode; save(); applyOptions(); return; }
    if (e.target.closest('#btnSpatialSound')) { state.options.spatialSound = !state.options.spatialSound; save(); applyOptions(); return; }
    if (e.target.closest('#btnMetrics')) { state.options.metrics = !state.options.metrics; save(); applyOptions(); return; }
  });

  /* ---------- Live metrics (accuracy and speed) ---------- */
  function startMetrics() {
    state.metrics = { keys: 0, hits: 0, misses: 0, startMs: Date.now() };
    updateLiveMetrics();
  }

  function updateLiveMetrics() {
    var zone = $('#liveMetrics');
    if (!state.options.metrics || !game || !state.metrics) {
      zone.classList.add('hidden');
      return;
    }
    zone.classList.remove('hidden');
    var m = state.metrics;
    var accuracy = m.keys ? Math.round((m.hits / m.keys) * 100) : 100;
    var minutes = Math.max((Date.now() - m.startMs) / 60000, 1 / 60);
    var kpm = Math.round(m.keys / minutes);
    zone.innerHTML = '';
    [
      App.i18n.t('accuracyShort').replace('{n}', accuracy),
      App.i18n.t('keysPerMinuteShort').replace('{n}', kpm)
    ].forEach(function (text) {
      var pill = document.createElement('span');
      pill.className = 'live-metric';
      pill.textContent = text;
      zone.appendChild(pill);
    });
  }

  function keysOf(ch) {
    if (!ch || ch === '"') return [];
    return $$('.key[data-ch="' + ch + '"]');
  }

  function flashKey(ch, down) {
    keysOf(ch).forEach(function (t) { t.classList.toggle('pressed', down); });
    if (down) {
      setTimeout(function () {
        keysOf(ch).forEach(function (t) { t.classList.remove('pressed'); });
      }, 600);
    }
  }

  function markTarget(ch) {
    $$('.key.target').forEach(function (t) { t.classList.remove('target'); });
    keysOf(ch).forEach(function (t) { t.classList.add('target'); });
  }

  /* Touch-typing convention for capitals: hold Shift with the pinky
     on the side OPPOSITE the letter being typed, so the typing hand
     never leaves the home row. Returns the finger id of that pinky
     ('lp'/'rp'), or null when the base finger doesn't have an
     opposite pinky to speak of (thumb/space, unknown key). */
  function oppositeShiftSide(finger) {
    if (!finger || finger === 'th') return null;
    return finger.charAt(0) === 'l' ? 'rp' : 'lp';
  }

  /* ---------- Hand guide ---------- */
  function handsSVG(active, activeShift) {
    function finger(f, x, y, h) {
      var classes = 'finger f-' + f + (active === f ? ' active' : '') + (activeShift === f ? ' active-shift' : '');
      return '<rect class="' + classes + '" x="' + x + '" y="' + y + '" width="32" height="' + h + '" rx="15"/>';
    }
    function thumb(x) {
      var act = (active === 'th') ? ' active' : '';
      return '<rect class="finger f-th' + act + '" x="' + x + '" y="112" width="42" height="28" rx="14"/>';
    }
    return '<svg viewBox="0 0 405 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      finger('lp', 0, 48, 60) + finger('lr', 38, 26, 82) + finger('lm', 76, 16, 92) + finger('li', 114, 26, 82) +
      '<rect class="palm" x="0" y="96" width="146" height="70" rx="22"/>' + thumb(147) +
      thumb(216) + finger('ri', 259, 26, 82) + finger('rm', 297, 16, 92) + finger('rr', 335, 26, 82) + finger('rp', 373, 48, 60) +
      '<rect class="palm" x="259" y="96" width="146" height="70" rx="22"/>' +
      '<text x="73" y="192">' + App.i18n.t('leftLabel') + '</text>' +
      '<text x="332" y="192">' + App.i18n.t('rightLabel') + '</text>' +
      '</svg>';
  }

  function renderHands(finger, shiftFinger) {
    $('#handsSvg').innerHTML = handsSVG(finger, shiftFinger);
    var text;
    if (finger === 'th') text = App.i18n.t('thumbText');
    else if (finger) {
      text = App.i18n.t('handFingerText')
        .replace('{hand}', App.i18n.t('finger.' + finger + '.hand'))
        .replace('{finger}', App.i18n.t('finger.' + finger + '.name'));
      if (shiftFinger) text += ' ' + App.i18n.t('shiftText').replace('{hand}', App.i18n.t('finger.' + shiftFinger + '.hand'));
    }
    else text = App.i18n.t('findKey');
    $('#guideText').textContent = text;
  }

  /* ---------- Screens ---------- */
  function showScreen(id) {
    SCREENS.forEach(function (p) {
      var el = document.getElementById(p);
      if (!el) return;
      el.classList.toggle('hidden', p !== id);
      el.setAttribute('aria-hidden', p !== id ? 'true' : 'false');
    });
    var withKb = SCREENS_WITH_KEYBOARD.indexOf(id) !== -1;
    $$('.keyboard-options--header').forEach(function (row) {
      row.classList.toggle('hidden', !withKb);
    });
  }

  function goMenu() {
    renderMenu();
    showScreen('screenMenu');
  }

  function goLessons() {
    renderLessons();
    showScreen('screenLessons');
  }

  function goName() {
    $('#inputName').value = state.name;
    $('#nameNotice').textContent = '';
    showScreen('screenName');
    $('#inputName').focus();
  }

  function goFree() {
    showScreen('screenFree');
    $('#freeArea').focus();
  }

  function lessons() { return DATA.lessons[App.i18n.locale()] || DATA.lessons.es; }
  function templates() { return DATA.templates[App.i18n.locale()] || DATA.templates.es; }

  function renderMenu() {
    $('#greeting').textContent = state.name
      ? App.i18n.t('greetingWithName').replace('{name}', capitalize(state.name))
      : App.i18n.t('greetingHello');
    var allLessons = lessons();
    var done = allLessons.filter(function (l) { return state.completed[l.id]; }).length;
    var allTemplates = templates();
    var doneTemplates = allTemplates.filter(function (p) { return state.completed['template_' + p.id]; }).length;
    $$('.mode-card').forEach(function (t) {
      var badge = t.querySelector('.done');
      var m = t.dataset.mode;
      if (m === 'lessons') badge.textContent = done > 0 ? App.i18n.t('doneOfTotal').replace('{done}', done).replace('{total}', allLessons.length) : '';
      else if (m === 'templates') badge.textContent = doneTemplates > 0 ? App.i18n.t('doneOfTotal').replace('{done}', doneTemplates).replace('{total}', allTemplates.length) : '';
      else badge.textContent = state.completed[m] ? '⭐' : '';
    });
    updateStars();
  }

  function renderLessons() {
    var container = $('#lessonsList');
    container.innerHTML = '';
    var allLessons = lessons();
    allLessons.forEach(function (l, i) {
      var unlocked = i === 0 || !!state.completed[allLessons[i - 1].id];
      var done = !!state.completed[l.id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-lesson' + (done ? ' done' : '') + (!unlocked ? ' locked' : '');
      var num = document.createElement('span');
      num.className = 'num';
      num.textContent = String(i + 1);
      var titleEl = document.createElement('span');
      titleEl.className = 'title';
      titleEl.textContent = l.title;
      var statusEl = document.createElement('span');
      statusEl.setAttribute('aria-hidden', 'true');
      statusEl.textContent = done ? '⭐' : (unlocked ? '' : '🔒');
      b.appendChild(num); b.appendChild(titleEl); b.appendChild(statusEl);
      if (unlocked) {
        b.addEventListener('click', function () { playLesson(l); });
      } else {
        b.disabled = true;
        b.setAttribute('aria-label', App.i18n.t('lessonLockedAria').replace('{n}', i + 1));
      }
      container.appendChild(b);
    });
  }

  /* "Real texts" (templates): unlike renderLessons(), every entry
     is always open -- these are independent practice texts, not a
     graded, linearly-unlocked curriculum. */
  function renderTemplates() {
    var container = $('#templatesList');
    container.innerHTML = '';
    templates().forEach(function (p, i) {
      var done = !!state.completed['template_' + p.id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-lesson' + (done ? ' done' : '');
      var num = document.createElement('span');
      num.className = 'num';
      num.textContent = String(i + 1);
      var titleEl = document.createElement('span');
      titleEl.className = 'title';
      titleEl.textContent = p.title;
      var statusEl = document.createElement('span');
      statusEl.setAttribute('aria-hidden', 'true');
      statusEl.textContent = done ? '⭐' : '';
      b.appendChild(num); b.appendChild(titleEl); b.appendChild(statusEl);
      b.addEventListener('click', function () { playTemplate(p); });
      container.appendChild(b);
    });
  }

  function goTemplates() {
    renderTemplates();
    showScreen('screenTemplates');
  }

  /* ---------- Sequence engine ---------- */
  function startSequence(cfg) {
    game = { type: 'seq', cfg: cfg, idx: 0, pos: 0, waiting: false };
    $('#gameTitle').textContent = cfg.title;
    var inNumpad = cfg.mode === 'numbers';
    $('#keyboardPanel').classList.toggle('hidden', inNumpad);
    $('#numpadPanel').classList.toggle('hidden', !inNumpad);
    $('#targetZone').classList.remove('hidden');
    $('#challengeZone').classList.add('hidden');
    $('#guide').classList.remove('hidden');
    clearFeedback();
    startMetrics();
    showScreen('screenGame');
    loadStep();
  }

  function currentStep() { return game.cfg.steps[game.idx]; }

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
    return (p && !isSpecialStep(p)) ? p.seq[game.pos] : null;
  }

  function loadStep() {
    game.pos = 0;
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
    var compact = game.cfg.mode === 'template';
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
      s.className = 'letter' + (i < game.pos ? ' done' : (i === game.pos ? ' current' : ''));
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
    return ch ? stripAccents(ch.toLowerCase()) : null;
  }

  function expectedShift() {
    var ch = expectedChar();
    return !!ch && ch !== ch.toLowerCase();
  }

  function updateGuide() {
    if (isSpecialStep(currentStep())) {
      markTarget(currentStep().specialKey);
      renderHands(null, null);
      return;
    }
    var base = expectedBaseChar();
    var finger = fingerOf(base, game.cfg.mode === 'numbers');
    markTarget(base);
    renderHands(finger, expectedShift() ? oppositeShiftSide(finger) : null);
  }

  function clearFeedback() {
    var f = $('#feedback');
    f.textContent = '';
    f.className = 'feedback';
  }

  function gameKey(ch, shiftHeld) {
    if (game.waiting) return;
    var p = currentStep();
    state.metrics.keys += 1;

    if (isSpecialStep(p)) {
      /* Single-action step: no character sequence to walk through,
         it's done as soon as the right key is detected. */
      if (ch === p.specialKey) {
        state.metrics.hits += 1;
        updateLiveMetrics();
        stepCompleted(ch);
      } else {
        state.metrics.misses += 1;
        updateLiveMetrics();
        App.feedback.encourage($('#feedback'));
      }
      return;
    }

    var seq = p.seq;
    var expected = seq[game.pos];
    var needsShift = expected !== expected.toLowerCase();
    /* Lowercase steps don't check the Shift state at all -- an
       accidentally-held Shift key while typing a lowercase letter
       still counts as correct, matching the app's general policy of
       not penalising things the exercise didn't ask about. */
    if (ch === expected.toLowerCase() && (!needsShift || shiftHeld)) {
      state.metrics.hits += 1;
      game.pos += 1;
      renderTarget();
      updateLiveMetrics();
      if (game.pos >= seq.length) stepCompleted(ch);
      else updateGuide();
    } else {
      state.metrics.misses += 1;
      updateLiveMetrics();
      keysOf(ch).forEach(function (t) {
        t.classList.add('miss');
        setTimeout(function () { t.classList.remove('miss'); }, 500);
      });
      App.feedback.encourage($('#feedback'));
    }
  }

  function stepCompleted(lastCh) {
    game.waiting = true;
    markTarget(null);
    /* The success tone for the last key of the step is panned to that
       key's column (spatial-sound option). Earlier keystrokes inside
       the same step are silent in feedback.js; only the step-complete
       "ding" is panned. */
    App.feedback.success($('#feedback'), panOf(lastCh));
    setTimeout(function () {
      if (!game) return;
      game.waiting = false;
      game.idx += 1;
      if (game.idx >= game.cfg.steps.length) {
        endSequence();
      } else {
        clearFeedback();
        loadStep();
      }
    }, 1000);
  }

  function endSequence() {
    var cfg = game.cfg;
    game = null;
    award(cfg.starKey);
    celebrateWithTransfer(cfg.onFinish);
  }

  /* ---------- Game modes ---------- */
  function playPosition() {
    startSequence({
      mode: 'placement', title: App.i18n.t('modePlacementName'),
      steps: DATA.placement[App.i18n.locale()] || DATA.placement.es,
      starKey: 'placement', onFinish: goMenu
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
    var allLessons = lessons();
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
    var typeable = typeableKeys(visibleRows());
    var parts = [];
    visibleRows().forEach(function (row) {
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
    startSequence({
      mode: 'lesson', title: App.i18n.t('lessonTitle').replace('{title}', l.title),
      steps: steps, starKey: l.id, onFinish: goLessons
    });
  }

  /* Returns true if EVERY character of `seq` is in the `target` set
     (typeable characters of the active layout). Filters out
     candidates whose `seq` uses keys not available in the current
     layout (e.g. a sentence with "1" in the "simple" layout) so
     coverage is computed only over keys that are actually typeable. */
  function seqFitsLayout(seq, target) {
    for (var i = 0; i < seq.length; i++) {
      if (!target[seq[i]]) return false;
    }
    return true;
  }

  /* Counts the per-key presses (including space) that `seq` would add
     to the running `coverage` accumulator. Used to score candidates
     in the greedy algorithm. */
  function scoreSeq(seq, coverage, target, deficit) {
    var total = 0;
    for (var i = 0; i < seq.length; i++) {
      var ch = seq[i];
      if (!target[ch]) continue;
      if (deficit[ch] > 0) total += deficit[ch];
    }
    return total;
  }

  /* Picks a set of words from the bank that covers every key of the
     active layout at least `minimum` times, with a `maximum` cap on
     word count so the round doesn't drag on. Strategy:
     1) filter out candidates whose characters don't fit the layout;
     2) start from an `initialCoverage` (typically the presses the
        player's name contributes if it enters as the first step);
     3) greedy loop: each iteration, compute the per-key deficit
        against coverage and pick the candidate that reduces it the
        most; break ties at random to vary the round;
     4) stop once every key reaches `minimum` or the `maximum` word
        cap is hit. If keys are still under-covered after the greedy
        loop (unlikely unless the bank is very small), nothing extra
        is done: the current bank covers all 31 keys with margin. */
  function pickWordSet(bank, target, initialCoverage, minimum, maximum) {
    var candidates = bank.filter(function (w) { return seqFitsLayout(w, target); });
    if (candidates.length === 0) return [];
    var chosen = [];
    var coverage = {};
    Object.keys(target).forEach(function (k) { coverage[k] = 0; });
    if (initialCoverage) {
      Object.keys(initialCoverage).forEach(function (k) {
        if (target[k]) coverage[k] = initialCoverage[k];
      });
    }

    function deficit() {
      var d = {};
      Object.keys(coverage).forEach(function (k) {
        d[k] = Math.max(0, minimum - coverage[k]);
      });
      return d;
    }

    function tryAdd(seq) {
      chosen.push(seq);
      for (var i = 0; i < seq.length; i++) {
        var ch = seq[i];
        if (target[ch]) coverage[ch] = (coverage[ch] || 0) + 1;
      }
    }

    /* Greedy: at each step, take every unused candidate, score it
       against the current deficit, group by the top score and pick
       one at random among the ties (so the round varies). Stop once
       every key reaches the minimum or the word cap is reached. */
    var used = {};
    var attempts = 0;
    var maxAttempts = candidates.length * 4;
    while (chosen.length < maximum && attempts < maxAttempts) {
      attempts++;
      var def = deficit();
      var totalDeficit = 0;
      Object.keys(def).forEach(function (k) { totalDeficit += def[k]; });
      if (totalDeficit === 0) break;
      var bestScore = -1;
      var best = [];
      for (var i = 0; i < candidates.length; i++) {
        var w = candidates[i];
        if (used[w]) continue;
        var s = scoreSeq(w, coverage, target, def);
        if (s > bestScore) { bestScore = s; best = [w]; }
        else if (s === bestScore) { best.push(w); }
      }
      if (best.length === 0 || bestScore <= 0) break;
      var picked = best[Math.floor(Math.random() * best.length)];
      used[picked] = true;
      tryAdd(picked);
    }
    return chosen;
  }

  function playWords() {
    /* Before: 4 random words. Now (SPEC principle 7, mastery of the
       full keyboard): we select a set from the bank that covers every
       key of the current layout at least 5 times, with a cap of 50
       words so the round isn't endless. Every round is different
       because the algorithm shuffles ties at random. */
    var MIN_PER_KEY = 5;
    var MAX_WORDS = 50;
    var baseTarget = typeableKeys(visibleRows());
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
    if (state.name) {
      var plainName = stripAccents(state.name.toLowerCase());
      if (seqFitsLayout(plainName, target)) {
        nameSeq = plainName;
        steps.push({ text: App.i18n.t('typeYourName'), seq: plainName });
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

    var chosen = pickWordSet(bank, target, initialCoverage, MIN_PER_KEY, MAX_WORDS);
    chosen.forEach(function (w) {
      steps.push({ text: App.i18n.t('typeTheWord'), seq: w });
    });

    startSequence({
      mode: 'words', title: App.i18n.t('modeWordsName'),
      steps: steps, starKey: 'words', onFinish: goMenu
    });
  }

  function playTemplate(p) {
    var steps = p.lines.map(function (line) {
      return { text: App.i18n.t('templateInstruction'), seq: line };
    });
    startSequence({
      mode: 'template', title: p.title,
      steps: steps, starKey: 'template_' + p.id, onFinish: goTemplates
    });
  }

  function playNumbers() {
    startSequence({
      mode: 'numbers', title: App.i18n.t('modeNumbersName'),
      steps: DATA.numpadSteps[App.i18n.locale()] || DATA.numpadSteps.es,
      starKey: 'numbers', onFinish: goMenu
    });
  }

  /* ---------- Challenge: all keys ---------- */
  function playChallenge() {
    game = { type: 'challenge', set: {} };
    $('#gameTitle').textContent = App.i18n.t('allKeysTitle');
    $('#gameInstruction').textContent = App.i18n.t('allKeysInstruction');
    $('#keyboardPanel').classList.remove('hidden');
    $('#numpadPanel').classList.add('hidden');
    $('#targetZone').classList.add('hidden');
    $('#challengeZone').classList.remove('hidden');
    $('#guide').classList.remove('hidden');
    clearFeedback();
    markTarget(null);
    $$('.key.done').forEach(function (t) { t.classList.remove('done'); });
    startMetrics();
    showScreen('screenGame');
    updateChallenge();
  }

  function challengeKey(ch) {
    var typeable = typeableKeys(visibleRows());
    if (!typeable[ch] || game.set[ch]) return;
    game.set[ch] = true;
    state.metrics.keys += 1;
    state.metrics.hits += 1;
    updateLiveMetrics();
    keysOf(ch).forEach(function (t) { t.classList.add('done'); });
    /* Quiet per-key ack: just the "ding" panned to that column.
       Avoids spamming success messages during the challenge but lets
       the spatial-sound option be audible. */
    App.feedback.successSound(panOf(ch));
    updateChallenge();
  }

  function reapplyChallenge() {
    Object.keys(game.set).forEach(function (ch) {
      keysOf(ch).forEach(function (t) { t.classList.add('done'); });
    });
    updateChallenge();
  }

  /* Pick the next key the player still has to press in the "all keys"
     challenge. Iteration is stable (layout row order) so the player
     sees a predictable left-to-right, top-to-bottom rhythm instead of
     a random-looking highlight jumping around. */
  function nextPendingKey() {
    var pending = null;
    visibleRows().forEach(function (f) {
      f.forEach(function (k) {
        if (!k.ch || k.special) return;
        if (game.set[k.ch]) return;
        if (!pending) pending = [];
        pending.push(k);
      });
    });
    return pending ? pending[0] : null;
  }

  /* Render the hand guide and the on-screen keyboard highlight for the
     next key still pending in the challenge. The marker reuses the
     same "target" class the rest of the modes use to light up the
     target key, so the visual cue is consistent across modes. */
  function challengeGuide() {
    var k = nextPendingKey();
    if (!k) {
      markTarget(null);
      $('#guideText').textContent = '';
      $('#handsSvg').innerHTML = handsSVG(null, null);
      return;
    }
    var ch = k.ch;
    var inNumpad = !!DATA.numpadFingers[ch];
    var finger = fingerOf(ch, inNumpad);
    markTarget(ch);
    renderHands(finger, null);
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
  }

  function updateChallenge() {
    var total = 0, done = 0;
    visibleRows().forEach(function (f) {
      f.forEach(function (k) {
        if (!k.ch || k.special) return;
        total += 1;
        if (game.set[k.ch]) done += 1;
      });
    });
    $('#challengeFill').style.width = (total ? Math.round(done / total * 100) : 0) + '%';
    $('#challengeText').textContent = App.i18n.t('doneOfTotal').replace('{done}', done).replace('{total}', total);
    if (total > 0 && done === total) {
      game = null;
      /* Clear the next-key highlight and the hand guide so the
         completion feedback doesn't leave a stale "press X" prompt
         on screen while the success banner shows. */
      markTarget(null);
      $('#guideText').textContent = '';
      $('#handsSvg').innerHTML = handsSVG(null, null);
      award('allKeys');
      celebrateWithTransfer(goMenu);
      return;
    }
    challengeGuide();
  }

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
    if (settingsOpen()) {
      if (e.key === 'Escape') closeSettings();
      else handleDrawerTab(e);
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var ch = normalizeKey(e.key);
    if (!ch) return;
    flashKey(stripAccents(ch), true);
    var focused = document.activeElement;
    if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) return;
    if (!game) return;
    e.preventDefault();
    if (e.repeat) return;
    if (game.type === 'challenge') challengeKey(ch);
    else gameKey(ch, e.shiftKey);
  });

  document.addEventListener('keyup', function (e) {
    var ch = normalizeKey(e.key);
    if (ch) flashKey(stripAccents(ch), false);
  });

  /* ---------- Keyboard options (delegation: there are several panels) ---------- */
  document.addEventListener('click', function (e) {
    var bt = e.target.closest('.btn-keyboard');
    if (bt) {
      state.options.keyboard = bt.dataset.keyboard;
      save();
      renderKeyboards();
      return;
    }
    var bc = e.target.closest('.btn-color');
    if (bc) {
      state.options.color = state.options.color === 'hands' ? 'fingers' : 'hands';
      save();
      renderKeyboards();
    }
  });

  /* ---------- Name ---------- */
  function saveName() {
    var v = $('#inputName').value.trim().slice(0, 20);
    state.name = v;
    save();
    /* Audio only plays if the user taps the "Listen" button (btnListenName) */
    goMenu();
  }

  $('#btnSaveName').addEventListener('click', saveName);
  $('#btnSkipName').addEventListener('click', function () {
    state.name = '';
    save();
    goMenu();
  });
  $('#inputName').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveName();
    }
  });
  $('#btnListenName').addEventListener('click', function () {
    App.tts.speak($('#nameText').textContent + App.i18n.t('listenNameExtra'));
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
    App.storage.remove(SLUG);
    state = {
      name: '', stars: 0, completed: {},
      options: {
        keyboard: 'simple', color: 'hands', theme: 'auto', textSize: 'normal',
        focusMode: false, spatialSound: false, metrics: false
      }
    };
    save();
    btn.textContent = App.i18n.t('btnClearProgress');
    $('#inputName').value = '';
    $('#nameNotice').textContent = App.i18n.t('clearedNotice');
    renderKeyboards();
    applyOptions();
    updateStars();
    /* Re-render the menu so the per-mode completion badges (the
       ⭐ on each .mode-card) and the header greeting clear as
       well. Without this they stay in the DOM from the previous
       render, because we already cleared state but never asked the
       menu to repaint. */
    renderMenu();
  });

  /* ---------- Menu and navigation ---------- */
  $('#gameMenu').addEventListener('click', function (e) {
    var t = e.target.closest('.mode-card');
    if (!t) return;
    var m = t.dataset.mode;
    if (m === 'placement') playPosition();
    else if (m === 'lessons') goLessons();
    else if (m === 'words') playWords();
    else if (m === 'allKeys') playChallenge();
    else if (m === 'numbers') playNumbers();
    else if (m === 'free') goFree();
    else if (m === 'templates') goTemplates();
  });

  $('#btnListenGreeting').addEventListener('click', function () {
    App.tts.speak($('#greeting').textContent + ' ' + App.i18n.t('chooseGame'));
  });

  $('#btnChangeName').addEventListener('click', goName);
  $('#btnBackToMenu').addEventListener('click', goMenu);
  $('#btnBackToMenuTemplates').addEventListener('click', goMenu);

  $('#btnExitGame').addEventListener('click', function () {
    var mode = game && game.cfg ? game.cfg.mode : null;
    game = null;
    App.tts.stop();
    markTarget(null);
    if (mode === 'lesson') goLessons();
    else if (mode === 'template') goTemplates();
    else goMenu();
  });

  $('#btnListenGame').addEventListener('click', function () {
    var text = $('#gameTitle').textContent + '. ' + $('#gameInstruction').textContent;
    if (game && game.type === 'seq') text += ' ' + $('#guideText').textContent;
    App.tts.speak(text);
  });

  /* ---------- Free writing ---------- */
  $('#btnExitFree').addEventListener('click', goMenu);
  $('#btnListenFree').addEventListener('click', function () {
    var t = $('#freeArea').value.trim();
    App.tts.speak(t || App.i18n.t('nothingWrittenYet'));
  });
  $('#btnClearFree').addEventListener('click', function () {
    $('#freeArea').value = '';
    $('#freeArea').focus();
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
  renderRows($('#numpad'), DATA.numpad);
  renderKeyboards();
  applyOptions();
  updateStars();

  /* Boot: pick the right first screen. On a fresh install the
     user types their name; if they've been here before, the
     menu opens directly. */
  if (state.name) {
    goMenu();
  } else {
    goName();
  }
})();
