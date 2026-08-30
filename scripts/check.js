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
   3. sw.js <-> disk parity: every FILES path exists.
   4. manifest.json icons exist on disk.
   5. Mandatory rule: zero mentions of disability, occupational therapy
      or minors in user-facing files (see doc/<locale>/SPEC.md §4).
   6. _headers: every quoted Content-Security-Policy source expression
      (e.g. 'self') has exactly one leading and one trailing quote —
      catches malformed quoting like ''self'' that browsers silently
      drop, turning a directive into "block everything" (see CLOUDFLARE.md
      "Also bump VERSION after any _headers change...").
   7. Usage vs. registration: every data-i18n / data-i18n-aria /
      data-i18n-title key referenced in index.html and legal/index.html,
      and every App.i18n.t('key') literal-prefixed call in app.js and
      assets/js/*.js, must resolve to a real key registered for EVERY
      supported locale (the built-in DICT in assets/js/i18n.js plus
      whatever strings.<locale>.js adds via register()). Catches a key
      that's used but missing/misspelled/never added to one locale —
      check 2 only compares locale files against each other, so it
      would pass even if a used key exists in neither of them.
      App.i18n.t() silently falls back to rendering the raw key name
      when a key isn't found, so this class of bug is invisible until
      someone spots literal key names on the live page.
   8. _redirects stays within Cloudflare's per-file limits
      (https://developers.cloudflare.com/pages/configuration/redirects/):
      a maximum of 2 000 static redirects and 100 dynamic
      (placeholder) redirects per file — 2 100 in total. If the file
      is absent (the common case for projects that have no redirects)
      the check is skipped: zero is valid.
   9. _headers stays within Cloudflare's per-file limit of 100
      header rules per file
      (https://developers.cloudflare.com/pages/configuration/headers/).
      A "rule" is one path-glob block (the glob line followed by
      indented header lines), so the wildcards of `/assets/*` plus
      its two Cache-Control lines count as one rule each, not three.
      If the file is absent the check is skipped.
  10. No shipped file exceeds Cloudflare Pages' 25 MB per-file
      limit. Recursively walks the repo, excluding `.git/`,
      `node_modules/`, `.claude/` (graphify skill + agent settings,
      never uploaded), and `graphify-out*` (build artifacts). Warns
      at 20 MB (still legal but worth a nudge) and fails at 25 MB
      (Cloudflare will reject the deploy).
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
var warnings = [];
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
var filesMatch = swContent.match(/var FILES = \[([\s\S]*?)\];/);
if (!filesMatch) {
  failures.push('sw.js: FILES array not found');
} else {
  var re = /'([^']+)'/g;
  var m;
  while ((m = re.exec(filesMatch[1])) !== null) {
    var full = path.join(ROOT, m[1].replace(/^\.\//, ''));
    if (!fs.existsSync(full)) {
      failures.push('sw.js: FILES lists ' + m[1] + ' but it does not exist on disk');
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
   doc/es/SPEC.md §4: the end user never sees terms naming disability,
   occupational therapy or minors. This check only covers the files
   the user actually visits; internal docs (SPEC.md, README.md,
   CONTRIBUTING.md, CLAUDE.md) are out of scope by design (they
   explain the project's real purpose, which is exactly why this rule
   exists).

   Each entry pairs a term with a match mode: substring for Spanish
   phrases and unambiguous English stems; word-boundary for English
   words that would give false positives as a substring (e.g. "minor"
   inside "minor annoyance"). */
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
  { term: 'minor', match: 'word' },
  { term: 'underage', match: 'word' },
  { term: 'children', match: 'word' },
  { term: 'paciente', match: 'word' },
  { term: 'patient', match: 'word' }
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
      failures.push(rel(file) + ': contains "' + term + '" — no visible page may mention disability, occupational therapy or minors (see doc/es/SPEC.md §4)');
    }
  });
});

