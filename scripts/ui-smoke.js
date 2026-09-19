/* Teclatlon · real-browser UI smoke test.
   Run after installing the dependency and Chromium:
     npm install
     npx playwright install chromium
     npm run test:ui
*/
'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function startServer() {
  const server = http.createServer((req, res) => {
    let requestPath;
    try {
      requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
    } catch (error) {
      res.writeHead(400);
      res.end('bad request');
      return;
    }
    if (requestPath === '/') requestPath = '/index.html';
    const file = path.resolve(ROOT, '.' + requestPath);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(error.code === 'ENOENT' ? 404 : 500);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, url: `http://127.0.0.1:${address.port}/` });
    });
  });
}

async function main() {
  const { server, url } = await startServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      locale: 'es-ES',
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.locator('#screenName').waitFor({ state: 'visible' });

    const visibleKeyboard = page.locator('#screenName .keyboard .key:visible');
    const keyCount = await visibleKeyboard.count();
    assert.ok(keyCount > 0, 'el teclado visual debe contener teclas visibles');

    const settingsButton = page.locator('#btnOpenSettings');
    await settingsButton.click();
    const drawer = page.locator('#settingsDrawer');
    await drawer.waitFor({ state: 'visible' });
    assert.equal(await settingsButton.getAttribute('aria-expanded'), 'true');
    assert.equal(await drawer.getAttribute('role'), 'dialog');

    await page.locator('#btnCloseSettings').click();
    await drawer.waitFor({ state: 'hidden' });
    assert.equal(await settingsButton.getAttribute('aria-expanded'), 'false');

    assert.deepEqual(pageErrors, [], `errores de página: ${pageErrors.join('; ')}`);
    assert.deepEqual(consoleErrors, [], `errores de consola: ${consoleErrors.join('; ')}`);
    console.log(`[ui-smoke] PASS: teclado visible (${keyCount} teclas), Ajustes abre y cierra correctamente`);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(`[ui-smoke] FAIL: ${error.message}`);
  process.exitCode = 1;
});
