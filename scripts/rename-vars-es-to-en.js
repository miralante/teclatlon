#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * Second-pass codemod for app.js: rename Spanish local variables
 * and parameters to English. String- and comment-aware so it does
 * NOT touch identifiers that appear inside '...', "...", or // ...
 * / * ... * / regions. Sibling of rename-es-to-en.js (function
 * level). Run after it.
 *
 * Run: node scripts/rename-vars-es-to-en.js
 */

'use strict';

var fs = require('fs');
var path = require('path');

/* Order matters: longer first to keep prefix-overlap safe. */
var RENAMES = [
  ['ultimoCh', 'lastCh'],
  ['elegida', 'picked'],
  ['prefijo', 'prefix'],
  ['defecto', 'fallback'],
  ['despues', 'after'],
  ['enNumpad', 'inNumpad'],
  ['esperando', 'waiting'],
  ['frecuencia', 'frequency'],
  ['duracion', 'duration'],
  ['activoMayus', 'activeShift'],
  ['dedoMayus', 'shiftFinger'],
  ['mensaje', 'message'],
  ['claveDetalle', 'detailKey'],
  ['columna', 'column'],
  ['texto', 'text'],
  ['activo', 'active'],
  ['abajo', 'down'],
  ['dedo', 'finger'],
  ['filas', 'rows'],
  ['capa', 'layer'],
  ['fila', 'row'],
  ['paso', 'step'],
  ['modo', 'mode'],
  ['titulo', 'title'],
  ['clave', 'key']
];

var TARGETS = ['app.js'];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* Build a mask of positions that are inside a string literal or a
   comment -- those positions must not be replaced. */
function buildSkipMask(src) {
  var n = src.length;
  var skip = new Array(n);
  var i = 0;
  while (i < n) {
    var c = src.charCodeAt(i);
    var c2 = i + 1 < n ? src.charCodeAt(i + 1) : 0;
    if (c === 47 && c2 === 47) { /* // line comment */
      while (i < n && src.charCodeAt(i) !== 10) { skip[i] = true; i++; }
      continue;
    }
    if (c === 47 && c2 === 42) { /* / * block comment * / */
      skip[i] = true; skip[i + 1] = true;
      i += 2;
      while (i < n) {
        skip[i] = true;
        if (src.charCodeAt(i) === 42 && i + 1 < n && src.charCodeAt(i + 1) === 47) {
          skip[i + 1] = true;
          i += 2;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === 39) { /* ' single-quoted string */
      skip[i] = true; i++;
      while (i < n) {
        var cc = src.charCodeAt(i);
        skip[i] = true;
        if (cc === 92) { if (i + 1 < n) { skip[i + 1] = true; i += 2; continue; } }
        if (cc === 39) { i++; break; }
        if (cc === 10) break;
        i++;
      }
      continue;
    }
    if (c === 34) { /* " double-quoted string */
      skip[i] = true; i++;
      while (i < n) {
        var dc = src.charCodeAt(i);
        skip[i] = true;
        if (dc === 92) { if (i + 1 < n) { skip[i + 1] = true; i += 2; continue; } }
        if (dc === 34) { i++; break; }
        if (dc === 10) break;
        i++;
      }
      continue;
    }
    if (c === 96) { /* ` template literal -- skip whole thing */
      skip[i] = true; i++;
      while (i < n) {
        var tc = src.charCodeAt(i);
        skip[i] = true;
        if (tc === 92) { if (i + 1 < n) { skip[i + 1] = true; i += 2; continue; } }
        if (tc === 96) { i++; break; }
        i++;
      }
      continue;
    }
    i++;
  }
  return skip;
}

function renameInFile(file) {
  var p = path.resolve(file);
  var src = fs.readFileSync(p, 'utf8');
  var skip = buildSkipMask(src);
  var original = src;
  for (var r = 0; r < RENAMES.length; r++) {
    var from = RENAMES[r][0];
    var to = RENAMES[r][1];
    if (from === to) continue;
    var re = new RegExp('\\b' + escapeRegExp(from) + '\\b', 'g');
    var out = '';
    var lastIndex = 0;
    var m;
    var localTouched = 0;
    while ((m = re.exec(src)) !== null) {
      var start = m.index;
      var end = start + m[0].length;
      var inSkip = false;
      for (var k = start; k < end; k++) { if (skip[k]) { inSkip = true; break; } }
      if (inSkip) continue;
      out += src.slice(lastIndex, start) + to;
      lastIndex = end;
      localTouched++;
    }
    if (localTouched) {
      out += src.slice(lastIndex);
      src = out;
      skip = buildSkipMask(src);
      console.log('  ' + file + ': ' + from + ' -> ' + to + ' (' + localTouched + ')');
    }
  }
  if (src !== original) {
    fs.writeFileSync(p, src, 'utf8');
    console.log('  wrote ' + file);
  } else {
    console.log('  no changes in ' + file);
  }
}

console.log('Renaming local vars/params: Spanish -> English (string/comment-aware)');
for (var j = 0; j < TARGETS.length; j++) renameInFile(TARGETS[j]);
console.log('Done.');