/* --- 6. _headers: CSP source-expression quoting --- */
checks += 1;
var headersContent = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8');
var cspLine = headersContent.split('\n').filter(function (line) {
  return /^\s*Content-Security-Policy:/i.test(line);
});
if (!cspLine.length) {
  failures.push('_headers: no Content-Security-Policy line found');
} else {
  cspLine.forEach(function (line) {
    var value = line.replace(/^\s*Content-Security-Policy:/i, '');
    value.split(';').forEach(function (directive) {
      directive.trim().split(/\s+/).filter(Boolean).forEach(function (token) {
        var quoteCount = (token.match(/'/g) || []).length;
        if (quoteCount === 0) return;
        var wellFormed = quoteCount === 2 && token[0] === "'" && token[token.length - 1] === "'";
        if (!wellFormed) {
          failures.push('_headers: malformed CSP source expression "' + token +
            '" — quotes should wrap the keyword exactly once (e.g. \'self\', not \'\'self\'\')');
        }
      });
    });
  });
}

/* --- 7. Usage vs. registration: used i18n keys must be registered per locale --- */
/* Static extraction only — no browser/DOM involved. Two sources of
   "registered" keys per locale:
     a) the built-in DICT literal hardcoded in assets/js/i18n.js
        (core.*, feedback.*, always available, never redefined per
        strings.<locale>.js — see i18n.js's own comment above register());
     b) whatever each strings.<locale>.js adds via App.i18n.register(),
        already extracted by extractDictFromStrings() above.
   register() merges one level deep (DICT[loc][key] = dict[key] for
   each top-level key), so a top-level key in strings.<locale>.js fully
   replaces the same top-level key from the built-in DICT rather than
   deep-merging with it; mergedFlatKeys() below mirrors that. */
checks += 1;
function extractBalancedObject(src, openIndex) {
  var depth = 0, inStr = null;
  for (var i = openIndex; i < src.length; i++) {
    var ch = src[i];
    if (inStr) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(openIndex, i + 1);
    }
  }
  return null;
}

function builtinDict() {
  var file = path.join(ROOT, 'assets', 'js', 'i18n.js');
  if (!fs.existsSync(file)) return {};
  var src = fs.readFileSync(file, 'utf8');
  var marker = 'var DICT = ';
  var start = src.indexOf(marker);
  if (start === -1) return {};
  var block = extractBalancedObject(src, src.indexOf('{', start));
  if (!block) return {};
  try {
    var sandbox = {};
    vm.createContext(sandbox);
    return vm.runInContext('(' + block + ')', sandbox, { filename: file });
  } catch (e) {
    return {};
  }
}

function registeredDictsByLocale(dir) {
  var out = {};
  if (!fs.existsSync(dir)) return out;
  fs.readdirSync(dir)
    .filter(function (name) { return /^strings\.[a-zA-Z0-9-]+\.js$/.test(name); })
    .forEach(function (name) {
      var loc = name.match(/^strings\.([a-zA-Z0-9-]+)\.js$/)[1];
      var d = extractDictFromStrings(path.join(dir, name));
      if (d) out[loc] = d;
    });
  return out;
}

function mergedFlatKeys(builtinForLocale, registeredForLocale) {
  var merged = {};
  Object.keys(builtinForLocale || {}).forEach(function (k) { merged[k] = builtinForLocale[k]; });
  Object.keys(registeredForLocale || {}).forEach(function (k) { merged[k] = registeredForLocale[k]; });
  return flattenKeys(merged, '');
}

function extractHtmlKeys(file) {
  if (!fs.existsSync(file)) return [];
  var src = fs.readFileSync(file, 'utf8');
  var out = [];
  [
    /\bdata-i18n="([^"]+)"/g,
    /\bdata-i18n-aria="([^"]+)"/g,
    /\bdata-i18n-title="([^"]+)"/g
  ].forEach(function (re) {
    var m;
    while ((m = re.exec(src)) !== null) out.push({ key: m[1], file: rel(file) });
  });
  return out;
}

