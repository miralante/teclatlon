#!/usr/bin/env node
// suite-markup.js — checks that every HTML page of one suite app mounts the shared
// header and footer the way the shared component expects. Canonical source:
// apptonomia/scripts/suite/suite-markup.js. Copied byte for byte to
// <app>/scripts/checks/suite-markup.js by apptonomia/scripts/sync-suite-chrome.js,
// so each app's CI can run it alone (`node scripts/checks/suite-markup.js`) without
// the other repos next to it. Never edit a copy by hand.
//
// Rules, per page:
//   - a header mount (data-suite-header) and a footer mount (data-suite-footer);
//   - the shared script suite-chrome.js and the locale picker are loaded;
//   - no data-pie-app (the old footer component);
//   - a subpage's back link sits inside its data-suite-activity block;
//   - a subpage's back link leads to the level above it: the target page exists
//     and lists this page's folder (a group hub or the app home), so the button
//     never skips a level when the reader arrives without a history to return to;
//   - a header that draws the brand names a logo or mark, and a byline (not
//     Apptonomia, which is the portal and not an app of the suite), and the logo
//     file exists;
//   - brand="off" is not allowed: every page draws the shared brand;
//   - the footer's data-suite-base is the path back to the app root (404.html may
//     use the site root).
//
// Usage: node suite-markup.js [appRoot]   (default: the current directory)
// Exit code 1 when any page fails. No dependencies.

'use strict';

const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', '.git', '.wrangler', '.claude', '.github', 'test-results',
  'graphify-out', 'graphify-out-meta', 'doc', 'tests', 'scripts', '.playwright-cli', '.mavis']);

/* Pages that cannot carry the footer, with the reason. Paths relative to the app root. */
const EXEMPT = {
  apptonomia: { 'project/index.html': 'slide deck: its footer is the slide footer' },
  ludia: {
    'refresh.html': 'redirect stub',
    'legal/index.html': 'redirect stub to ../#privacy',
  },
};

/* Every file of the app whose name passes `keep`, skipping the folders in SKIP_DIRS. */
function appFiles(dir, keep, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) appFiles(full, keep, out);
    else if (keep(entry.name)) out.push(full);
  }
  return out;
}

function htmlPages(dir) {
  return appFiles(dir, (name) => name.endsWith('.html'));
}

/* A subpage's back link belongs inside its [data-suite-activity] block: the shared
   header moves that block into the centre of the header row. A back link written
   anywhere else stays where the page put it, so the button lands above the header. */
function backLinkOutsideActivity(html) {
  const back = html.search(/<a\b[^>]*\bclass="[^"]*\bback-link\b/);
  if (back === -1) return false;
  const open = html.search(/<[a-z]+\b[^>]*\bdata-suite-activity\b/);
  if (open === -1 || open > back) return true;
  const close = html.indexOf('</div>', open);
  return close === -1 || back > close;
}

/* Escapes a string for use inside a RegExp. */
function reEscape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* True when `text` names the folder `slug` as a path segment ("/los-numeros/") or as a
   quoted string ('los-numeros'): how a hub, the app home or a data file lists it. */
function listsSlug(text, slug) {
  return new RegExp("(['\"/])" + reEscape(slug) + "(['\"/?])").test(text);
}

/* A subpage's back link must lead to the level above it. The href is resolved from the
   page and the target must exist. An activity (a folder that the app lists somewhere
   else: a group hub or the app home) must be listed by its target, in the target page
   or in its data.js, so the button cannot skip a level. A top-level page (about/,
   legal/) is not listed anywhere; its level above is the app home, which needs no
   listing. Returns the problem, or null when the link is fine or there is none. */
