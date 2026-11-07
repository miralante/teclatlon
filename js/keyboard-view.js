/* ==========================================================================
   Teclatlon — On-screen keyboard and hand guide. Visual only, never tappable.
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

  function fingerOf(ch, inNumpad) {
    if (!ch) return null;
    if (ch === ' ') return 'th';
    if (inNumpad) return DATA.numpadFingers[ch] || null;
    var rows = T.physicalRows();
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
    if (S.game && S.game.cfg && S.game.cfg.mode === 'numbers') return 0;
    var rows = T.physicalRows();
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
      renderRows(c, T.visibleRows());
    });
    $$('.numpad-inline').forEach(function (c) {
      c.classList.toggle('hidden', !T.isExtended());
      renderRows(c, DATA.numpad);
    });
    $$('.keyboard, .numpad, .numpad-inline, .hands').forEach(function (c) {
      c.classList.toggle('color-fingers', S.state.options.color === 'fingers');
      c.classList.toggle('color-hands', S.state.options.color === 'hands');
    });
    updateOptionsUI();
    /* Recompute the whole guide (not just markTarget): switching
       keyboard type mid-game doesn't change fingers today (only
       "simple/normal/extended" are physical layouts), but keeps the
       guide consistent if a layout ever changes finger mapping. */
    if (S.game && S.game.type === 'seq') T.updateGuide();
    if (S.game && S.game.type === 'challenge') T.reapplyChallenge();
  }

  function updateOptionsUI() {
    $$('.btn-keyboard').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.keyboard === S.state.options.keyboard));
    });
    $$('.btn-layout').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.layout === S.state.options.layout));
    });
    $$('.btn-color').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.color === S.state.options.color));
    });
    $$('.keyboard-legend').forEach(function (l) {
      l.textContent = App.i18n.t(S.state.options.color === 'fingers' ? 'legendFingers' : 'legendHands');
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
    $('#guideText').classList.toggle('hidden', !S.state.options.showFingerText);
  }

  T.fingerOf = fingerOf;
  T.flashKey = flashKey;
  T.handsSVG = handsSVG;
  T.keysOf = keysOf;
  T.markTarget = markTarget;
  T.oppositeShiftSide = oppositeShiftSide;
  T.panOf = panOf;
  T.renderHands = renderHands;
  T.renderKeyboards = renderKeyboards;
  T.renderRows = renderRows;
})(window.Teclatlon);
