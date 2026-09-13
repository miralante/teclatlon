/* scripts/_extract-suite-blocks.js
   Extract the §8 "Suite pattern" block from doc/en/technical.md and
   doc/es/tecnico.md of teclatlon, and write them as
   scripts/_suite-pattern-en.md and scripts/_suite-pattern-es.md.
   UTF-8 without BOM. Used by _spread-suite-pattern.js.
*/
'use strict';
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');

function extractBlock(file, startMarker, endMarker) {
  var src = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  var start = src.indexOf(startMarker);
  if (start < 0) throw new Error('start marker not found in ' + file);
  var end = src.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error('end marker not found in ' + file);
  return src.substring(start, end);
}

var en = extractBlock(
  path.join(ROOT, 'doc/en/technical.md'),
  '## 8. Suite pattern',
  '## 9. License'
);
var es = extractBlock(
  path.join(ROOT, 'doc/es/tecnico.md'),
  '## 8. Patrón de la suite',
  '## 9. Licencia'
);

fs.writeFileSync(path.join(ROOT, 'scripts/_suite-pattern-en.md'), en, 'utf8');
fs.writeFileSync(path.join(ROOT, 'scripts/_suite-pattern-es.md'), es, 'utf8');

console.log('wrote scripts/_suite-pattern-en.md: ' + en.length + ' chars');
console.log('wrote scripts/_suite-pattern-es.md: ' + es.length + ' chars');
