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
  var SCREENS = ['pantallaNombre', 'pantallaMenu', 'pantallaLecciones', 'pantallaPlantillas', 'pantallaJuego', 'pantallaLibre'];

  /* ---------- State and progress ---------- */
  var state = App.storage.get(SLUG);
  state.nombre = typeof state.nombre === 'string' ? state.nombre : '';
  state.estrellas = state.estrellas || 0;
  state.completado = state.completado || {};
  state.opciones = state.opciones || {};
  if (!DATA.layouts[state.opciones.teclado]) {
    state.opciones.teclado = 'simplificado';
  }
  if (state.opciones.color !== 'dedos') state.opciones.color = 'manos';
  if (['auto', 'claro', 'oscuro', 'contraste'].indexOf(state.opciones.tema) === -1) state.opciones.tema = 'claro';
  if (['chico', 'normal', 'grande', 'enorme'].indexOf(state.opciones.texto) === -1) state.opciones.texto = 'normal';
  state.opciones.foco = !!state.opciones.foco;
  state.opciones.espacial = !!state.opciones.espacial;
  state.opciones.metricas = !!state.opciones.metricas;

  function save() { App.storage.set(SLUG, state); }

  /* In-progress game. null outside pantallaJuego.
     type 'seq': { cfg: { mode, title, steps, starKey, onFinish }, idx, pos, waiting }
     type 'reto': { set: { ch: true } } */
  var game = null;

  function capitalize(nombre) {
    return nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : '';
  }

  function finalMessage() {
    return state.nombre
      ? App.i18n.t('muyBienNombre').replace('{nombre}', capitalize(state.nombre))
      : App.i18n.t('muyBien');
  }

  /* Closing line for the meaningful-learning anchor: connects the
     exercise to writing real messages on a real computer. Appended to
     the celebration overlay itself, since this activity has no
     separate "round complete" screen to hold it. */
  function celebrateWithTransfer(after) {
    App.feedback.celebrate(finalMessage() + ' ' + App.i18n.t('transferencia'), after);
  }

  function updateStars() {
    $('#stars').textContent = '⭐ ' + state.estrellas;
  }

  function award(key) {
    if (!state.completado[key]) {
      state.completado[key] = true;
      state.estrellas += 1;
      save();
      updateStars();
    }
  }

  /* ---------- Key data ---------- */
  function visibleRows() {
    return DATA.layouts[state.opciones.teclado] || DATA.layouts.simplificado;
  }

  function isExtended() {
    return state.opciones.teclado === 'extendido';
  }

  function typeableKeys(rows) {
    var out = {};
    rows.forEach(function (f) {
      /* k.special (Home/End/PageUp/PageDown/Delete, DATA.layouts.extendido)
         has a real 'ch' so the special-keys lesson can target it, but it's
         not part of the core alphanumeric layout this challenge covers. */
      f.forEach(function (k) { if (k.ch && !k.special) out[k.ch] = true; });
    });
    return out;
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
    if (game && game.cfg && game.cfg.mode === 'numeros') return 0;
    var rows = [DATA.numberRow].concat(DATA.rows);
    for (var i = 0; i < rows.length; i++) {
      var tipeables = rows[i].filter(function (k) { return !!k.ch; });
      if (tipeables.length < 2) continue;
      for (var j = 0; j < tipeables.length; j++) {
        if (tipeables[j].ch === ch) {
          return (j / (tipeables.length - 1)) * 2 - 1;
        }
      }
    }
    return 0;
  }

  /* ---------- Visual keyboard (never clickable: pointer-events none) ---------- */
  function createKey(k) {
    var d = document.createElement('div');
    var mano = k.finger === 'th' ? 'ambas' : (k.finger.charAt(0) === 'l' ? 'izq' : 'der');
    var ancho = k.wide === true ? ' ancha' : (k.wide === 'media' ? ' media' : '');
    d.className = 'tecla f-' + k.finger + ' m-' + mano + ancho + (k.decor ? ' decorativa' : '');
    if (k.ch) d.dataset.ch = k.ch;
    d.textContent = k.label ? App.i18n.t('teclaLabel.' + k.label) : k.ch;
    if (k.bump) {
      var m = document.createElement('span');
      m.className = 'marca';
      d.appendChild(m);
    }
    return d;
  }

  function renderRows(cont, rows) {
    cont.innerHTML = '';
    rows.forEach(function (row) {
      var f = document.createElement('div');
      f.className = 'row-teclas';
      row.forEach(function (k) { f.appendChild(createKey(k)); });
      cont.appendChild(f);
    });
  }

  function renderTeclados() {
    $$('.teclado').forEach(function (c) {
      renderRows(c, visibleRows());
    });
    $$('.numpad-inline').forEach(function (c) {
      c.classList.toggle('hidden', !isExtended());
      renderRows(c, DATA.numpad);
    });
    $$('.teclado, .numpad, .numpad-inline, .manos').forEach(function (c) {
      c.classList.toggle('color-dedos', state.opciones.color === 'dedos');
      c.classList.toggle('color-manos', state.opciones.color === 'manos');
    });
    updateOptionsUI();
    /* Recompute the whole guide (not just markTarget): switching
       keyboard type mid-game doesn't change fingers today (only
       "simple/normal/extended" are physical layouts), but keeps the
       guide consistent if a layout ever changes finger mapping. */
    if (game && game.type === 'seq') updateGuide();
    if (game && game.type === 'reto') reapplyChallenge();
  }

  function updateOptionsUI() {
    $$('.btn-teclado').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.teclado === state.opciones.teclado));
    });
    var detailKey = ({
      simplificado: 'btnSimpleDetalle',
      normal: 'btnNormalDetalle',
      extendido: 'btnExtendidoDetalle'
    })[state.opciones.teclado];
    $$('.detalle-teclado').forEach(function (p) {
      p.textContent = detailKey ? App.i18n.t(detailKey) : '';
    });
    $$('.btn-color').forEach(function (b) {
      b.setAttribute('aria-pressed', String(state.opciones.color === 'dedos'));
      b.textContent = App.i18n.t(state.opciones.color === 'dedos' ? 'btnColoresDedos' : 'btnColoresManos');
    });
    $$('.leyenda-teclado').forEach(function (l) {
      l.textContent = App.i18n.t(state.opciones.color === 'dedos' ? 'leyendaDedos' : 'leyendaManos');
    });
  }

  /* ---------- Ajustes de accesibilidad ---------- */
  function onOffLabel(key, active) {
    return App.i18n.t(key + (active ? 'On' : 'Off'));
  }

  function updateSettingsButton(id, key, active) {
    var b = $(id);
    b.setAttribute('aria-pressed', String(active));
    b.textContent = onOffLabel(key, active);
  }

  /* Applies state.opciones to the page (theme/text-size custom
     attributes on <html>, focus-mode class) and syncs every toggle
     button's aria-pressed + on/off label. Called at boot and after
     every settings change. The same tema/texto/foco attributes are
     set earlier, before first paint, by the inline script in
     index.html (reads localStorage directly) -- this just keeps
     everything consistent once app.js has taken over. */
  function applyOptions() {
    var html = document.documentElement;
    if (state.opciones.tema === 'auto') html.removeAttribute('data-tema');
    else html.setAttribute('data-tema', state.opciones.tema);
    if (state.opciones.texto === 'normal') html.removeAttribute('data-texto');
    else html.setAttribute('data-texto', state.opciones.texto);
    html.classList.toggle('modo-foco', state.opciones.foco);

    $$('.btn-texto-tam').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.text === state.opciones.texto));
    });
    $$('.btn-tema').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.tema === state.opciones.tema));
    });
    updateSettingsButton('#btnModoFoco', 'etiquetaModoFoco', state.opciones.foco);
    updateSettingsButton('#btnEspacial', 'etiquetaSonidoEspacial', state.opciones.espacial);
    updateSettingsButton('#btnMetricas', 'etiquetaMetricas', state.opciones.metricas);
    updateLiveMetrics();
  }

  /* ---------- Drawer lateral de ajustes ---------- */
  var disparadorAjustes = null;

  function focusableSettingsElements() {
    return $$('#drawerAjustes button, #drawerAjustes [href], #drawerAjustes input, #drawerAjustes select, #drawerAjustes textarea')
      .filter(function (el) { return !el.disabled; });
  }

  function settingsOpen() {
    return !$('#drawerAjustes').hidden;
  }

  function openSettings() {
    disparadorAjustes = document.activeElement;
    var fondo = $('#fondoAjustes');
    var drawer = $('#drawerAjustes');
    fondo.hidden = false;
    drawer.hidden = false;
    requestAnimationFrame(function () {
      fondo.classList.add('visible');
      drawer.classList.add('abierto');
    });
    $('#btnAbrirAjustes').setAttribute('aria-expanded', 'true');
    $('#btnCerrarAjustes').focus();
  }

  function closeSettings() {
    var fondo = $('#fondoAjustes');
    var drawer = $('#drawerAjustes');
    fondo.classList.remove('visible');
    drawer.classList.remove('abierto');
    $('#btnAbrirAjustes').setAttribute('aria-expanded', 'false');
    var ocultar = function () { fondo.hidden = true; drawer.hidden = true; };
    if (App.utils.reducedMotion()) ocultar();
    else setTimeout(ocultar, 250);
    if (disparadorAjustes) disparadorAjustes.focus();
  }

  /* Keeps Tab/Shift+Tab cycling inside the open drawer (basic focus
     trap -- accessibility rule: complete keyboard navigation). */
  function handleDrawerTab(e) {
    if (e.key !== 'Tab') return;
    var focables = focusableSettingsElements();
    if (!focables.length) return;
    var primero = focables[0];
    var ultimo = focables[focables.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#btnAbrirAjustes')) { openSettings(); return; }
    if (e.target.closest('#btnCerrarAjustes')) { closeSettings(); return; }
    if (e.target === $('#fondoAjustes')) { closeSettings(); return; }

    var bTexto = e.target.closest('.btn-texto-tam');
    if (bTexto) { state.opciones.texto = bTexto.dataset.text; save(); applyOptions(); return; }

    var bTema = e.target.closest('.btn-tema');
    if (bTema) { state.opciones.tema = bTema.dataset.tema; save(); applyOptions(); return; }

    if (e.target.closest('#btnModoFoco')) { state.opciones.foco = !state.opciones.foco; save(); applyOptions(); return; }
    if (e.target.closest('#btnEspacial')) { state.opciones.espacial = !state.opciones.espacial; save(); applyOptions(); return; }
    if (e.target.closest('#btnMetricas')) { state.opciones.metricas = !state.opciones.metricas; save(); applyOptions(); return; }
  });

  /* ---------- Live metrics (accuracy and speed) ---------- */
  function startMetrics() {
    state.metricas = { teclas: 0, aciertos: 0, fallos: 0, inicioMs: Date.now() };
    updateLiveMetrics();
  }

  function updateLiveMetrics() {
    var zona = $('#metricasVivas');
    if (!state.opciones.metricas || !game || !state.metricas) {
      zona.classList.add('hidden');
      return;
    }
    zona.classList.remove('hidden');
    var m = state.metricas;
    var precision = m.teclas ? Math.round((m.aciertos / m.teclas) * 100) : 100;
    var minutos = Math.max((Date.now() - m.inicioMs) / 60000, 1 / 60);
    var ppm = Math.round(m.teclas / minutos);
    zona.innerHTML = '';
    [
      App.i18n.t('precisionCorto').replace('{n}', precision),
      App.i18n.t('ppmCorto').replace('{n}', ppm)
    ].forEach(function (text) {
      var pill = document.createElement('span');
      pill.className = 'metrica-viva';
      pill.textContent = text;
      zona.appendChild(pill);
    });
  }

  function keysOf(ch) {
    if (!ch || ch === '"') return [];
    return $$('.tecla[data-ch="' + ch + '"]');
  }

  function flashKey(ch, down) {
    keysOf(ch).forEach(function (t) { t.classList.toggle('pulsada', down); });
    if (down) {
      setTimeout(function () {
        keysOf(ch).forEach(function (t) { t.classList.remove('pulsada'); });
      }, 600);
    }
  }

  function markTarget(ch) {
    $$('.tecla.objetivo').forEach(function (t) { t.classList.remove('objetivo'); });
    keysOf(ch).forEach(function (t) { t.classList.add('objetivo'); });
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
      var clases = 'dedo f-' + f + (active === f ? ' activo' : '') + (activeShift === f ? ' activo-mayus' : '');
      return '<rect class="' + clases + '" x="' + x + '" y="' + y + '" width="32" height="' + h + '" rx="15"/>';
    }
    function pulgar(x) {
      var act = (active === 'th') ? ' activo' : '';
      return '<rect class="dedo f-th' + act + '" x="' + x + '" y="112" width="42" height="28" rx="14"/>';
    }
    return '<svg viewBox="0 0 405 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      finger('lp', 0, 48, 60) + finger('lr', 38, 26, 82) + finger('lm', 76, 16, 92) + finger('li', 114, 26, 82) +
      '<rect class="palma" x="0" y="96" width="146" height="70" rx="22"/>' + pulgar(147) +
      pulgar(216) + finger('ri', 259, 26, 82) + finger('rm', 297, 16, 92) + finger('rr', 335, 26, 82) + finger('rp', 373, 48, 60) +
      '<rect class="palma" x="259" y="96" width="146" height="70" rx="22"/>' +
      '<text x="73" y="192">' + App.i18n.t('izquierdaEtiqueta') + '</text>' +
      '<text x="332" y="192">' + App.i18n.t('derechaEtiqueta') + '</text>' +
      '</svg>';
  }

  function renderHands(finger, shiftFinger) {
    $('#manosSvg').innerHTML = handsSVG(finger, shiftFinger);
    var text;
    if (finger === 'th') text = App.i18n.t('pulgarTexto');
    else if (finger) {
      text = App.i18n.t('manoDedoTexto')
        .replace('{mano}', App.i18n.t('dedo.' + finger + '.mano'))
        .replace('{dedo}', App.i18n.t('dedo.' + finger + '.nombre'));
      if (shiftFinger) text += ' ' + App.i18n.t('mayusTexto').replace('{mano}', App.i18n.t('dedo.' + shiftFinger + '.mano'));
    }
    else text = App.i18n.t('buscaTecla');
    $('#guiaTexto').textContent = text;
  }

  /* ---------- Screens ---------- */
  function showScreen(id) {
    PANTALLAS.forEach(function (p) {
      document.getElementById(p).classList.toggle('hidden', p !== id);
    });
  }

  function goMenu() {
    renderMenu();
    showScreen('pantallaMenu');
  }

  function goLessons() {
    renderLessons();
    showScreen('pantallaLecciones');
  }

  function goName() {
    $('#inputNombre').value = state.nombre;
    $('#avisoNombre').textContent = '';
    showScreen('pantallaNombre');
    $('#inputNombre').focus();
  }

  function goFree() {
    showScreen('pantallaLibre');
    $('#areaLibre').focus();
  }

  function lecciones() { return DATA.lessons[App.i18n.locale()] || DATA.lessons.es; }
  function templates() { return DATA.templates[App.i18n.locale()] || DATA.templates.es; }

  function renderMenu() {
    $('#saludo').textContent = state.nombre
      ? App.i18n.t('saludoConNombre').replace('{nombre}', capitalize(state.nombre))
      : App.i18n.t('saludoHola');
    var todasLecciones = lecciones();
    var hechas = todasLecciones.filter(function (l) { return state.completado[l.id]; }).length;
    var todasPlantillas = templates();
    var hechasPlantillas = todasPlantillas.filter(function (p) { return state.completado['plantilla_' + p.id]; }).length;
    $$('.tarjeta-modo').forEach(function (t) {
      var badge = t.querySelector('.hecho');
      var m = t.dataset.mode;
      if (m === 'lecciones') badge.textContent = hechas > 0 ? App.i18n.t('deTexto').replace('{hechas}', hechas).replace('{total}', todasLecciones.length) : '';
      else if (m === 'templates') badge.textContent = hechasPlantillas > 0 ? App.i18n.t('deTexto').replace('{hechas}', hechasPlantillas).replace('{total}', todasPlantillas.length) : '';
      else badge.textContent = state.completado[m] ? '⭐' : '';
    });
    updateStars();
  }

  function renderLessons() {
    var cont = $('#listaLecciones');
    cont.innerHTML = '';
    var todasLecciones = lecciones();
    todasLecciones.forEach(function (l, i) {
      var abierta = i === 0 || !!state.completado[todasLecciones[i - 1].id];
      var hecha = !!state.completado[l.id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-leccion' + (hecha ? ' hecha' : '') + (!abierta ? ' cerrada' : '');
      var num = document.createElement('span');
      num.className = 'num';
      num.textContent = String(i + 1);
      var tit = document.createElement('span');
      tit.className = 'tit';
      tit.textContent = l.title;
      var est = document.createElement('span');
      est.setAttribute('aria-hidden', 'true');
      est.textContent = hecha ? '⭐' : (abierta ? '' : '🔒');
      b.appendChild(num); b.appendChild(tit); b.appendChild(est);
      if (abierta) {
        b.addEventListener('click', function () { playLesson(l); });
      } else {
        b.disabled = true;
        b.setAttribute('aria-label', App.i18n.t('leccionCerradaAria').replace('{n}', i + 1));
      }
      cont.appendChild(b);
    });
  }

  /* "Real texts" (templates): unlike renderLessons(), every entry
     is always open -- these are independent practice texts, not a
     graded, linearly-unlocked curriculum. */
  function renderTemplates() {
    var cont = $('#listaPlantillas');
    cont.innerHTML = '';
    templates().forEach(function (p, i) {
      var hecha = !!state.completado['plantilla_' + p.id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-leccion' + (hecha ? ' hecha' : '');
      var num = document.createElement('span');
      num.className = 'num';
      num.textContent = String(i + 1);
      var tit = document.createElement('span');
      tit.className = 'tit';
      tit.textContent = p.title;
      var est = document.createElement('span');
      est.setAttribute('aria-hidden', 'true');
      est.textContent = hecha ? '⭐' : '';
      b.appendChild(num); b.appendChild(tit); b.appendChild(est);
      b.addEventListener('click', function () { playTemplate(p); });
      cont.appendChild(b);
    });
  }

  function goTemplates() {
    renderTemplates();
    showScreen('pantallaPlantillas');
  }

  /* ---------- Motor de secuencias ---------- */
  function startSequence(cfg) {
    game = { type: 'seq', cfg: cfg, idx: 0, pos: 0, waiting: false };
    $('#tituloJuego').textContent = cfg.title;
    var inNumpad = cfg.mode === 'numeros';
    $('#panelTeclado').classList.toggle('hidden', inNumpad);
    $('#panelNumpad').classList.toggle('hidden', !inNumpad);
    $('#zonaObjetivo').classList.remove('hidden');
    $('#zonaReto').classList.add('hidden');
    $('#guia').classList.remove('hidden');
    clearFeedback();
    startMetrics();
    showScreen('pantallaJuego');
    loadStep();
  }

  function currentStep() { return game.cfg.pasos[game.idx]; }

  /* A step is either a typed sequence ({ seq: 'hola' }, matched
     character by character) or a single special key ({ especial:
     'Home' }, matched in one shot against the raw KeyboardEvent.key --
     see DATA.lessons "Teclas especiales"/"Special keys" and
     normalizeKey()). Special-key steps have no printable character
     and no fixed finger (the convention varies too much by keyboard),
     so they skip the finger-guide highlighting entirely. */
  function isSpecialStep(p) { return !!p && typeof p.especial === 'string'; }

  function expectedChar() {
    var p = currentStep();
    return (p && !isSpecialStep(p)) ? p.seq[game.pos] : null;
  }

  function loadStep() {
    game.pos = 0;
    $('#instruccionJuego').textContent = currentStep().text || '';
    renderTarget();
    updateGuide();
  }

  function renderTarget() {
    var p = currentStep();
    var zona = $('#zonaObjetivo');
    zona.innerHTML = '';
    /* "Real texts" (plantilla) lines are full sentences, unlike the
       single letter/word targets of the other modes -- wrapping
       letter-by-letter breaks words mid-way across the line. Grouping
       each word's letters in a nested flex span keeps a word together
       as one wrap unit while spaces stay valid wrap points; the
       smaller '--compacta' box size (styles.css) fits more of a
       sentence per line before that wrap is even needed. */
    var compacto = game.cfg.mode === 'plantilla';
    zona.classList.toggle('objetivo-zona--compacta', compacto);
    if (isSpecialStep(p)) {
      var etiqueta = App.i18n.t('teclaLabel.' + p.especial);
      zona.setAttribute('aria-label', App.i18n.t('pulsaTeclaAria').replace('{tecla}', etiqueta));
      var pill = document.createElement('span');
      pill.className = 'letra actual ancha';
      pill.textContent = etiqueta;
      zona.appendChild(pill);
      return;
    }
    var seq = p.seq;
    zona.setAttribute('aria-label', App.i18n.t('escribeAria').replace('{seq}', seq));
    var destino = zona;
    for (var i = 0; i < seq.length; i++) {
      var ch = seq[i];
      if (ch === ' ') {
        destino = zona;
      } else if (compacto && (i === 0 || seq[i - 1] === ' ')) {
        destino = document.createElement('span');
        destino.className = 'palabra';
        zona.appendChild(destino);
      }
      var s = document.createElement('span');
      s.className = 'letra' + (i < game.pos ? ' hecha' : (i === game.pos ? ' actual' : ''));
      s.textContent = ch === ' ' ? '␣' : ch;
      destino.appendChild(s);
    }
  }

  /* expectedChar() keeps its original case ('A' for a required capital)
     so renderTarget() can display it as typed. Everything that looks
     up a physical key (finger tables, data-ch on the on-screen keyboard)
     needs the base lowercase letter instead -- there's no separate 'A'
     key, just 'a' held with Shift. */
  function expectedBaseChar() {
    var ch = expectedChar();
    return ch ? ch.toLowerCase() : null;
  }

  function expectedShift() {
    var ch = expectedChar();
    return !!ch && ch !== ch.toLowerCase();
  }

  function updateGuide() {
    if (isSpecialStep(currentStep())) {
      markTarget(currentStep().especial);
      renderHands(null, null);
      return;
    }
    var base = expectedBaseChar();
    var finger = fingerOf(base, game.cfg.mode === 'numeros');
    markTarget(base);
    renderHands(finger, expectedShift() ? oppositeShiftSide(finger) : null);
  }

  function clearFeedback() {
    var f = $('#feedback');
    f.textContent = '';
    f.className = 'feedback';
  }

  function gameKey(ch, mayus) {
    if (game.waiting) return;
    var p = currentStep();
    state.metricas.teclas += 1;

    if (isSpecialStep(p)) {
      /* Single-action step: no character sequence to walk through,
         it's done as soon as the right key is detected. */
      if (ch === p.especial) {
        state.metricas.aciertos += 1;
        updateLiveMetrics();
        stepCompleted(ch);
      } else {
        state.metricas.fallos += 1;
        updateLiveMetrics();
        App.feedback.encourage($('#feedback'));
      }
      return;
    }

    var seq = p.seq;
    var esperado = seq[game.pos];
    var necesitaMayus = esperado !== esperado.toLowerCase();
    /* Lowercase steps don't check the Shift state at all -- an
       accidentally-held Shift key while typing a lowercase letter
       still counts as correct, matching the app's general policy of
       not penalising things the exercise didn't ask about. */
    if (ch === esperado.toLowerCase() && (!necesitaMayus || mayus)) {
      state.metricas.aciertos += 1;
      game.pos += 1;
      renderTarget();
      updateLiveMetrics();
      if (game.pos >= seq.length) stepCompleted(ch);
      else updateGuide();
    } else {
      state.metricas.fallos += 1;
      updateLiveMetrics();
      keysOf(ch).forEach(function (t) {
        t.classList.add('fallo');
        setTimeout(function () { t.classList.remove('fallo'); }, 500);
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
      if (game.idx >= game.cfg.pasos.length) {
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
    award(cfg.claveEstrella);
    celebrateWithTransfer(cfg.alTerminar);
  }

  /* ---------- Game modes ---------- */
  function playPosition() {
    startSequence({
      mode: 'posicion', title: App.i18n.t('modoPosicionNombre'),
      pasos: DATA.placement[App.i18n.locale()] || DATA.placement.es,
      claveEstrella: 'posicion', alTerminar: goMenu
    });
  }

  function playLesson(l) {
    /* Most lessons' steps are plain strings (a typed sequence). The
       special-keys lesson uses { especial: 'inicio' } objects instead
       -- see isSpecialStep(). */
    var pasos = l.steps.map(function (s) {
      return typeof s === 'string' ? { text: l.intro, seq: s } : { text: l.intro, especial: s.especial };
    });
    startSequence({
      mode: 'leccion', title: App.i18n.t('leccionTitulo').replace('{titulo}', l.title),
      pasos: pasos, claveEstrella: l.id, alTerminar: goLessons
    });
  }

  function playWords() {
    var pasos = [];
    if (state.nombre) {
      /* no accents: the exercise uses the basic keys */
      var plano = state.nombre.toLowerCase();
      if (plano.normalize) plano = plano.normalize('NFD').replace(/[̀-ͯ]/g, '');
      pasos.push({ text: App.i18n.t('escribeTuNombre'), seq: plano });
    }
    var banco = DATA.words[App.i18n.locale()] || DATA.words.es;
    App.utils.shuffle(banco).slice(0, 4).forEach(function (w) {
      pasos.push({ text: App.i18n.t('escribeLaPalabra'), seq: w });
    });
    startSequence({
      mode: 'palabras', title: App.i18n.t('modoPalabrasNombre'),
      pasos: pasos, claveEstrella: 'palabras', alTerminar: goMenu
    });
  }

  function playTemplate(p) {
    var pasos = p.lines.map(function (linea) {
      return { text: App.i18n.t('plantillaInstruccion'), seq: linea };
    });
    startSequence({
      mode: 'plantilla', title: p.title,
      pasos: pasos, claveEstrella: 'plantilla_' + p.id, alTerminar: goTemplates
    });
  }

  function playNumbers() {
    startSequence({
      mode: 'numeros', title: App.i18n.t('modoNumerosNombre'),
      pasos: DATA.numpadSteps[App.i18n.locale()] || DATA.numpadSteps.es,
      claveEstrella: 'numeros', alTerminar: goMenu
    });
  }

  /* ---------- Challenge: all keys ---------- */
  function playChallenge() {
    game = { type: 'reto', set: {} };
    $('#tituloJuego').textContent = App.i18n.t('tituloTodasLasTeclas');
    $('#instruccionJuego').textContent = App.i18n.t('instruccionTodasLasTeclas');
    $('#panelTeclado').classList.remove('hidden');
    $('#panelNumpad').classList.add('hidden');
    $('#zonaObjetivo').classList.add('hidden');
    $('#zonaReto').classList.remove('hidden');
    $('#guia').classList.remove('hidden');
    clearFeedback();
    markTarget(null);
    $$('.tecla.hecha').forEach(function (t) { t.classList.remove('hecha'); });
    startMetrics();
    showScreen('pantallaJuego');
    updateChallenge();
  }

  function challengeKey(ch) {
    var visibles = typeableKeys(visibleRows());
    if (!visibles[ch] || game.set[ch]) return;
    game.set[ch] = true;
    state.metricas.teclas += 1;
    state.metricas.aciertos += 1;
    updateLiveMetrics();
    keysOf(ch).forEach(function (t) { t.classList.add('hecha'); });
    /* Quiet per-key ack: just the "ding" panned to that column.
       Avoids spamming success messages during the challenge but lets
       the spatial-sound option be audible. */
    App.feedback.successSound(panOf(ch));
    updateChallenge();
  }

  function reapplyChallenge() {
    Object.keys(game.set).forEach(function (ch) {
      keysOf(ch).forEach(function (t) { t.classList.add('hecha'); });
    });
    updateChallenge();
  }

  /* Pick the next key the player still has to press in the "all keys"
     challenge. Iteration is stable (layout row order) so the player
     sees a predictable left-to-right, top-to-bottom rhythm instead of
     a random-looking highlight jumping around. */
  function nextPendingKey() {
    var pendientes = null;
    visibleRows().forEach(function (f) {
      f.forEach(function (k) {
        if (!k.ch || k.special) return;
        if (game.set[k.ch]) return;
        if (!pendientes) pendientes = [];
        pendientes.push(k);
      });
    });
    return pendientes ? pendientes[0] : null;
  }

  /* Render the hand guide and the on-screen keyboard highlight for the
     next key still pending in the challenge. The marker reuses the
     same "objetivo" class the rest of the modes use to light up the
     target key, so the visual cue is consistent across modes. */
  function challengeGuide() {
    var k = nextPendingKey();
    if (!k) {
      markTarget(null);
      $('#guiaTexto').textContent = '';
      $('#manosSvg').innerHTML = handsSVG(null, null);
      return;
    }
    var ch = k.ch;
    var inNumpad = !!DATA.numpadFingers[ch];
    var finger = fingerOf(ch, inNumpad);
    markTarget(ch);
    renderHands(finger, null);
    var teclaTxt;
    if (ch === ' ') teclaTxt = App.i18n.t('teclaLabel.espacio') || ch;
    else if (ch.length === 1 && /[a-zA-Z]/.test(ch)) teclaTxt = ch.toUpperCase();
    else teclaTxt = ch;
    var text;
    if (finger === 'th') {
      text = App.i18n.t('retoSiguientePulgar').replace('{tecla}', teclaTxt);
    } else if (finger) {
      text = App.i18n.t('retoSiguiente')
        .replace('{tecla}', teclaTxt)
        .replace('{dedo}', App.i18n.t('dedo.' + finger + '.nombre'))
        .replace('{mano}', App.i18n.t('dedo.' + finger + '.mano'));
    } else {
      text = App.i18n.t('buscaTecla');
    }
    $('#guiaTexto').textContent = text;
  }

  function updateChallenge() {
    var total = 0, hechas = 0;
    visibleRows().forEach(function (f) {
      f.forEach(function (k) {
        if (!k.ch || k.special) return;
        total += 1;
        if (game.set[k.ch]) hechas += 1;
      });
    });
    $('#retoFill').style.width = (total ? Math.round(hechas / total * 100) : 0) + '%';
    $('#retoTexto').textContent = App.i18n.t('deTexto').replace('{hechas}', hechas).replace('{total}', total);
    if (total > 0 && hechas === total) {
      game = null;
      /* Clear the next-key highlight and the hand guide so the
         completion feedback doesn't leave a stale "press X" prompt
         on screen while the success banner shows. */
      markTarget(null);
      $('#guiaTexto').textContent = '';
      $('#manosSvg').innerHTML = handsSVG(null, null);
      award('todas');
      celebrateWithTransfer(goMenu);
      return;
    }
    challengeGuide();
  }

  /* ---------- Physical keyboard: the only real input ---------- */
  /* Maps the DOM KeyboardEvent.key value of each "less frequent key"
     (see DATA.lessons "Teclas especiales"/"Special keys") to an
     internal id. The id is what ends up in data-ch on the on-screen
     decorative key (DATA.layouts.extendido) and in a lesson step's
     `especial` field -- normalizeKey() is the only place that knows
     about the real DOM key names, same as it's the only place that
     knows 'Spacebar' means ' '. */
  var TECLA_ESPECIAL_DOM = { Home: 'inicio', End: 'fin', PageUp: 'pagArriba', PageDown: 'pagAbajo', Delete: 'suprimir' };

  function normalizeKey(k) {
    if (k === 'Spacebar') k = ' ';
    if (TECLA_ESPECIAL_DOM[k]) return TECLA_ESPECIAL_DOM[k];
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
    flashKey(ch, true);
    var foco = document.activeElement;
    if (foco && (foco.tagName === 'INPUT' || foco.tagName === 'TEXTAREA')) return;
    if (!game) return;
    e.preventDefault();
    if (e.repeat) return;
    if (game.type === 'reto') challengeKey(ch);
    else gameKey(ch, e.shiftKey);
  });

  document.addEventListener('keyup', function (e) {
    var ch = normalizeKey(e.key);
    if (ch) flashKey(ch, false);
  });

  /* ---------- Keyboard options (delegation: there are several panels) ---------- */
  document.addEventListener('click', function (e) {
    var bt = e.target.closest('.btn-teclado');
    if (bt) {
      state.opciones.teclado = bt.dataset.teclado;
      save();
      renderTeclados();
      return;
    }
    var bc = e.target.closest('.btn-color');
    if (bc) {
      state.opciones.color = state.opciones.color === 'manos' ? 'dedos' : 'manos';
      save();
      renderTeclados();
    }
  });

  /* ---------- Nombre ---------- */
  function saveName() {
    var v = $('#inputNombre').value.trim().slice(0, 20);
    state.nombre = v;
    save();
    /* Audio only plays if the user taps the "Listen" button (btnLeerNombre) */
    goMenu();
  }

  $('#btnGuardarNombre').addEventListener('click', saveName);
  $('#btnSinNombre').addEventListener('click', function () {
    state.nombre = '';
    save();
    goMenu();
  });
  $('#inputNombre').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveName();
    }
  });
  $('#btnLeerNombre').addEventListener('click', function () {
    App.tts.speak($('#textoNombre').textContent + App.i18n.t('escucharNombreExtra'));
  });

  var confirmandoBorrado = false;
  $('#btnBorrarTodo').addEventListener('click', function () {
    var btn = this;
    if (!confirmandoBorrado) {
      confirmandoBorrado = true;
      btn.textContent = App.i18n.t('confirmarBorrado');
      setTimeout(function () {
        confirmandoBorrado = false;
        btn.textContent = App.i18n.t('btnBorrarProgreso');
      }, 4000);
      return;
    }
    confirmandoBorrado = false;
    App.storage.remove(SLUG);
    state = {
      nombre: '', estrellas: 0, completado: {},
      opciones: {
        teclado: 'simplificado', color: 'manos', tema: 'auto', text: 'normal',
        foco: false, espacial: false, metricas: false
      }
    };
    save();
    btn.textContent = App.i18n.t('btnBorrarProgreso');
    $('#inputNombre').value = '';
    $('#avisoNombre').textContent = App.i18n.t('avisoBorrado');
    renderTeclados();
    applyOptions();
    updateStars();
  });

  /* ---------- Menu and navigation ---------- */
  $('#menuJuegos').addEventListener('click', function (e) {
    var t = e.target.closest('.tarjeta-modo');
    if (!t) return;
    var m = t.dataset.mode;
    if (m === 'posicion') playPosition();
    else if (m === 'lecciones') goLessons();
    else if (m === 'palabras') playWords();
    else if (m === 'todas') playChallenge();
    else if (m === 'numeros') playNumbers();
    else if (m === 'libre') goFree();
    else if (m === 'templates') goTemplates();
  });

  $('#btnLeerSaludo').addEventListener('click', function () {
    App.tts.speak($('#saludo').textContent + ' ' + App.i18n.t('eligeJuego'));
  });

  $('#btnCambiarNombre').addEventListener('click', goName);
  $('#btnVolverMenu').addEventListener('click', goMenu);
  $('#btnVolverMenuPlantillas').addEventListener('click', goMenu);

  $('#btnSalirJuego').addEventListener('click', function () {
    var mode = game && game.cfg ? game.cfg.mode : null;
    game = null;
    App.tts.stop();
    markTarget(null);
    if (mode === 'leccion') goLessons();
    else if (mode === 'plantilla') goTemplates();
    else goMenu();
  });

  $('#btnLeerJuego').addEventListener('click', function () {
    var text = $('#tituloJuego').textContent + '. ' + $('#instruccionJuego').textContent;
    if (game && game.type === 'seq') text += ' ' + $('#guiaTexto').textContent;
    App.tts.speak(text);
  });

  /* ---------- Escritura libre ---------- */
  $('#btnSalirLibre').addEventListener('click', goMenu);
  $('#btnLeerLibre').addEventListener('click', function () {
    var t = $('#areaLibre').value.trim();
    App.tts.speak(t || App.i18n.t('noHasEscrito'));
  });
  $('#btnBorrarLibre').addEventListener('click', function () {
    $('#areaLibre').value = '';
    $('#areaLibre').focus();
  });

  /* ---------- Selector de idioma ---------- */
  /* Manual override for the browser-language auto-detection done in
     index.html's pre-paint script and i18n.js#detectar. Persists to
     the same 'teclatlon:locale' key i18n.js already reads, so once
     set it wins over auto-detection on every future visit.
     App.i18n.setLocale() reloads the page — there's no in-place
     re-render of already-painted text. */
  $$('.btn-idioma').forEach(function (b) {
    b.setAttribute('aria-pressed', String(b.dataset.locale === App.i18n.locale()));
    b.addEventListener('click', function () {
      App.i18n.setLocale(b.dataset.locale);
    });
  });

  /* ---------- Arranque ---------- */
  /* Computer-only gate (SPEC.md section 2): the pre-paint script
     in index.html sets <html data-app-bloqueada="movil"> on
     phones/tablets. In that case we surface the overlay (already
     in the DOM) with the right i18n strings and abort the rest
     of the boot -- there's no game engine to set up, no listeners
     to wire, no audio context to create on a device the app cannot
     use. */
  if (document.documentElement.getAttribute('data-app-bloqueada') === 'movil') {
    var bloqueo = document.getElementById('bloqueoMovil');
    if (bloqueo) {
      App.i18n.apply(bloqueo);
      bloqueo.removeAttribute('hidden');
      /* App.i18n.apply(document) ran earlier (i18n.js#inicio) and
         may have overwritten the gate title with the regular
         'Teclatlon' one. Put the gate wording back so the browser
         tab also says the app is blocked on this device. */
      document.title = App.i18n.t('soloOrdenador') + ' — Teclatlon';
    }
    return;
  }

  $('#areaLibre').setAttribute('placeholder', App.i18n.t('areaLibrePlaceholder'));
  renderRows($('#numpad'), DATA.numpad);
  renderTeclados();
  applyOptions();
  updateStars();
  if (state.nombre) goMenu();
  else goName();
})();
