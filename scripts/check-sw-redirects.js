#!/usr/bin/env node
'use strict';
/*
 * Playwright test for "Response served by service worker has redirections".
 *
 * WHY A BROWSER TEST, AND WHY THIS SHAPE
 * --------------------------------------
 * The defect is invisible to every structural check in this repo. Its static
 * test servers serve "dir/index.html" straight from disk and never emit the
 * 307 that Cloudflare emits for any "/x.html" URL, so a gate run against
 * them stays green while the site is broken in production. Two further
 * measured facts make partial tests worthless:
 *
 *   - an ONLINE navigation survives even with a poisoned cache, so a test
 *     that only clicks links proves nothing;
 *   - the poisoned entry comes from the INSTALL precache, so a fix applied
 *     only in the fetch handler still fails offline.
 *
 * So this serves the project through a server that reproduces Cloudflare's
 * redirects exactly, and asserts the three things that decide whether a
 * visitor sees the failure:
 *
 *   1. the worker installs and takes control (a broken precache would leave
 *      the site with no service worker at all — a silent regression);
 *   2. Cache Storage holds ZERO entries with response.redirected === true;
 *   3. navigating to a redirecting ".html" URL works online, and offline
 *      when the worker actually precached it. That is the literal
 *      user-visible error.
 *
 * The URLs under test are not a hand-written list: they are read from this
 * project's own sw.js manifest, so any ".html" entry added later is covered
 * without touching this file. A hand list is how the original bug survived a
 * rewrite of every link in the suite.
 *
 * WHY THIS FILE IS SELF-CONTAINED
 * ------------------------------
 * Each project in the suite is its own git repository, so a test that
 * reached into "../scripts/" would work on this machine and be missing in
 * CI, where only the single project is checked out. Hence: no cross-project
 * imports. The identical file is installed in every project that ships a
 * service worker, and scripts/check-sw-browser.js at the suite root just
 * invokes each copy.
 *
 * Run: node scripts/check-sw-redirects.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8841;
const NAME = path.basename(ROOT);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm', '.map': 'application/json',
};

/* Both spellings ship in this suite: some projects depend on "playwright",
   others only on "@playwright/test" (which re-exports the same chromium). */
function requirePlaywright() {
  for (const n of ['playwright', '@playwright/test']) {
    const p = path.join(ROOT, 'node_modules', n);
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error('playwright no encontrado: ejecuta `npm install` en ' + NAME);
}

/* Cloudflare, measured on all eight production sites:
     /about.html            -> 307 /about
     /about/index.html      -> 307 /about/
     /404.html              -> 307 /404
     /offline.html          -> 307 /offline
     /legal/privacidad.html -> 307 /legal/privacidad
   and it then serves the extensionless form. Reproduced here, because
   without it no local check in this repo can see this bug. */
function canonical(p) {
  if (p.endsWith('/index.html')) return p.slice(0, -'index.html'.length);
  if (p === '/index.html') return '/';
  if (p.endsWith('.html')) return p.slice(0, -'.html'.length);
  return null;
}

function serve(port) {
  return http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);

    if (p.endsWith('.html')) {
      res.writeHead(307, { Location: canonical(p) });
      return res.end();
    }
    const send = (file) => {
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        // Never let the HTTP cache hide a fix by serving an older worker.
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(file).pipe(res);
    };
    const flat = path.join(ROOT, p.replace(/^\/+/, '') + '.html');
    if (flat.startsWith(ROOT) && fs.existsSync(flat) && fs.statSync(flat).isFile()) return send(flat);
    if (p.endsWith('/')) {
      const idx = path.join(ROOT, p.replace(/^\/+/, ''), 'index.html');
      if (idx.startsWith(ROOT) && fs.existsSync(idx)) return send(idx);
    }
    const file = path.join(ROOT, p.replace(/^\/+/, ''));
    if (file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile()) return send(file);

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }).listen(port, '127.0.0.1');
}

