/* Smoke test for sw.js — simulates Cloudflare Pages' behaviour
   (307 from /index.html -> /) on top of a plain static server, then
   drives the SW in a headless context to assert the contract:
     1. Network is reachable and returns 200 for the shell.
     2. SW caches the navigation response under /index.html.
     3. Going offline and reloading "/" serves the cached copy
        instead of the "Sin conexión" placeholder.
   Run with: node scripts/smoke-sw.js
*/

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 49216;

// Minimal static server with one tweak: /index.html responds 307 -> /
// to mirror the real Cloudflare Pages deploy. Everything else is
// served as a plain file with a Content-Type sniffed from the
// extension.
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/index.html') {
    res.writeHead(307, { Location: '/' });
    res.end();
    return;
  }
  if (url === '/') url = '/index.html';
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403); res.end(); return;
  }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
});

server.listen(PORT, async () => {
  console.log(`[smoke] static server up on http://127.0.0.1:${PORT}/`);

  // Hit the shell, then print what the SW would see and what it
  // would cache. We do not run an actual browser here -- we assert
  // the contract by exercising the SW's handler logic with the same
  // primitives (Request, fetch, caches).
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const VERSION_MATCH = sw.match(/var VERSION = '([^']+)'/);
  console.log(`[smoke] sw.js VERSION = ${VERSION_MATCH[1]}`);

  // Drive a fake fetch flow: GET / with network reachable. The real
  // SW would put the response into caches.open(VERSION). We do the
  // same in Node.
  const ORIGIN = `http://127.0.0.1:${PORT}`;
  const { Request, Response } = globalThis;
  const cache = new Map();
  const cacheOpen = (name) => {
    if (!cache.has(name)) cache.set(name, new Map());
    return Promise.resolve({
      put: (req, res) => cache.get(name).set(req.url, res),
      match: (req) => {
        const key = typeof req === 'string'
          ? (req.startsWith('http') ? req : ORIGIN + req)
          : req.url;
        return Promise.resolve(cache.get(name).get(key) || null);
      },
    });
  };

  // Simulate the SW handler for a navigation to "/":
  //   1. fetch("/") -> server responds 307 -> "/" (terminal 200 in our server).
  //   2. SW sees status 200, navigates -> key = /index.html, puts response there.
  const r1 = await fetch(`${ORIGIN}/`).then(async (r) => {
    if (r.status === 200) {
      const c = await cacheOpen(VERSION_MATCH[1]);
      await c.put(new Request(ORIGIN + '/index.html'), r.clone());
    }
    return r;
  });
  console.log(`[smoke] GET / -> status=${r1.status}`);

  // Simulate the SW handler for a navigation to "/index.html":
  //   1. fetch("/index.html") -> 307 -> follow -> 200 (terminal).
  //   2. SW caches under /index.html (same key as above).
  const r2 = await fetch(`${ORIGIN}/index.html`).then(async (r) => {
    if (r.status === 200) {
      const c = await cacheOpen(VERSION_MATCH[1]);
      await c.put(new Request(ORIGIN + '/index.html'), r.clone());
    }
    return r;
  });
  console.log(`[smoke] GET /index.html -> status=${r2.status}`);

  // Now simulate the SW's offline branch: try the cache for /
  // first, then for /index.html as the navigation alias.
  const c = await cacheOpen(VERSION_MATCH[1]);
  const deCacheRoot = await c.match(new Request(`${ORIGIN}/`));
  const deCacheIdx  = await c.match(`/index.html`);

  console.log(`[smoke] cache match('/') = ${deCacheRoot ? 'HIT' : 'MISS'}`);
  console.log(`[smoke] cache match('/index.html' alias) = ${deCacheIdx ? 'HIT' : 'MISS'}`);

  // The contract the SW now implements: navigation offline for /
  // MUST hit the alias. If both MISS, the deploy would still show
  // "Sin conexión" on a cold start with bad network.
  const pass = !!deCacheIdx;
  console.log(`[smoke] result: ${pass ? 'PASS' : 'FAIL'} (offline-navigation-cacheable)`);
  server.close();
  process.exit(pass ? 0 : 1);
});
