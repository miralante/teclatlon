#!/usr/bin/env node
/* ============================================================
   Teclatlon · scripts/check.js
   Structural check with no dependencies (plain Node only).
   Usage: node scripts/check.js
   Checks:
   1. That every .js file at the repo root, in assets/js/, legal/ and
      scripts/ parses (equivalent to `node --check`).
   2. strings.<locale>.js key parity across every supported locale
      (root app and legal/) — N-locales, not just es/en.
   3. sw.js <-> disk parity: every ARCHIVOS path exists.
   4. manifest.json icons exist on disk.
   5. Mandatory rule: zero mentions of disability, occupational therapy
      or minors in user-facing files (see doc/<locale>/SPEC.md §4).
   Output: list of failures with the exact file. Exit code 1 if there
   are any, "OK (N checks)" otherwise.
   ============================================================ */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var execFileSync = require('child_process').execFileSync;

var ROOT = path.join(__dirname, '..');
var failures = [];
var checks = 0;

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function listJs(dir) {
  var out = [];
  if (!fs.existsSync(dir)) return out;
  (function walk(current) {
    var entries = fs.readdirSync(current, { withFileTypes: true });
    entries.forEach(function (entry) {
      var full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        out.push(full);
      }
    });
  })(dir);
  return out;
}

/* --- 1. node --check on the root app, assets/js/, legal/ and scripts/ --- */
var jsFiles = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(function (e) { return e.isFile() && e.name.endsWith('.js'); })
  .map(function (e) { return path.join(ROOT, e.name); })
  .concat(listJs(path.join(ROOT, 'assets', 'js')))
  .concat(listJs(path.join(ROOT, 'legal')))
  .concat(listJs(path.join(ROOT, 'scripts')));

jsFiles.forEach(function (file) {
  checks += 1;
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (e) {
    failures.push(rel(file) + ': does not parse (node --check) — ' +
      (e.stderr ? e.stderr.toString().trim().split('\n')[0] : e.message));
  }
});

/* --- 2. strings.<locale>.js key parity across all supported locales --- */
/* When adding a new supported language, add its strings.<locale>.js
   file (and the corresponding legal/strings.<locale>.js if the legal
   page has localized copy). This check picks them up automatically —
   no change to this script is needed. The check verifies every file
   whose name matches `strings.<locale>.js` has the exact same key set
   as every other one. `es` is the default and source of truth. */
function extractDictFromStrings(file) {
  var captured = null;
  var sandbox = { App: { i18n: { register: function (dict, loc) {
    if (typeof loc === 'string') captured = dict;
  } } }, window: {} };
  sandbox.window = sandbox;
  try {
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  } catch (e) {
    return null;
  }
  return captured;
}

function flattenKeys(obj, prefix) {
  var out = [];
  Object.keys(obj || {}).forEach(function (k) {
    var key = prefix ? prefix + '.' + k : k;
    var value = obj[k];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out = out.concat(flattenKeys(value, key));
    } else {
      out.push(key);
    }
  });
  return out;
}

function compareLocales(dir, label) {
  var entries = fs.readdirSync(dir)
    .filter(function (name) { return /^strings\.[a-zA-Z0-9-]+\.js$/.test(name); });
  if (entries.length < 2) return;
  checks += 1;
  var dicts = {};
  entries.forEach(function (name) {
    var d = extractDictFromStrings(path.join(dir, name));
    if (!d) {
      failures.push(label + ': could not extract dict from ' + name);
      return;
    }
    dicts[name] = flattenKeys(d, '').sort();
  });
  if (failures.length && failures[failures.length - 1].indexOf('could not extract') !== -1) return;
  var names = Object.keys(dicts);
  var reference = names[0];
  names.slice(1).forEach(function (name) {
    var a = dicts[reference], b = dicts[name];
    var onlyA = a.filter(function (k) { return b.indexOf(k) === -1; });
    var onlyB = b.filter(function (k) { return a.indexOf(k) === -1; });
    if (onlyA.length || onlyB.length) {
      var detail = [];
      if (onlyA.length) detail.push('only in ' + reference + ': ' + onlyA.join(', '));
      if (onlyB.length) detail.push('only in ' + name + ': ' + onlyB.join(', '));
      failures.push(label + ': ' + detail.join('; '));
    }
  });
}

compareLocales(ROOT, 'strings.<locale>.js');
compareLocales(path.join(ROOT, 'legal'), 'legal/');