/* The ".html" entries of the precache manifest, and only those: they are the
   ones that were stored poisoned. A ".html" URL the worker never caches
   cannot be poisoned either, and demanding it would assert a guarantee the
   worker never made. /index.html is still visited ONLINE only — every page
   redirects it, so a link that survived normalisation would land there, but
   offline it is a legitimate miss for a worker that caches "./". */
function redirectingTargets(swSrc) {
  // Strip comments first: sw.js explains the 307s in prose with quoted paths
  // like "./index.html", and those are not precache entries. Without this the
  // test navigates to URLs the worker never cached and asserts a guarantee it
  // never made.
  const code = swSrc
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
  const literals = Array.from(code.matchAll(/["'](\.\/[^"']*\.html)["']/g)).map((m) => m[1]);
  return [...new Set(literals.map((l) => '/' + l.replace(/^\.\//, '')))];
}

/* A canonical, non-redirecting deep page, so the offline fallback is
   exercised too and not only the poisoned-URL case. */
function canonicalTarget(swSrc) {
  const dirs = Array.from(swSrc.matchAll(/["']\.\/([^"']+)\/["']/g))
    .map((m) => '/' + m[1] + '/')
    .filter((p) => p !== '/');
  return dirs[0] || '/about/';
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'scripts', 'doc', 'docs', 'tests',
  'graphify-out', 'playwright-report', 'test-results', '.wrangler', '.dev', '.github']);

function walkHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walkHtml(path.join(dir, e.name), out);
    } else if (e.name.endsWith('.html')) {
      out.push('./' + path.relative(ROOT, path.join(dir, e.name)).split(path.sep).join('/'));
    }
  }
  return out;
}

/* A ".html" page that exists on disk but is NOT precached. Visiting it while
   online forces the fetch handler to store it at runtime — the SECOND
   poisoning path, and the one a project with a clean manifest still has:
   cache.put() fed straight from fetch() keeps the redirected flag exactly
   like the install precache does. Visiting it again offline is what then
   aborts with net::ERR_FAILED.
   Without this the test would only ever see a project whose manifest was
   already clean, and would pass while any .html URL a visitor happens to hit
   quietly poisoned the cache. */
