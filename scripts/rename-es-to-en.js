#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * One-shot codemod: rename Spanish identifiers to English per the
 * language policy in CLAUDE.md ("Technical code: always English").
 *
 * The mappings below were hand-curated after auditing app.js and
 * assets/js/*. Word boundaries (\b) are used so substrings like
 * "mano" inside other identifiers or comments don't get clobbered.
 *
 * Run: node scripts/rename-es-to-en.js
 * It rewrites the target files in place. Run scripts/check.js after
 * to make sure the repo still validates.
 */

'use strict';

var fs = require('fs');
var path = require('path');

/* Order matters: longer names first so 'pintarFilas' is replaced
   before 'pintar' would otherwise be (we don't have a plain 'pintar'
   mapping, but the principle applies generally). */
var RENAMES = [
  /* app.js functions (alphabetical) */
  ['guardar', 'save'],
  ['bonito', 'capitalize'],
  ['mensajeFinal', 'finalMessage'],
  ['celebrarConTransferencia', 'celebrateWithTransfer'],
  ['actualizarEstrellas', 'updateStars'],
  ['premiar', 'award'],
  ['filasVisibles', 'visibleRows'],
  ['esExtendido', 'isExtended'],
  ['clavesTipeables', 'typeableKeys'],
  ['dedoDe', 'fingerOf'],
  ['panDe', 'panOf'],
  ['crearTecla', 'createKey'],
  ['pintarFilas', 'renderRows'],
  ['actualizarOpcionesUI', 'updateOptionsUI'],
  ['etiquetaOnOff', 'onOffLabel'],
  ['actualizarBotonAjuste', 'updateSettingsButton'],
  ['aplicarOpciones', 'applyOptions'],
  ['elementosFocalizablesAjustes', 'focusableSettingsElements'],
  ['ajustesAbiertos', 'settingsOpen'],
  ['abrirAjustes', 'openSettings'],
  ['cerrarAjustes', 'closeSettings'],
  ['manejarTabDrawer', 'handleDrawerTab'],
  ['iniciarMetricas', 'startMetrics'],
  ['actualizarMetricasVivas', 'updateLiveMetrics'],
  ['teclasDe', 'keysOf'],
  ['flashTecla', 'flashKey'],
  ['marcarObjetivo', 'markTarget'],
  ['ladoMayusOpuesto', 'oppositeShiftSide'],
  ['manosSVG', 'handsSVG'],
  ['pintarManos', 'renderHands'],
  ['mostrarPantalla', 'showScreen'],
  ['irMenu', 'goMenu'],
  ['irLecciones', 'goLessons'],
  ['irNombre', 'goName'],
  ['irLibre', 'goFree'],
  ['plantillas', 'templates'],
  ['pintarMenu', 'renderMenu'],
  ['pintarLecciones', 'renderLessons'],
  ['pintarPlantillas', 'renderTemplates'],
  ['irPlantillas', 'goTemplates'],
  ['iniciarSecuencia', 'startSequence'],
  ['pasoActual', 'currentStep'],
  ['esPasoEspecial', 'isSpecialStep'],
  ['charEsperado', 'expectedChar'],
  ['cargarPaso', 'loadStep'],
  ['renderObjetivo', 'renderTarget'],
  ['charBaseEsperado', 'expectedBaseChar'],
  ['mayusEsperado', 'expectedShift'],
  ['actualizarGuia', 'updateGuide'],
  ['limpiarFeedback', 'clearFeedback'],
  ['teclaJuego', 'gameKey'],
  ['pasoCompletado', 'stepCompleted'],
  ['terminarSecuencia', 'endSequence'],
  ['jugarPosicion', 'playPosition'],
  ['jugarLeccion', 'playLesson'],
  ['jugarPalabras', 'playWords'],
  ['jugarPlantilla', 'playTemplate'],
  ['jugarNumeros', 'playNumbers'],
  ['jugarReto', 'playChallenge'],
  ['teclaReto', 'challengeKey'],
  ['reaplicarReto', 'reapplyChallenge'],
  ['siguienteTeclaPendiente', 'nextPendingKey'],
  ['guiaReto', 'challengeGuide'],
  ['actualizarReto', 'updateChallenge'],
  ['normalizarTecla', 'normalizeKey'],
  ['guardarNombre', 'saveName']
];

var TARGETS = ['app.js'];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renameInFile(file) {
  var p = path.resolve(file);
  var src = fs.readFileSync(p, 'utf8');
  var original = src;
  var touched = 0;
  for (var i = 0; i < RENAMES.length; i++) {
    var from = RENAMES[i][0];
    var to = RENAMES[i][1];
    /* \b boundaries so 'dedo' inside 'dedoDe' isn't touched
       before dedoDe has its chance (and so 'pan' inside 'panDe'
       stays put until the explicit 'panDe' entry runs). */
    var re = new RegExp('\\b' + escapeRegExp(from) + '\\b', 'g');
    var matches = src.match(re);
    if (matches && matches.length) {
      src = src.replace(re, to);
      touched += matches.length;
      console.log('  ' + file + ': ' + from + ' -> ' + to + ' (' + matches.length + ')');
    }
  }
  if (src !== original) {
    fs.writeFileSync(p, src, 'utf8');
    console.log('  wrote ' + file + ' (' + touched + ' substitutions)');
  } else {
    console.log('  no changes in ' + file);
  }
}

console.log('Renaming identifiers: Spanish -> English');
for (var j = 0; j < TARGETS.length; j++) renameInFile(TARGETS[j]);
console.log('Done.');