/* --- 3. sw.js <-> disk parity --- */
checks += 1;
var swContent = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
var archivosMatch = swContent.match(/var ARCHIVOS = \[([\s\S]*?)\];/);
if (!archivosMatch) {
  failures.push('sw.js: ARCHIVOS array not found');
} else {
  var re = /'([^']+)'/g;
  var m;
  while ((m = re.exec(archivosMatch[1])) !== null) {
    var full = path.join(ROOT, m[1].replace(/^\.\//, ''));
    if (!fs.existsSync(full)) {
      failures.push('sw.js: ARCHIVOS lists ' + m[1] + ' but it does not exist on disk');
    }
  }
}

/* --- 4. manifest.json icons exist --- */
checks += 1;
var manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
(manifest.icons || []).forEach(function (icon) {
  var full = path.join(ROOT, icon.src.replace(/^\.\//, ''));
  if (!fs.existsSync(full)) {
    failures.push('manifest.json: icon ' + icon.src + ' does not exist on disk');
  }
});

/* --- 5. Mandatory rule: zero disability / occupational therapy / minors mentions ---
   doc/es/SPEC.md §4: el usuario final nunca ve términos que nombren
   discapacidad, terapia ocupacional o menores. Esta comprobación solo
   cubre los archivos que el usuario visita; los docs internos
   (SPEC.md, README.md, CONTRIBUTING.md, CLAUDE.md) están fuera de
   alcance por diseño (explican el objetivo real del proyecto, que es
   justo la razón de ser de esta regla).

   Cada entrada empareja un modo de coincidencia: substring para
   frases en español y tallos inequívocos en inglés; word-boundary
   para palabras en inglés que darían falsos positivos como
   substring (p. ej. "minor" dentro de "minor annoyance"). */
checks += 1;
var FORBIDDEN_TERMS = [
  { term: 'discapacidad', match: 'substring' },
  { term: 'disabilit', match: 'substring' },
  { term: 'intelectual', match: 'substring' },
  { term: 'intellectual', match: 'substring' },
  { term: 'terapia ocupacional', match: 'substring' },
  { term: 'occupational therap', match: 'substring' },
  { term: 'dificultades cognitivas', match: 'substring' },
  { term: 'cognitive difficult', match: 'substring' },
  { term: 'necesidades especiales', match: 'substring' },
  { term: 'special needs', match: 'substring' },
  { term: 'capacidades diferentes', match: 'substring' },
  { term: 'different abilities', match: 'substring' },
  { term: 'menor de edad', match: 'substring' },
  { term: 'menores de edad', match: 'substring' },
  { term: 'personas menores', match: 'substring' },
  { term: 'menor que', match: 'substring' },
  { term: 'menores que', match: 'substring' },
  { term: 'menor', match: 'word' },
  { term: 'minor', match: 'word' },
  { term: 'underage', match: 'word' },
  { term: 'children', match: 'word' }
];
function isUserFile(file) {
  var name = path.basename(file).toLowerCase();
  return /\.html?$/.test(name) || /\.js$/.test(name);
}
function listFiles(dir) {
  var out = [];
  if (!fs.existsSync(dir)) return out;
  fs.readdirSync(dir).forEach(function (f) {
    var full = path.join(dir, f);
    if (fs.statSync(full).isFile() && isUserFile(full)) out.push(full);
  });
  return out;
}
var userFacingTargets = [path.join(ROOT, 'index.html')]
  .concat(listFiles(path.join(ROOT, 'legal')));
userFacingTargets.forEach(function (file) {
  var content = fs.readFileSync(file, 'utf8').toLowerCase();
  FORBIDDEN_TERMS.forEach(function (entry) {
    var term = entry.term;
    var hit;
    if (entry.match === 'word') {
      hit = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(content);
    } else {
      hit = content.indexOf(term.toLowerCase()) !== -1;
    }
    if (hit) {
      failures.push(rel(file) + ': contains "' + term + '" — ninguna página visible puede mencionar discapacidad, terapia ocupacional o menores (ver doc/es/SPEC.md §4)');
    }
  });
});

/* --- Result --- */
if (failures.length) {
  console.log('FAILURES (' + failures.length + '):');
  failures.forEach(function (f) { console.log('  - ' + f); });
  process.exitCode = 1;
} else {
  console.log('OK (' + checks + ' checks)');
}
