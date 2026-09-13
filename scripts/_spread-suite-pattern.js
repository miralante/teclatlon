/* scripts/_spread-suite-pattern.js
   Inject the suite-pattern block (currently §8 of
   doc/en/technical.md and doc/es/tecnico.md in teclatlon) into
   the equivalent technical docs of every other app of the
   Miralante suite.

   - Apptonomia is skipped (no doc/en/technical.md in that repo).
   - The block is appended as the new last top-level section.
     Its number is computed as max(existing §N) + 1 so the
     existing numbering in each repo is preserved.
   - The HTML <title>Teclatlon — …</title> example inside the
     block is rewritten to the target app's name. Other
     "Teclatlon" mentions (e.g. URL slugs in the footer) stay
     verbatim — they illustrate the per-app shape.

   Usage:
     node _spread-suite-pattern.js            # dry-run
     node _spread-suite-pattern.js --apply    # actually write
*/
'use strict';
var fs = require('fs');
var path = require('path');

var REPO_ROOT = 'd:/apps/onedrive/jrodriguezgar/OneDrive/dev/git/Miralante';
var SOURCE_DIR = path.join(REPO_ROOT, 'teclatlon', 'scripts');

var APPS = {
  calculia:  'Calculia',
  memofun:   'Memofun',
  okeymoney: 'Okeymoney',
  routime:   'Routime',
  sinonimia: 'Sinonimia'
};

var EN_BLOCK = fs.readFileSync(path.join(SOURCE_DIR, '_suite-pattern-en.md'), 'utf8');
var ES_BLOCK = fs.readFileSync(path.join(SOURCE_DIR, '_suite-pattern-es.md'), 'utf8');
var SOURCE_NUMBER_IN_BLOCK = 8;

function stripBom(s) { return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; }

function nextSectionNumber(doc) {
  var re = /^## (\d+)\. /gm;
  var max = 0;
  var m;
  while ((m = re.exec(doc)) !== null) {
    var n = parseInt(m[1], 10);
    if (n > max) max = n;
  }
  return max + 1;
}

function renumber(block, oldN, newN) {
  /* Renumber the top-level heading AND every sub-heading in the
     block. Sub-headings inside the block use the form `### N.M`
     (e.g. `### 8.1 The standalone-page shape`), and they must
     be renamed to `### <newN>.M` so they don't collide with
     any pre-existing `### N.M` headings in the destination
     doc (the spread target may already use numbers N.0, N.1,
     … for its own content; we don't want to clash). The same
     applies to `#### N.M.K` four-level headings inside the
     block. */
  var out = block.replace(new RegExp('^## ' + oldN + '\\. ', 'm'), '## ' + newN + '. ');
  var subRe = new RegExp('^### ' + oldN + '\\.(\\d+)', 'gm');
  out = out.replace(subRe, '### ' + newN + '.$1');
  var subSubRe = new RegExp('^#### ' + oldN + '\\.(\\d+\\.\\d+)', 'gm');
  out = out.replace(subSubRe, '#### ' + newN + '.$1');
  return out;
}

/* If the target doc has no numbered top-level sections (nextN
   would be 1), strip the leading number from the injected
   block so it stays consistent with the rest of the doc (which
   uses unnumbered headings). The `m` flag is required: the
   block's first line is `# Suite pattern …` (h1 banner), the
   `## 8.` is on a later line. */

function stripLeadingNumberIfUnnumbered(block, newN) {
  if (newN !== 1) return block;
  return block
    /* Drop `## N. ` (and the digit+dot+space prefix only). */
    .replace(/^## \d+\. /m, '## ')
    /* Drop `### N.M` -> `### M`. The trailing `.M` belongs to
       the section number, so the `### ` heading ends up
       followed by `M` directly. */
    .replace(/^### \d+\.(\d+)/gm, '### $1');
}

function rewriteAppName(block, appName) {
  return block
    .replace('<title>Teclatlon — Sobre este proyecto</title>',
             '<title>' + appName + ' — Sobre este proyecto</title>')
    .replace('<title>Teclatlon — Privacidad y datos</title>',
             '<title>' + appName + ' — Privacidad de datos</title>');
}

function buildInjection(srcDoc, block, appName) {
  var clean = stripBom(srcDoc);
  var blockClean = stripBom(block);
  var n = nextSectionNumber(clean);
  var renumbered = renumber(blockClean, SOURCE_NUMBER_IN_BLOCK, n);
  var adjusted = stripLeadingNumberIfUnnumbered(renumbered, n);
  var injected = rewriteAppName(adjusted, appName);
  var sep = clean.endsWith('\n') ? '\n' : '\n\n';
  return clean + sep + injected + '\n';
}

function processOne(appKey, appName, apply) {
  var repo = path.join(REPO_ROOT, appKey);
  var targets = [
    { lang: 'en', file: path.join(repo, 'doc/en/technical.md') },
    { lang: 'es', file: path.join(repo, 'doc/es/tecnico.md') }
  ];
  targets.forEach(function (t) {
    if (!fs.existsSync(t.file)) {
      console.log(JSON.stringify({ app: appKey, lang: t.lang, status: 'missing' }));
      return;
    }
    var src = fs.readFileSync(t.file, 'utf8');
    var nextN = nextSectionNumber(stripBom(src));
    var newDoc = buildInjection(src, t.lang === 'en' ? EN_BLOCK : ES_BLOCK, appName);
    var info = {
      app: appKey, lang: t.lang, file: t.file, nextN: nextN,
      oldBytes: src.length, newBytes: newDoc.length,
      status: apply ? 'applied' : 'planned'
    };
    console.log(JSON.stringify(info));
    if (apply) fs.writeFileSync(t.file, newDoc, 'utf8');
  });
}

function run() {
  var apply = process.argv.indexOf('--apply') !== -1;
  console.log('mode: ' + (apply ? 'APPLY' : 'DRY-RUN (pass --apply to write)'));
  Object.keys(APPS).forEach(function (k) { processOne(k, APPS[k], apply); });
}

run();
