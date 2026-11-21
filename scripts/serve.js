#!/usr/bin/env node
/*
 * suite/serve.js — the static server of the suite: the preview server and the
 * web server of the Playwright runs.
 *
 *   node scripts/serve.js [port]        (default 8080)
 *
 * It mimics the Cloudflare static-assets behaviour the apps rely on:
 *   - a folder URL serves its index.html;
 *   - an unknown path serves 404.html with status 404 at the URL that was
 *     asked for (so a relative link in 404.html breaks here exactly as it
 *     would in production);
 *   - it sends the Content-Security-Policy of _headers, when that file
 *     exists, so what only breaks under CSP (every inline <script>) does not
 *     look perfect here and ship broken.
 *
 * Canonical source: apptonomia/scripts/suite/serve.js. Copied byte for byte
 * to <app>/scripts/serve.js by apptonomia/scripts/sync-suite-test-kit.js.
 * Never edit a copy by hand.
 *
 * Exports startServer(port, root) so a test can start it in-process.
 */
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml',
};

/* The CSP of production (see _headers), so the preview and the deployed app
   send the same header and the two can never drift. Empty when the app has
   no _headers file. */
function productionCsp(root) {
  try {
    const raw = fs.readFileSync(path.join(root, '_headers'), 'utf8');
    const match = raw.match(/^\s*Content-Security-Policy:\s*(.+)$/m);
    return match ? match[1].trim() : '';
  } catch (error) {
    return '';
  }
}

/* The file a URL path maps to, or null when there is none. Never leaves root.
   `fallback` is the folder of the page that asked for it (the referer's
   directory): an app served under a subfolder ("/site/") links its assets
   from the root ("/assets/..."), and the file only exists inside that
   subfolder. The root is tried first; the referer's folder is the fallback. */
function resolveFile(root, urlPath, fallback) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch (e) { return null; }
  const candidates = [root];
  if (fallback) candidates.push(path.join(root, fallback));
  for (const base of candidates) {
    let file = path.resolve(base, '.' + decoded);
    if (file !== base && !file.startsWith(base + path.sep)) continue;
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

/* The directory of the page that made the request, relative to the root, or
   '' when the request comes from outside the app. */
function refererFolder(root, referer) {
  if (!referer) return '';
  let pathname;
  try { pathname = new URL(referer, 'http://127.0.0.1').pathname; } catch (e) { return ''; }
  const dir = path.dirname(pathname).replace(/^\/+/, '');
  if (!dir || dir === '.' || dir.includes('..')) return '';
  return fs.existsSync(path.join(root, dir)) ? dir : '';
}

function send(res, status, file, csp) {
  const headers = {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  };
  if (csp) headers['Content-Security-Policy'] = csp;
  res.writeHead(status, headers);
  fs.createReadStream(file).pipe(res);
}

/* Starts the server; resolves with it once it listens. Port 0 picks a free one. */
function startServer(port = 0, root = ROOT) {
  const csp = productionCsp(root);
  const server = http.createServer((req, res) => {
    const file = resolveFile(root, req.url || '/', refererFolder(root, req.headers.referer));
    if (file) return send(res, 200, file, csp);
    const notFound = path.join(root, '404.html');
    if (fs.existsSync(notFound)) return send(res, 404, notFound, csp);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

module.exports = { startServer, resolveFile, productionCsp, ROOT };

if (require.main === module) {
  const port = Number(process.argv[2] || process.env.PORT) || 8080;
  startServer(port).then(() => console.log(`Serving ${ROOT} at http://127.0.0.1:${port}/`));
}