function extractJsI18nCalls(file) {
  if (!fs.existsSync(file)) return [];
  var src = fs.readFileSync(file, 'utf8');
  var out = [];
  /* App.i18n.t('foo') / window.App.i18n.t('foo') / App.i18n.t('a.b.c'),
     single or double quotes. When the call concatenates a variable
     (e.g. App.i18n.t('keyLabel.' + label)), only the literal prefix up
     to the first quote is captured — checked below as a prefix match
     against registered keys, same limitation as any static key-usage
     check. Calls with no literal at all (e.g. App.i18n.t(key)) can't
     be resolved statically and are skipped entirely. */
  var re = /\bApp\.i18n\.t\(\s*(['"])([^'"]+)\1/g;
  var m;
  while ((m = re.exec(src)) !== null) out.push({ key: m[2], file: rel(file) });
  return out;
}

function checkUsageAgainstRegistration(usedEntries, builtinDictObj, registeredDicts, label) {
  Object.keys(registeredDicts).forEach(function (loc) {
    var validKeys = mergedFlatKeys(builtinDictObj[loc], registeredDicts[loc]);
    var validSet = {};
    validKeys.forEach(function (k) { validSet[k] = true; });
    usedEntries.forEach(function (entry) {
      if (validSet[entry.key]) return;
      /* Only treat it as a resolvable dynamic-key prefix when it ends
         in '.' (how this codebase's concatenated calls capture, e.g.
         'keyLabel.' from t('keyLabel.' + label)) — otherwise a typo'd
         exact key could wrongly "match" as a prefix of an unrelated
         registered key and go undetected. */
      var prefixMatch = entry.key.slice(-1) === '.' &&
        validKeys.some(function (k) { return k.indexOf(entry.key) === 0; });
      if (prefixMatch) return;
      failures.push('[' + loc + '] ' + entry.file + ': uses i18n key "' + entry.key +
        '" but it is not registered in ' + label + ' for locale "' + loc + '"');
    });
  });
}

var builtin = builtinDict();
var registeredRoot = registeredDictsByLocale(ROOT);
var registeredLegal = registeredDictsByLocale(path.join(ROOT, 'legal'));

var usedRoot = extractHtmlKeys(path.join(ROOT, 'index.html'))
  .concat(extractJsI18nCalls(path.join(ROOT, 'app.js')))
  .concat(extractJsI18nCalls(path.join(ROOT, 'data.js')));
listJs(path.join(ROOT, 'assets', 'js')).forEach(function (file) {
  usedRoot = usedRoot.concat(extractJsI18nCalls(file));
});

var usedLegal = extractHtmlKeys(path.join(ROOT, 'legal', 'index.html'));

checkUsageAgainstRegistration(usedRoot, builtin, registeredRoot, 'strings.<locale>.js');
checkUsageAgainstRegistration(usedLegal, builtin, registeredLegal, 'legal/strings.<locale>.js');

/* --- 8. _redirects stays within Cloudflare's per-file limits
   (https://developers.cloudflare.com/pages/configuration/redirects/):
   a maximum of 2 000 static redirects and 100 dynamic (placeholder)
   redirects per file — 2 100 in total. If the file is absent (the
   common case for projects that have no redirects at all) the check
   is skipped: zero is valid. Cloudflare parses the file line-by-line
   and counts entries, not bytes, so the check counts entries.

   - Static: a non-comment, non-blank line with a redirect code
     (301/302/303/307/308) at the end OR a proxy entry (`200`). The
     `301`/`302`/`303`/`307`/`308` codes all sit at the end of the
     line in Cloudflare's syntax (`/from /to 301`).
   - Dynamic: a redirect line containing a `:placeholder$` token
     (e.g. `/news/:slug$ /blog/:slug 301`), per the Cloudflare docs'
     "Dynamic redirects" section. */
var REDIRECTS_FILE = path.join(ROOT, '_redirects');
if (fs.existsSync(REDIRECTS_FILE)) {
  checks += 1;
  var redirLines = fs.readFileSync(REDIRECTS_FILE, 'utf8').split('\n');
  var staticCount = 0;
  var dynamicCount = 0;
  redirLines.forEach(function (line) {
    var trimmed = line.trim();
    if (!trimmed || trimmed.charAt(0) === '#') return;
    var isStatic = /\s(?:200|301|302|303|307|308)\s*$/.test(trimmed) && !/:\w+\$/.test(trimmed);
    var isDynamic = /:\w+\$/.test(trimmed);
    if (isStatic) staticCount += 1;
    else if (isDynamic) dynamicCount += 1;
  });
  var REDIR_STATIC_LIMIT = 2000;
  var REDIR_DYNAMIC_LIMIT = 100;
  if (staticCount > REDIR_STATIC_LIMIT) {
    failures.push('_redirects: ' + staticCount + ' static redirects, max is ' + REDIR_STATIC_LIMIT +
      ' (Cloudflare Pages rejects the file)');
  }
  if (dynamicCount > REDIR_DYNAMIC_LIMIT) {
    failures.push('_redirects: ' + dynamicCount + ' dynamic redirects, max is ' + REDIR_DYNAMIC_LIMIT +
      ' (Cloudflare Pages rejects the file)');
  }
}

/* --- 9. _headers stays within Cloudflare's per-file limit of 100
   header rules per file
   (https://developers.cloudflare.com/pages/configuration/headers/).
   We count both the path-glob line AND the header lines individually
   because Cloudflare's published limit of 100 applies to the total
   number of lines in `_headers`, per the wording at
   https://developers.cloudflare.com/pages/configuration/headers/. The
   7 currently shipped suites all stay well under 100 either way. */
var HEADERS_FILE = path.join(ROOT, '_headers');
if (fs.existsSync(HEADERS_FILE)) {
  checks += 1;
  var headersLines = fs.readFileSync(HEADERS_FILE, 'utf8').split('\n');
  var ruleCount = 0;
  for (var i = 0; i < headersLines.length; i++) {
    var hLine = headersLines[i];
    var hTrim = hLine.trim();
    if (!hTrim || hTrim.charAt(0) === '#') continue;
    if (hLine.charAt(0) === '/' && !/^\/.*:/.test(hLine)) {
      ruleCount += 1;
      continue;
    }
    if (/^[A-Za-z][\w-]*:\s/.test(hLine)) ruleCount += 1;
  }
  var HEADERS_RULE_LIMIT = 100;
  if (ruleCount > HEADERS_RULE_LIMIT) {
    failures.push('_headers: ' + ruleCount + ' rule lines (path-globs + headers), max is ' +
      HEADERS_RULE_LIMIT + ' (Cloudflare Pages rejects the file)');
  }
}

/* --- 10. No shipped file exceeds Cloudflare Pages' 25 MB per-file
   limit (https://developers.cloudflare.com/pages/limits/). Warns at
   20 MB (legal but worth a nudge) and fails at 25 MB. Only walks
   files that actually deploy: `.git/`, `node_modules/`, `.claude/`
   (graphify skill + agent settings, never uploaded), and
   `graphify-out*` (build artifacts) are excluded. */
var FILE_SIZE_WARN_MB = 20;
var FILE_SIZE_FAIL_MB = 25;
var fileSizeExcluded = ['.git', 'node_modules', '.claude', 'graphify-out', 'graphify-out-meta'];
(function walkForLargeFiles(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    if (fileSizeExcluded.indexOf(entry.name) !== -1) return;
    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkForLargeFiles(full);
    } else if (entry.isFile()) {
      checks += 1;
      var size = fs.statSync(full).size;
      var sizeMb = size / (1024 * 1024);
      if (sizeMb >= FILE_SIZE_FAIL_MB) {
        failures.push(rel(full) + ': weighs ' + sizeMb.toFixed(2) + ' MB, max per file is ' +
          FILE_SIZE_FAIL_MB + ' MB (Cloudflare Pages rejects the deploy)');
      } else if (sizeMb >= FILE_SIZE_WARN_MB) {
        warnings.push(rel(full) + ': weighs ' + sizeMb.toFixed(2) + ' MB, max per file is ' +
          FILE_SIZE_FAIL_MB + ' MB (warning: still legal, getting close)');
      }
    }
  });
})(ROOT);

/* --- Result --- */
if (warnings.length) {
  console.log('WARNINGS (' + warnings.length + ') - non-blocking, see https://developers.cloudflare.com/pages/limits/ (25 MB per-file limit):');
  warnings.forEach(function (w) { console.log('  - ' + w); });
  console.log('');
}
if (failures.length) {
  console.log('FAILURES (' + failures.length + '):');
  failures.forEach(function (f) { console.log('  - ' + f); });
  process.exitCode = 1;
} else {
  console.log('OK (' + checks + ' checks)');
}