function runtimeTarget(swSrc) {
  const code = swSrc
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
  const manifest = new Set(
    Array.from(code.matchAll(/["'](\.\/[^"']*\.html)["']/g)).map((m) => m[1]));
  const onDisk = walkHtml(ROOT).filter((p) => !manifest.has(p) && p !== './index.html');
  const deep = onDisk.find((p) => /\/index\.html$/.test(p));
  const pick = deep || onDisk[0];
  return pick ? '/' + pick.replace(/^\.\//, '') : null;
}

(async () => {
  const swPath = path.join(ROOT, 'sw.js');
  if (!fs.existsSync(swPath)) {
    console.log('~ ' + NAME + ': sin sw.js, nada que comprobar');
    return;
  }
  const swSrc = fs.readFileSync(swPath, 'utf8');
  const redirecting = redirectingTargets(swSrc);
  const canonicalPage = canonicalTarget(swSrc);
  const runtimePage = runtimeTarget(swSrc);

  const { chromium, devices } = requirePlaywright();
  const server = serve(PORT);
  const base = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'allow' });
  const page = await context.newPage();
  const failures = [];
  const notes = [];
  let entries = 0;
  let active = null;

  try {
    await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 30000 }).catch(() => {});
    // Reload once: on a first-ever visit a previously registered script can
    // win the race and only lose on the next load (the ludia sw-v10.js case).
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(3000);

    const state = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const poisoned = [];
      let count = 0;
      const keys = await caches.keys();
      for (const k of keys) {
        const c = await caches.open(k);
        for (const req of await c.keys()) {
          count++;
          const res = await c.match(req);
          if (res && res.redirected) poisoned.push(k + ' :: ' + new URL(req.url).pathname);
        }
      }
      return {
        active: reg && reg.active ? reg.active.scriptURL.replace(location.origin, '') : null,
        count, poisoned,
      };
    }).catch((e) => ({ error: e.message }));

    if (state.error) {
      failures.push('no se pudo leer Cache Storage: ' + state.error);
    } else {
      entries = state.count;
      active = state.active;
      if (!active) failures.push('no hay service worker activo');
      // A second worker at the same scope re-seeds its own poisoned cache on
      // every visit; only the canonical script is acceptable.
      else if (active !== '/sw.js') failures.push('worker activo inesperado: ' + active);
      if (state.poisoned.length) {
        failures.push('Cache Storage guarda ' + state.poisoned.length
          + ' entrada(s) con redirected:true -> ' + state.poisoned.slice(0, 5).join(' | '));
      }
    }

    const visit = async (urlPath, offline) => {
      if (offline) await context.setOffline(true);
      try {
        const r = await page.goto(base + urlPath, { waitUntil: 'domcontentloaded', timeout: 25000 });
        if (!r || !r.ok()) return `status ${r && r.status()}`;
        return null;
      } catch (e) {
        return e.message.split('\n')[0].replace('page.goto: ', '');
      } finally {
        if (offline) await context.setOffline(false);
      }
    };

    for (const p of ['/index.html', ...redirecting]) {
      const err = await visit(p, false);
      if (err) failures.push('navegacion online a ' + p + ' fallo: ' + err);
    }
    for (const p of redirecting) {
      const err = await visit(p, true);
      if (err) failures.push('navegacion OFFLINE a ' + p + ' fallo: ' + err);
    }
    const offlineCanonical = await visit(canonicalPage, true);
    if (offlineCanonical) {
      failures.push('navegacion OFFLINE a la pagina canonica ' + canonicalPage + ' fallo: ' + offlineCanonical);
    }

    // The runtime path: a .html page the worker never precached. The online
    // visit makes the fetch handler store it, and the offline visit consumes
    // whatever it stored — which is how a cache.put() without deRedirect()
    // becomes a visible failure.
    if (runtimePage) {
      const onlineErr = await visit(runtimePage, false);
      if (onlineErr) failures.push('navegacion online a ' + runtimePage + ' fallo: ' + onlineErr);
      // The fetch handler stores the response with a fire-and-forget
      // cache.put(), so give it time to land before reading the cache.
      await page.waitForTimeout(700);
      // Deliberately NOT asserted as a failure when it is offline. Whether an
      // uncached page has an offline fallback is each project's own design
      // (routime deliberately answers 503 "Sin conexión"), and requiring it
      // would turn a redirect check into an offline-capability check. What
      // must hold is only that nothing poisoned got written — asserted by the
      // cache re-read below.
      const offlineErr = await visit(runtimePage, true);
      if (offlineErr) notes.push('runtime offline devuelve ' + offlineErr + ' (sin fallback offline: propio del proyecto)');
    }

    // Re-read the cache: the runtime visits above happen after the first read,
    // so this is what catches an entry that only becomes poisoned then.
    const after = await page.evaluate(async () => {
      const poisoned = [];
      for (const k of await caches.keys()) {
        const c = await caches.open(k);
        for (const req of await c.keys()) {
          const res = await c.match(req);
          if (res && res.redirected) poisoned.push(k + ' :: ' + new URL(req.url).pathname);
        }
      }
      return poisoned;
    }).catch(() => null);
    if (after && after.length) {
      failures.push('tras navegar, Cache Storage guarda ' + after.length
        + ' entrada(s) con redirected:true -> ' + after.slice(0, 5).join(' | '));
    }
  } finally {
    await context.close();
    await browser.close();
    server.close();
  }

  const shown = redirecting.length ? redirecting.join(', ') : '(ninguna: no precachea .html)';
  if (failures.length) {
    console.log(`✗ ${NAME}: service worker con respuestas redirigidas`);
    for (const f of failures) console.log('     ' + f);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${NAME}: worker=${active} entradas=${entries} `
      + `precacheadas .html: ${shown}`
      + (runtimePage ? ' | runtime: ' + runtimePage : '') + ' - sin poisoned, online y offline OK');
    for (const n of notes) console.log('     nota: ' + n);
  }
})();
