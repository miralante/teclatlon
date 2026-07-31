#!/usr/bin/env node
/* ============================================================
   Teclatlon — scripts/check.js
   Structural check with no dependencies (plain Node only).
   Usage: node scripts/check.js
   Checks:
   1. That every .js file at the repo root, in assets/js/ and legal/
      parses (equivalent to `node --check`).
   2. es/en key parity between strings.es.js and strings.en.js
      (root app and legal/).
   3. sw.js <-> disk parity: every ARCHIVOS path exists.
   4. manifest.json icons exist on disk.
   Output: list of failures with the exact file. Exit code 1 if there
   are any, "OK (N checks)" otherwise.
   ============================================================ */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var execFileSync = require('child_process').execFileSync;

var RAIZ = path.join(__dirname, '..');
var fallos = [];
var checks = 0;

function rel(p) {
  return path.relative(RAIZ, p).split(path.sep).join('/');
}

function listarJs(dir) {
  var out = [];
  if (!fs.existsSync(dir)) return out;
  (function recorrer(actual) {
    var entradas = fs.readdirSync(actual, { withFileTypes: true });
    entradas.forEach(function (entrada) {
      var full = path.join(actual, entrada.name);
      if (entrada.isDirectory()) {
        recorrer(full);
      } else if (entrada.isFile() && entrada.name.endsWith('.js')) {
        out.push(full);
      }
    });
  })(dir);
  return out;
}

/* --- 1. node --check on the root app, assets/js/ and legal/ --- */
var archivosJs = fs.readdirSync(RAIZ, { withFileTypes: true })
  .filter(function (e) { return e.isFile() && e.name.endsWith('.js'); })
  .map(function (e) { return path.join(RAIZ, e.name); })
  .concat(listarJs(path.join(RAIZ, 'assets', 'js')))
  .concat(listarJs(path.join(RAIZ, 'legal')))
  .concat(listarJs(path.join(RAIZ, 'scripts')));

archivosJs.forEach(function (archivo) {
  checks += 1;
  try {
    execFileSync(process.execPath, ['--check', archivo], { stdio: 'pipe' });
  } catch (e) {
    fallos.push(rel(archivo) + ': no parsea (node --check) — ' +
      (e.stderr ? e.stderr.toString().trim().split('\n')[0] : e.message));
  }
});

/* --- 2. es/en key parity --- */
function extraerDictDeStrings(archivo) {
  var capturado = null;
  var sandbox = { App: { i18n: { register: function (dict, loc) {
    if (typeof loc === 'string') capturado = dict;
  } } }, window: {} };
  sandbox.window = sandbox;
  try {
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(archivo, 'utf8'), sandbox, { filename: archivo });
  } catch (e) {
    return null;
  }
  return capturado;
}

function clavesPlanas(obj, prefijo) {
  var out = [];
  Object.keys(obj || {}).forEach(function (k) {
    var clave = prefijo ? prefijo + '.' + k : k;
    var valor = obj[k];
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      out = out.concat(clavesPlanas(valor, clave));
    } else {
      out.push(clave);
    }
  });
  return out;
}

function compararEsEn(dir, etiqueta) {
  var archivoEs = path.join(dir, 'strings.es.js');
  var archivoEn = path.join(dir, 'strings.en.js');
  if (!fs.existsSync(archivoEs) || !fs.existsSync(archivoEn)) return;
  checks += 1;
  var dictEs = extraerDictDeStrings(archivoEs);
  var dictEn = extraerDictDeStrings(archivoEn);
  if (!dictEs || !dictEn) {
    fallos.push(etiqueta + ': no se han podido extraer los dicts es/en');
    return;
  }
  var clavesEs = clavesPlanas(dictEs, '').sort();
  var clavesEn = clavesPlanas(dictEn, '').sort();
  var soloEs = clavesEs.filter(function (c) { return clavesEn.indexOf(c) === -1; });
  var soloEn = clavesEn.filter(function (c) { return clavesEs.indexOf(c) === -1; });
  if (soloEs.length || soloEn.length) {
    var detalle = [];
    if (soloEs.length) detalle.push('solo en es: ' + soloEs.join(', '));
    if (soloEn.length) detalle.push('solo en en: ' + soloEn.join(', '));
    fallos.push(etiqueta + ': ' + detalle.join('; '));
  }
}

compararEsEn(RAIZ, 'strings.<locale>.js');
compararEsEn(path.join(RAIZ, 'legal'), 'legal/');

/* --- 3. sw.js <-> disk parity --- */
checks += 1;
var swContenido = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8');
var matchArchivos = swContenido.match(/var ARCHIVOS = \[([\s\S]*?)\];/);
if (!matchArchivos) {
  fallos.push('sw.js: no se ha encontrado el array ARCHIVOS');
} else {
  var re = /'([^']+)'/g;
  var m;
  while ((m = re.exec(matchArchivos[1])) !== null) {
    var full = path.join(RAIZ, m[1].replace(/^\.\//, ''));
    if (!fs.existsSync(full)) {
      fallos.push('sw.js: ARCHIVOS incluye ' + m[1] + ' pero no existe en disco');
    }
  }
}

/* --- 4. manifest.json icons exist --- */
checks += 1;
var manifest = JSON.parse(fs.readFileSync(path.join(RAIZ, 'manifest.json'), 'utf8'));
(manifest.icons || []).forEach(function (icono) {
  var full = path.join(RAIZ, icono.src.replace(/^\.\//, ''));
  if (!fs.existsSync(full)) {
    fallos.push('manifest.json: icono ' + icono.src + ' no existe en disco');
  }
});

/* --- Result --- */
if (fallos.length) {
  console.log('FALLOS (' + fallos.length + '):');
  fallos.forEach(function (f) { console.log('  - ' + f); });
  process.exitCode = 1;
} else {
  console.log('OK (' + checks + ' checks)');
}
