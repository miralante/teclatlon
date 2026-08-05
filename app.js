/* ==========================================================================
   Teclatlon — Lógica
   Aprende a escribir con el teclado físico del ordenador.
   El teclado que se ve en pantalla es SOLO visual (no se puede tocar):
   enseña la tecla objetivo, refleja cada pulsación y colorea las teclas
   por mano o por dedo (método de mecanografía con row guía F/J).
   Requiere assets/js (App.utils, App.tts, App.storage, App.feedback) y data.js.
   ========================================================================== */
(function () {
  'use strict';

  var $ = App.utils.$;
  var $$ = App.utils.$$;
  var SLUG = 'keyboard';
  var PANTALLAS = ['pantallaNombre', 'pantallaMenu', 'pantallaLecciones', 'pantallaPlantillas', 'pantallaJuego', 'pantallaLibre'];

  /* ---------- Estado y progreso ---------- */
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

  function guardar() { App.storage.set(SLUG, state); }

  /* Partida en curso. null fuera de pantallaJuego.
     type 'seq': { cfg: { modo, titulo, pasos, claveEstrella, alTerminar }, idx, pos, esperando }
     type 'reto': { set: { ch: true } } */
  var game = null;

  function bonito(nombre) {
    return nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : '';
  }

  function mensajeFinal() {
    return state.nombre
      ? App.i18n.t('muyBienNombre').replace('{nombre}', bonito(state.nombre))
      : App.i18n.t('muyBien');
  }

  /* Closing line for the meaningful-learning anchor: connects the
     exercise to writing real messages on a real computer. Appended to
     the celebration overlay itself, since this activity has no
     separate "round complete" screen to hold it. */
  function celebrarConTransferencia(despues) {
    App.feedback.celebrate(mensajeFinal() + ' ' + App.i18n.t('transferencia'), despues);
  }

  function actualizarEstrellas() {
    $('#stars').textContent = '⭐ ' + state.estrellas;
  }

  function premiar(clave) {
    if (!state.completado[clave]) {
      state.completado[clave] = true;
      state.estrellas += 1;
      guardar();
      actualizarEstrellas();
    }
  }

  /* ---------- Datos de teclas ---------- */
  function filasVisibles() {
    return DATA.layouts[state.opciones.teclado] || DATA.layouts.simplificado;
  }

  function esExtendido() {
    return state.opciones.teclado === 'extendido';
  }

  function clavesTipeables(filas) {
    var out = {};
    filas.forEach(function (f) {
      /* k.special (Home/End/PageUp/PageDown/Delete, DATA.layouts.extendido)
         has a real 'ch' so the special-keys lesson can target it, but it's
         not part of the core alphanumeric layout this challenge covers. */
      f.forEach(function (k) { if (k.ch && !k.special) out[k.ch] = true; });
    });
    return out;
  }

  function dedoDe(ch, enNumpad) {
    if (!ch) return null;
    if (ch === ' ') return 'th';
    if (enNumpad) return DATA.numpadFingers[ch] || null;
    var filas = [DATA.numberRow].concat(DATA.rows);
    for (var i = 0; i < filas.length; i++) {
      for (var j = 0; j < filas[i].length; j++) {
        if (filas[i][j].ch === ch) return filas[i][j].finger;
      }
    }
    return null;
  }

  /* Stereo pan for the spatial-sound option (-1 = full left, +1 = full
     right). Computed from the key's column within its row so the
     success tone comes from the same side as the key the player just
     hit. The numpad is intentionally excluded (no horizontal spread
     to speak of) and returns 0 (centre). */
  function panDe(ch) {
    if (!ch) return 0;
    if (game && game.cfg && game.cfg.modo === 'numeros') return 0;
    var filas = [DATA.numberRow].concat(DATA.rows);
    for (var i = 0; i < filas.length; i++) {
      var tipeables = filas[i].filter(function (k) { return !!k.ch; });
      if (tipeables.length < 2) continue;
      for (var j = 0; j < tipeables.length; j++) {
        if (tipeables[j].ch === ch) {
          return (j / (tipeables.length - 1)) * 2 - 1;
        }
      }
    }
    return 0;
  }

  /* ---------- Teclado visual (nunca clicable: pointer-events none) ---------- */
  function crearTecla(k) {
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

  function pintarFilas(cont, filas) {
    cont.innerHTML = '';
    filas.forEach(function (row) {
      var f = document.createElement('div');
      f.className = 'row-teclas';
      row.forEach(function (k) { f.appendChild(crearTecla(k)); });
      cont.appendChild(f);
    });
  }

  function renderTeclados() {
    $$('.teclado').forEach(function (c) {
      pintarFilas(c, filasVisibles());
    });
    $$('.numpad-inline').forEach(function (c) {
      c.classList.toggle('hidden', !esExtendido());
      pintarFilas(c, DATA.numpad);
    });
    $$('.teclado, .numpad, .numpad-inline, .manos').forEach(function (c) {
      c.classList.toggle('color-dedos', state.opciones.color === 'dedos');
      c.classList.toggle('color-manos', state.opciones.color === 'manos');
    });
    actualizarOpcionesUI();
    /* Recompute the whole guide (not just marcarObjetivo): switching
       keyboard type mid-game doesn't change fingers today (only
       "simple/normal/extended" are physical layouts), but keeps the
       guide consistent if a layout ever changes finger mapping. */
    if (game && game.type === 'seq') actualizarGuia();
    if (game && game.type === 'reto') reaplicarReto();
  }

  function actualizarOpcionesUI() {
    $$('.btn-teclado').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.teclado === state.opciones.teclado));
    });
    var claveDetalle = ({
      simplificado: 'btnSimpleDetalle',
      normal: 'btnNormalDetalle',
      extendido: 'btnExtendidoDetalle'
    })[state.opciones.teclado];
    $$('.detalle-teclado').forEach(function (p) {
      p.textContent = claveDetalle ? App.i18n.t(claveDetalle) : '';
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
  function etiquetaOnOff(clave, activo) {
    return App.i18n.t(clave + (activo ? 'On' : 'Off'));
  }

  function actualizarBotonAjuste(id, clave, activo) {
    var b = $(id);
    b.setAttribute('aria-pressed', String(activo));
    b.textContent = etiquetaOnOff(clave, activo);
  }

  /* Applies state.opciones to the page (theme/text-size custom
     attributes on <html>, focus-mode class) and syncs every toggle
     button's aria-pressed + on/off label. Called at boot and after
     every settings change. The same tema/texto/foco attributes are
     set earlier, before first paint, by the inline script in
     index.html (reads localStorage directly) -- this just keeps
     everything consistent once app.js has taken over. */
  function aplicarOpciones() {
    var html = document.documentElement;
    if (state.opciones.tema === 'auto') html.removeAttribute('data-tema');
    else html.setAttribute('data-tema', state.opciones.tema);
    if (state.opciones.texto === 'normal') html.removeAttribute('data-texto');
    else html.setAttribute('data-texto', state.opciones.texto);
    html.classList.toggle('modo-foco', state.opciones.foco);

    $$('.btn-texto-tam').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.texto === state.opciones.texto));
    });
    $$('.btn-tema').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.tema === state.opciones.tema));
    });
    actualizarBotonAjuste('#btnModoFoco', 'etiquetaModoFoco', state.opciones.foco);
    actualizarBotonAjuste('#btnEspacial', 'etiquetaSonidoEspacial', state.opciones.espacial);
    actualizarBotonAjuste('#btnMetricas', 'etiquetaMetricas', state.opciones.metricas);
    actualizarMetricasVivas();
  }

  /* ---------- Drawer lateral de ajustes ---------- */
  var disparadorAjustes = null;

  function elementosFocalizablesAjustes() {
    return $$('#drawerAjustes button, #drawerAjustes [href], #drawerAjustes input, #drawerAjustes select, #drawerAjustes textarea')
      .filter(function (el) { return !el.disabled; });
  }

  function ajustesAbiertos() {
    return !$('#drawerAjustes').hidden;
  }

  function abrirAjustes() {
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

  function cerrarAjustes() {
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
  function manejarTabDrawer(e) {
    if (e.key !== 'Tab') return;
    var focables = elementosFocalizablesAjustes();
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
    if (e.target.closest('#btnAbrirAjustes')) { abrirAjustes(); return; }
    if (e.target.closest('#btnCerrarAjustes')) { cerrarAjustes(); return; }
    if (e.target === $('#fondoAjustes')) { cerrarAjustes(); return; }

    var bTexto = e.target.closest('.btn-texto-tam');
    if (bTexto) { state.opciones.texto = bTexto.dataset.texto; guardar(); aplicarOpciones(); return; }

    var bTema = e.target.closest('.btn-tema');
    if (bTema) { state.opciones.tema = bTema.dataset.tema; guardar(); aplicarOpciones(); return; }

    if (e.target.closest('#btnModoFoco')) { state.opciones.foco = !state.opciones.foco; guardar(); aplicarOpciones(); return; }
    if (e.target.closest('#btnEspacial')) { state.opciones.espacial = !state.opciones.espacial; guardar(); aplicarOpciones(); return; }
    if (e.target.closest('#btnMetricas')) { state.opciones.metricas = !state.opciones.metricas; guardar(); aplicarOpciones(); return; }
  });

  /* ---------- Métricas en vivo (precisión y velocidad) ---------- */
  function iniciarMetricas() {
    state.metricas = { teclas: 0, aciertos: 0, fallos: 0, inicioMs: Date.now() };
    actualizarMetricasVivas();
  }

  function actualizarMetricasVivas() {
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
    ].forEach(function (texto) {
      var pill = document.createElement('span');
      pill.className = 'metrica-viva';
      pill.textContent = texto;
      zona.appendChild(pill);
    });
  }

  function teclasDe(ch) {
    if (!ch || ch === '"') return [];
    return $$('.tecla[data-ch="' + ch + '"]');
  }

  function flashTecla(ch, abajo) {
    teclasDe(ch).forEach(function (t) { t.classList.toggle('pulsada', abajo); });
    if (abajo) {
      setTimeout(function () {
        teclasDe(ch).forEach(function (t) { t.classList.remove('pulsada'); });
      }, 600);
    }
  }

  function marcarObjetivo(ch) {
    $$('.tecla.objetivo').forEach(function (t) { t.classList.remove('objetivo'); });
    teclasDe(ch).forEach(function (t) { t.classList.add('objetivo'); });
  }

  /* Touch-typing convention for capitals: hold Shift with the pinky
     on the side OPPOSITE the letter being typed, so the typing hand
     never leaves the home row. Returns the finger id of that pinky
     ('lp'/'rp'), or null when the base finger doesn't have an
     opposite pinky to speak of (thumb/space, unknown key). */
  function ladoMayusOpuesto(finger) {
    if (!finger || finger === 'th') return null;
    return finger.charAt(0) === 'l' ? 'rp' : 'lp';
  }

  /* ---------- Hand guide ---------- */
  function manosSVG(activo, activoMayus) {
    function dedo(f, x, y, h) {
      var clases = 'dedo f-' + f + (activo === f ? ' activo' : '') + (activoMayus === f ? ' activo-mayus' : '');
      return '<rect class="' + clases + '" x="' + x + '" y="' + y + '" width="32" height="' + h + '" rx="15"/>';
    }
    function pulgar(x) {
      var act = (activo === 'th') ? ' activo' : '';
      return '<rect class="dedo f-th' + act + '" x="' + x + '" y="112" width="42" height="28" rx="14"/>';
    }
    return '<svg viewBox="0 0 405 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      dedo('lp', 0, 48, 60) + dedo('lr', 38, 26, 82) + dedo('lm', 76, 16, 92) + dedo('li', 114, 26, 82) +
      '<rect class="palma" x="0" y="96" width="146" height="70" rx="22"/>' + pulgar(147) +
      pulgar(216) + dedo('ri', 259, 26, 82) + dedo('rm', 297, 16, 92) + dedo('rr', 335, 26, 82) + dedo('rp', 373, 48, 60) +
      '<rect class="palma" x="259" y="96" width="146" height="70" rx="22"/>' +
      '<text x="73" y="192">' + App.i18n.t('izquierdaEtiqueta') + '</text>' +
      '<text x="332" y="192">' + App.i18n.t('derechaEtiqueta') + '</text>' +
      '</svg>';
  }

  function pintarManos(dedo, dedoMayus) {
    $('#manosSvg').innerHTML = manosSVG(dedo, dedoMayus);
    var texto;
    if (dedo === 'th') texto = App.i18n.t('pulgarTexto');
    else if (dedo) {
      texto = App.i18n.t('manoDedoTexto')
        .replace('{mano}', App.i18n.t('dedo.' + dedo + '.mano'))
        .replace('{dedo}', App.i18n.t('dedo.' + dedo + '.nombre'));
      if (dedoMayus) texto += ' ' + App.i18n.t('mayusTexto').replace('{mano}', App.i18n.t('dedo.' + dedoMayus + '.mano'));
    }
    else texto = App.i18n.t('buscaTecla');
    $('#guiaTexto').textContent = texto;
  }

  /* ---------- Pantallas ---------- */
  function mostrarPantalla(id) {
    PANTALLAS.forEach(function (p) {
      document.getElementById(p).classList.toggle('hidden', p !== id);
    });
  }

  function irMenu() {
    pintarMenu();
    mostrarPantalla('pantallaMenu');
  }

  function irLecciones() {
    pintarLecciones();
    mostrarPantalla('pantallaLecciones');
  }

  function irNombre() {
    $('#inputNombre').value = state.nombre;
    $('#avisoNombre').textContent = '';
    mostrarPantalla('pantallaNombre');
    $('#inputNombre').focus();
  }

  function irLibre() {
    mostrarPantalla('pantallaLibre');
    $('#areaLibre').focus();
  }

  function lecciones() { return DATA.lessons[App.i18n.locale()] || DATA.lessons.es; }
  function plantillas() { return DATA.templates[App.i18n.locale()] || DATA.templates.es; }

  function pintarMenu() {
    $('#saludo').textContent = state.nombre
      ? App.i18n.t('saludoConNombre').replace('{nombre}', bonito(state.nombre))
      : App.i18n.t('saludoHola');
    var todasLecciones = lecciones();
    var hechas = todasLecciones.filter(function (l) { return state.completado[l.id]; }).length;
    var todasPlantillas = plantillas();
    var hechasPlantillas = todasPlantillas.filter(function (p) { return state.completado['plantilla_' + p.id]; }).length;
    $$('.tarjeta-modo').forEach(function (t) {
      var badge = t.querySelector('.hecho');
      var m = t.dataset.modo;
      if (m === 'lecciones') badge.textContent = hechas > 0 ? App.i18n.t('deTexto').replace('{hechas}', hechas).replace('{total}', todasLecciones.length) : '';
      else if (m === 'plantillas') badge.textContent = hechasPlantillas > 0 ? App.i18n.t('deTexto').replace('{hechas}', hechasPlantillas).replace('{total}', todasPlantillas.length) : '';
      else badge.textContent = state.completado[m] ? '⭐' : '';
    });
    actualizarEstrellas();
  }

  function pintarLecciones() {
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
        b.addEventListener('click', function () { jugarLeccion(l); });
      } else {
        b.disabled = true;
        b.setAttribute('aria-label', App.i18n.t('leccionCerradaAria').replace('{n}', i + 1));
      }
      cont.appendChild(b);
    });
  }

  /* "Real texts" (plantillas): unlike pintarLecciones(), every entry
     is always open -- these are independent practice texts, not a
     graded, linearly-unlocked curriculum. */
  function pintarPlantillas() {
    var cont = $('#listaPlantillas');
    cont.innerHTML = '';
    plantillas().forEach(function (p, i) {
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
      b.addEventListener('click', function () { jugarPlantilla(p); });
      cont.appendChild(b);
    });
  }

  function irPlantillas() {
    pintarPlantillas();
    mostrarPantalla('pantallaPlantillas');
  }

  /* ---------- Motor de secuencias ---------- */
  function iniciarSecuencia(cfg) {
    game = { type: 'seq', cfg: cfg, idx: 0, pos: 0, esperando: false };
    $('#tituloJuego').textContent = cfg.titulo;
    var enNumpad = cfg.modo === 'numeros';
    $('#panelTeclado').classList.toggle('hidden', enNumpad);
    $('#panelNumpad').classList.toggle('hidden', !enNumpad);
    $('#zonaObjetivo').classList.remove('hidden');
    $('#zonaReto').classList.add('hidden');
    $('#guia').classList.remove('hidden');
    limpiarFeedback();
    iniciarMetricas();
    mostrarPantalla('pantallaJuego');
    cargarPaso();
  }

  function pasoActual() { return game.cfg.pasos[game.idx]; }

  /* A step is either a typed sequence ({ seq: 'hola' }, matched
     character by character) or a single special key ({ especial:
     'Home' }, matched in one shot against the raw KeyboardEvent.key --
     see DATA.lessons "Teclas especiales"/"Special keys" and
     normalizarTecla()). Special-key steps have no printable character
     and no fixed finger (the convention varies too much by keyboard),
     so they skip the finger-guide highlighting entirely. */
  function esPasoEspecial(p) { return !!p && typeof p.especial === 'string'; }

  function charEsperado() {
    var p = pasoActual();
    return (p && !esPasoEspecial(p)) ? p.seq[game.pos] : null;
  }

  function cargarPaso() {
    game.pos = 0;
    $('#instruccionJuego').textContent = pasoActual().text || '';
    renderObjetivo();
    actualizarGuia();
  }

  function renderObjetivo() {
    var p = pasoActual();
    var zona = $('#zonaObjetivo');
    zona.innerHTML = '';
    /* "Real texts" (plantilla) lines are full sentences, unlike the
       single letter/word targets of the other modes -- wrapping
       letter-by-letter breaks words mid-way across the line. Grouping
       each word's letters in a nested flex span keeps a word together
       as one wrap unit while spaces stay valid wrap points; the
       smaller '--compacta' box size (styles.css) fits more of a
       sentence per line before that wrap is even needed. */
    var compacto = game.cfg.modo === 'plantilla';
    zona.classList.toggle('objetivo-zona--compacta', compacto);
    if (esPasoEspecial(p)) {
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

  /* charEsperado() keeps its original case ('A' for a required capital)
     so renderObjetivo() can display it as typed. Everything that looks
     up a physical key (finger tables, data-ch on the on-screen keyboard)
     needs the base lowercase letter instead -- there's no separate 'A'
     key, just 'a' held with Shift. */
  function charBaseEsperado() {
    var ch = charEsperado();
    return ch ? ch.toLowerCase() : null;
  }

  function mayusEsperado() {
    var ch = charEsperado();
    return !!ch && ch !== ch.toLowerCase();
  }

  function actualizarGuia() {
    if (esPasoEspecial(pasoActual())) {
      marcarObjetivo(pasoActual().especial);
      pintarManos(null, null);
      return;
    }
    var base = charBaseEsperado();
    var finger = dedoDe(base, game.cfg.modo === 'numeros');
    marcarObjetivo(base);
    pintarManos(finger, mayusEsperado() ? ladoMayusOpuesto(finger) : null);
  }

  function limpiarFeedback() {
    var f = $('#feedback');
    f.textContent = '';
    f.className = 'feedback';
  }

  function teclaJuego(ch, mayus) {
    if (game.esperando) return;
    var p = pasoActual();
    state.metricas.teclas += 1;

    if (esPasoEspecial(p)) {
      /* Single-action step: no character sequence to walk through,
         it's done as soon as the right key is detected. */
      if (ch === p.especial) {
        state.metricas.aciertos += 1;
        actualizarMetricasVivas();
        pasoCompletado(ch);
      } else {
        state.metricas.fallos += 1;
        actualizarMetricasVivas();
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
      renderObjetivo();
      actualizarMetricasVivas();
      if (game.pos >= seq.length) pasoCompletado(ch);
      else actualizarGuia();
    } else {
      state.metricas.fallos += 1;
      actualizarMetricasVivas();
      teclasDe(ch).forEach(function (t) {
        t.classList.add('fallo');
        setTimeout(function () { t.classList.remove('fallo'); }, 500);
      });
      App.feedback.encourage($('#feedback'));
    }
  }

  function pasoCompletado(ultimoCh) {
    game.esperando = true;
    marcarObjetivo(null);
    /* The success tone for the last key of the step is panned to that
       key's column (spatial-sound option). Earlier keystrokes inside
       the same step are silent in feedback.js; only the step-complete
       "ding" is panned. */
    App.feedback.success($('#feedback'), panDe(ultimoCh));
    setTimeout(function () {
      if (!game) return;
      game.esperando = false;
      game.idx += 1;
      if (game.idx >= game.cfg.pasos.length) {
        terminarSecuencia();
      } else {
        limpiarFeedback();
        cargarPaso();
      }
    }, 1000);
  }

  function terminarSecuencia() {
    var cfg = game.cfg;
    game = null;
    premiar(cfg.claveEstrella);
    celebrarConTransferencia(cfg.alTerminar);
  }

  /* ---------- Modos de juego ---------- */
  function jugarPosicion() {
    iniciarSecuencia({
      modo: 'posicion', titulo: App.i18n.t('modoPosicionNombre'),
      pasos: DATA.placement[App.i18n.locale()] || DATA.placement.es,
      claveEstrella: 'posicion', alTerminar: irMenu
    });
  }

  function jugarLeccion(l) {
    /* Most lessons' steps are plain strings (a typed sequence). The
       special-keys lesson uses { especial: 'inicio' } objects instead
       -- see esPasoEspecial(). */
    var pasos = l.steps.map(function (s) {
      return typeof s === 'string' ? { text: l.intro, seq: s } : { text: l.intro, especial: s.especial };
    });
    iniciarSecuencia({
      modo: 'leccion', titulo: App.i18n.t('leccionTitulo').replace('{titulo}', l.title),
      pasos: pasos, claveEstrella: l.id, alTerminar: irLecciones
    });
  }

  function jugarPalabras() {
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
    iniciarSecuencia({
      modo: 'palabras', titulo: App.i18n.t('modoPalabrasNombre'),
      pasos: pasos, claveEstrella: 'palabras', alTerminar: irMenu
    });
  }

  function jugarPlantilla(p) {
    var pasos = p.lines.map(function (linea) {
      return { text: App.i18n.t('plantillaInstruccion'), seq: linea };
    });
    iniciarSecuencia({
      modo: 'plantilla', titulo: p.title,
      pasos: pasos, claveEstrella: 'plantilla_' + p.id, alTerminar: irPlantillas
    });
  }

  function jugarNumeros() {
    iniciarSecuencia({
      modo: 'numeros', titulo: App.i18n.t('modoNumerosNombre'),
      pasos: DATA.numpadSteps[App.i18n.locale()] || DATA.numpadSteps.es,
      claveEstrella: 'numeros', alTerminar: irMenu
    });
  }

  /* ---------- Reto: todas las teclas ---------- */
  function jugarReto() {
    game = { type: 'reto', set: {} };
    $('#tituloJuego').textContent = App.i18n.t('tituloTodasLasTeclas');
    $('#instruccionJuego').textContent = App.i18n.t('instruccionTodasLasTeclas');
    $('#panelTeclado').classList.remove('hidden');
    $('#panelNumpad').classList.add('hidden');
    $('#zonaObjetivo').classList.add('hidden');
    $('#zonaReto').classList.remove('hidden');
    $('#guia').classList.remove('hidden');
    limpiarFeedback();
    marcarObjetivo(null);
    $$('.tecla.hecha').forEach(function (t) { t.classList.remove('hecha'); });
    iniciarMetricas();
    mostrarPantalla('pantallaJuego');
    actualizarReto();
  }

  function teclaReto(ch) {
    var visibles = clavesTipeables(filasVisibles());
    if (!visibles[ch] || game.set[ch]) return;
    game.set[ch] = true;
    state.metricas.teclas += 1;
    state.metricas.aciertos += 1;
    actualizarMetricasVivas();
    teclasDe(ch).forEach(function (t) { t.classList.add('hecha'); });
    /* Quiet per-key ack: just the "ding" panned to that column.
       Avoids spamming success messages during the challenge but lets
       the spatial-sound option be audible. */
    App.feedback.sonidoAcierto(panDe(ch));
    actualizarReto();
  }

  function reaplicarReto() {
    Object.keys(game.set).forEach(function (ch) {
      teclasDe(ch).forEach(function (t) { t.classList.add('hecha'); });
    });
    actualizarReto();
  }

  /* Pick the next key the player still has to press in the "all keys"
     challenge. Iteration is stable (layout row order) so the player
     sees a predictable left-to-right, top-to-bottom rhythm instead of
     a random-looking highlight jumping around. */
  function siguienteTeclaPendiente() {
    var pendientes = null;
    filasVisibles().forEach(function (f) {
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
  function guiaReto() {
    var k = siguienteTeclaPendiente();
    if (!k) {
      marcarObjetivo(null);
      $('#guiaTexto').textContent = '';
      $('#manosSvg').innerHTML = manosSVG(null, null);
      return;
    }
    var ch = k.ch;
    var enNumpad = !!DATA.numpadFingers[ch];
    var finger = dedoDe(ch, enNumpad);
    marcarObjetivo(ch);
    pintarManos(finger, null);
    var teclaTxt;
    if (ch === ' ') teclaTxt = App.i18n.t('teclaLabel.espacio') || ch;
    else if (ch.length === 1 && /[a-zA-Z]/.test(ch)) teclaTxt = ch.toUpperCase();
    else teclaTxt = ch;
    var texto;
    if (finger === 'th') {
      texto = App.i18n.t('retoSiguientePulgar').replace('{tecla}', teclaTxt);
    } else if (finger) {
      texto = App.i18n.t('retoSiguiente')
        .replace('{tecla}', teclaTxt)
        .replace('{dedo}', App.i18n.t('dedo.' + finger + '.nombre'))
        .replace('{mano}', App.i18n.t('dedo.' + finger + '.mano'));
    } else {
      texto = App.i18n.t('buscaTecla');
    }
    $('#guiaTexto').textContent = texto;
  }

  function actualizarReto() {
    var total = 0, hechas = 0;
    filasVisibles().forEach(function (f) {
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
      marcarObjetivo(null);
      $('#guiaTexto').textContent = '';
      $('#manosSvg').innerHTML = manosSVG(null, null);
      premiar('todas');
      celebrarConTransferencia(irMenu);
      return;
    }
    guiaReto();
  }

  /* ---------- Physical keyboard: the only real input ---------- */
  /* Maps the DOM KeyboardEvent.key value of each "less frequent key"
     (see DATA.lessons "Teclas especiales"/"Special keys") to an
     internal id. The id is what ends up in data-ch on the on-screen
     decorative key (DATA.layouts.extendido) and in a lesson step's
     `especial` field -- normalizarTecla() is the only place that knows
     about the real DOM key names, same as it's the only place that
     knows 'Spacebar' means ' '. */
  var TECLA_ESPECIAL_DOM = { Home: 'inicio', End: 'fin', PageUp: 'pagArriba', PageDown: 'pagAbajo', Delete: 'suprimir' };

  function normalizarTecla(k) {
    if (k === 'Spacebar') k = ' ';
    if (TECLA_ESPECIAL_DOM[k]) return TECLA_ESPECIAL_DOM[k];
    if (typeof k !== 'string' || k.length !== 1) return null;
    return k.toLowerCase();
  }

  document.addEventListener('keydown', function (e) {
    if (ajustesAbiertos()) {
      if (e.key === 'Escape') cerrarAjustes();
      else manejarTabDrawer(e);
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var ch = normalizarTecla(e.key);
    if (!ch) return;
    flashTecla(ch, true);
    var foco = document.activeElement;
    if (foco && (foco.tagName === 'INPUT' || foco.tagName === 'TEXTAREA')) return;
    if (!game) return;
    e.preventDefault();
    if (e.repeat) return;
    if (game.type === 'reto') teclaReto(ch);
    else teclaJuego(ch, e.shiftKey);
  });

  document.addEventListener('keyup', function (e) {
    var ch = normalizarTecla(e.key);
    if (ch) flashTecla(ch, false);
  });

  /* ---------- Keyboard options (delegation: there are several panels) ---------- */
  document.addEventListener('click', function (e) {
    var bt = e.target.closest('.btn-teclado');
    if (bt) {
      state.opciones.teclado = bt.dataset.teclado;
      guardar();
      renderTeclados();
      return;
    }
    var bc = e.target.closest('.btn-color');
    if (bc) {
      state.opciones.color = state.opciones.color === 'manos' ? 'dedos' : 'manos';
      guardar();
      renderTeclados();
    }
  });

  /* ---------- Nombre ---------- */
  function guardarNombre() {
    var v = $('#inputNombre').value.trim().slice(0, 20);
    state.nombre = v;
    guardar();
    /* Audio only plays if the user taps the "Listen" button (btnLeerNombre) */
    irMenu();
  }

  $('#btnGuardarNombre').addEventListener('click', guardarNombre);
  $('#btnSinNombre').addEventListener('click', function () {
    state.nombre = '';
    guardar();
    irMenu();
  });
  $('#inputNombre').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      guardarNombre();
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
        teclado: 'simplificado', color: 'manos', tema: 'auto', texto: 'normal',
        foco: false, espacial: false, metricas: false
      }
    };
    guardar();
    btn.textContent = App.i18n.t('btnBorrarProgreso');
    $('#inputNombre').value = '';
    $('#avisoNombre').textContent = App.i18n.t('avisoBorrado');
    renderTeclados();
    aplicarOpciones();
    actualizarEstrellas();
  });

  /* ---------- Menu and navigation ---------- */
  $('#menuJuegos').addEventListener('click', function (e) {
    var t = e.target.closest('.tarjeta-modo');
    if (!t) return;
    var m = t.dataset.modo;
    if (m === 'posicion') jugarPosicion();
    else if (m === 'lecciones') irLecciones();
    else if (m === 'palabras') jugarPalabras();
    else if (m === 'todas') jugarReto();
    else if (m === 'numeros') jugarNumeros();
    else if (m === 'libre') irLibre();
    else if (m === 'plantillas') irPlantillas();
  });

  $('#btnLeerSaludo').addEventListener('click', function () {
    App.tts.speak($('#saludo').textContent + ' ' + App.i18n.t('eligeJuego'));
  });

  $('#btnCambiarNombre').addEventListener('click', irNombre);
  $('#btnVolverMenu').addEventListener('click', irMenu);
  $('#btnVolverMenuPlantillas').addEventListener('click', irMenu);

  $('#btnSalirJuego').addEventListener('click', function () {
    var modo = game && game.cfg ? game.cfg.modo : null;
    game = null;
    App.tts.stop();
    marcarObjetivo(null);
    if (modo === 'leccion') irLecciones();
    else if (modo === 'plantilla') irPlantillas();
    else irMenu();
  });

  $('#btnLeerJuego').addEventListener('click', function () {
    var texto = $('#tituloJuego').textContent + '. ' + $('#instruccionJuego').textContent;
    if (game && game.type === 'seq') texto += ' ' + $('#guiaTexto').textContent;
    App.tts.speak(texto);
  });

  /* ---------- Escritura libre ---------- */
  $('#btnSalirLibre').addEventListener('click', irMenu);
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
  pintarFilas($('#numpad'), DATA.numpad);
  renderTeclados();
  aplicarOpciones();
  actualizarEstrellas();
  if (state.nombre) irMenu();
  else irNombre();
})();