function backLinkProblem(file, html, isActivity) {
  const tag = html.match(/<a\b([^>]*\bclass="[^"]*\bback-link\b[^"]*"[^>]*)>/);
  if (!tag) return null;
  const href = attrOf(tag[1], 'href');
  if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href)) return null;
  const clean = href.split(/[?#]/)[0];
  let target = path.resolve(path.dirname(file), clean);
  if (clean === '' || clean.endsWith('/') || (fs.existsSync(target) && fs.statSync(target).isDirectory())) {
    target = path.join(target, 'index.html');
  }
  if (!fs.existsSync(target)) return 'back link target not found: ' + href;
  if (path.resolve(target) === path.resolve(file)) return 'back link points to its own page: ' + href;

  const slug = path.basename(path.dirname(file));
  if (!isActivity(slug, path.dirname(file))) return null;
  const sources = [target];
  const data = path.join(path.dirname(target), 'data.js');
  if (fs.existsSync(data)) sources.push(data);
  if (!sources.some((f) => listsSlug(fs.readFileSync(f, 'utf8'), slug))) {
    return 'back link ' + href + ' does not lead to the level above: ' +
      path.basename(path.dirname(target)) + '/ does not list "' + slug + '"';
  }
  return null;
}

/* The attributes of the tag that carries a mount. Returns the text between the tag name
   and its closing bracket, or null when the mount is absent. */
function mountTag(html, attr) {
  const m = html.match(new RegExp('<[a-z]+\\b([^>]*\\b' + attr + '\\b[^>]*)>'));
  return m ? m[1] : null;
}

/* The value of one attribute in that text: '' for a bare attribute, null when absent. */
function attrOf(tagAttrs, name) {
  const m = tagAttrs.match(new RegExp('\\b' + name + '(?:="([^"]*)")?'));
  if (!m) return null;
  return m[1] === undefined ? '' : m[1];
}

function mountProblems(file, appRoot, appName, html) {
  const out = [];
  const dir = path.dirname(file);
  const depth = path.relative(appRoot, dir).split(path.sep).filter(Boolean).length;
  const rel = path.relative(appRoot, file).split(path.sep).join('/');

  const header = mountTag(html, 'data-suite-header');
  if (header !== null) {
    const brand = attrOf(header, 'data-suite-brand');
    if (brand === 'off') {
      out.push('header brand is off: use the shared brand (logo and byline) on every page');
    } else {
      const logo = attrOf(header, 'data-suite-logo');
      const mark = attrOf(header, 'data-suite-mark');
      if (logo === null && mark === null) out.push('header has no data-suite-logo or data-suite-mark');
      if (attrOf(header, 'data-suite-byline') === null && appName !== 'apptonomia') {
        out.push('header has no data-suite-byline');
      }
      if (logo) {
        const clean = logo.split('?')[0];
        const target = clean.startsWith('/') ? path.join(appRoot, clean) : path.join(dir, clean);
        if (!fs.existsSync(target)) out.push('logo not found: ' + logo);
      }
    }
  }

  const footer = mountTag(html, 'data-suite-footer');
  if (footer !== null) {
    const base = attrOf(footer, 'data-suite-base') || './';
    const expected = depth === 0 ? './' : '../'.repeat(depth);
    const absoluteOk = rel === '404.html' && base === '/';
    if (base !== expected && !absoluteOk) {
      out.push('footer data-suite-base is "' + base + '", expected "' + expected + '"');
    }
  }
  return out;
}

/* Returns the list of problems of one page, empty when it conforms. `isActivity(slug, folder)`
   tells whether the app lists the folder `slug` somewhere outside `folder` itself. */
function pageProblems(file, appRoot, appName, isActivity = () => false) {
  const html = fs.readFileSync(file, 'utf8');
  const footerMount = /<[a-z]+\b[^>]*\bdata-suite-footer\b/.test(html);
  const headerMount = /<[a-z]+\b[^>]*\bdata-suite-header\b/.test(html);
  const loads = /<script\b[^>]*\bsuite-chrome\.js/.test(html);
  const picker = /<script\b[^>]*\blocale-picker\.js/.test(html);
  const oldPie = /\bdata-pie-app\b/.test(html);
  const out = [];
  if (!headerMount) out.push('no data-suite-header mount');
  if (!footerMount) out.push('no data-suite-footer mount');
  if (!loads) out.push('no suite-chrome.js script');
  if (!picker) out.push('no locale-picker.js script');
  if (oldPie) out.push('still uses data-pie-app');
  if (backLinkOutsideActivity(html)) out.push('back link outside its data-suite-activity block');
  const back = backLinkProblem(file, html, isActivity);
  if (back) out.push(back);
  return out.concat(mountProblems(file, appRoot, appName, html));
}

/* Audits every page of one app. Returns { pages, problems: [{ rel, why }] }. */
function auditApp(appRoot, appName) {
  const name = appName || path.basename(path.resolve(appRoot));
  const exempt = EXEMPT[name] || {};
  const problems = [];
  let pages = 0;
  /* The app's catalogue: its home page and every data.js (a hub draws its cards from
     data.js). A link in another page, such as a footer's about/ or legal/, is not a
     catalogue entry. */
  const listing = appFiles(appRoot, (n) => n === 'index.html' || n === 'data.js')
    .filter((f) => path.basename(f) === 'data.js' || path.resolve(path.dirname(f)) === path.resolve(appRoot))
    .map((f) => ({ dir: path.resolve(path.dirname(f)), text: fs.readFileSync(f, 'utf8') }));
  const isActivity = (slug, folder) =>
    listing.some((l) => l.dir !== path.resolve(folder) && listsSlug(l.text, slug));
  for (const file of htmlPages(appRoot)) {
    const rel = path.relative(appRoot, file).split(path.sep).join('/');
    if (exempt[rel]) continue;
    pages += 1;
    const why = pageProblems(file, appRoot, name, isActivity);
    if (why.length) problems.push({ rel, why: why.join('; ') });
  }
  return { pages, problems };
}

module.exports = { auditApp, pageProblems };

if (require.main === module) {
  const appRoot = path.resolve(process.argv[2] || '.');
  const { pages, problems } = auditApp(appRoot, path.basename(appRoot));
  for (const p of problems) console.log('✗ ' + p.rel + ': ' + p.why);
  if (problems.length) {
    console.log('\n' + problems.length + ' page(s) without the shared header/footer rules. Fix the page or add it to EXEMPT with a reason.');
    process.exitCode = 1;
  } else {
    console.log('ok       markup: ' + pages + ' page(s) mount the shared header and footer as the component expects');
  }
}
