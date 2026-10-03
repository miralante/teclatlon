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
const { chromium } = require('playwright');

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

    const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('teclatlon:keyboard')));
    const keyColors = async () => page.locator('#screenName .keyboard .key.f-lp').first().evaluate((key) =>
      getComputedStyle(key).backgroundColor);

    // Theme and text size must update the actual page styles, not only the saved option.
    await page.locator('.btn-theme[data-theme="dark"]').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    const darkBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim());
    await page.locator('.btn-theme[data-theme="contrast"]').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'contrast');
    const contrastBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim());
    assert.notEqual(contrastBg, darkBg, 'alto contraste debe cambiar la paleta efectiva');
    await page.locator('.btn-theme[data-theme="light"]').click();
    await page.locator('.btn-text-size[data-text-size="huge"]').click();
    assert.equal(await page.locator('html').getAttribute('data-text-size'), 'huge');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--text-base').trim()), '30px');

    // Keyboard coloring must change the rendered keys, which catches a saved-but-not-applied option.
    await page.locator('.btn-color[data-color="hands"]').click();
    const handColor = await keyColors();
    await page.locator('.btn-color[data-color="fingers"]').click();
    assert.equal(await page.locator('.btn-color[data-color="fingers"]').getAttribute('aria-pressed'), 'true');
    assert.ok(await page.locator('#screenName .keyboard').evaluate((el) => el.classList.contains('color-fingers')));
    const fingerColor = await keyColors();
    assert.notEqual(fingerColor, handColor, 'el modo por dedo debe cambiar el color calculado de las teclas');

    // Layout changes alter the actual key set; extended mode also exposes its numpad.
    await page.locator('.btn-keyboard[data-keyboard="simple"]').click();
    const simpleCount = await page.locator('#screenName .keyboard .key').count();
    await page.locator('.btn-keyboard[data-keyboard="extended"]').click();
    const extendedCount = await page.locator('#screenName .keyboard .key').count();
    assert.notEqual(extendedCount, simpleCount, 'cada vista debe renderizar una disposición distinta');
    const numpad = page.locator('#screenName .numpad-inline');
    assert.notEqual(await numpad.evaluate((el) => getComputedStyle(el).display), 'none');

    // Accessibility toggles must affect visible UI and keep their persisted values in sync.
    await page.locator('#btnHideLegend').click();
    assert.ok(await page.locator('html').evaluate((el) => el.classList.contains('hide-legend')));
    assert.equal(await page.locator('#screenName .keyboard-legend').evaluate((el) => getComputedStyle(el).display), 'none');
    await page.locator('#btnHideNumpad').click();
    assert.ok(await page.locator('html').evaluate((el) => el.classList.contains('hide-numpad')));
    assert.equal(await numpad.evaluate((el) => getComputedStyle(el).display), 'none');
    await page.locator('#btnDimCelebration').click();
    assert.ok(await page.locator('html').evaluate((el) => el.classList.contains('dim-celebration')));
    await page.locator('#btnHideLegend').click();
    await page.locator('#btnHideNumpad').click();
    await page.locator('#btnDimCelebration').click();
    await page.locator('#btnFocusMode').click();
    assert.equal(await page.locator('#btnFocusMode').getAttribute('aria-pressed'), 'true');
    assert.deepEqual(await page.locator('html').evaluate((el) => ['hide-legend', 'hide-numpad', 'dim-celebration'].map((c) => el.classList.contains(c))), [true, true, true]);

    await page.locator('#btnKeySound').click();
    await page.locator('#btnErrorSound').click();
    await page.locator('#btnMetrics').click();
    await page.locator('#btnFingerText').click();
    assert.equal(await page.locator('#guideText').evaluate((el) => el.classList.contains('hidden')), true);

    // Stub Web Audio and call the same feedback API used by the game.
    await page.evaluate(() => {
      window.__settingsTones = 0;
      window.AudioContext = class {
        constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
        createOscillator() { return { frequency: {}, connect() {}, start() { window.__settingsTones++; }, stop() {} }; }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
        createStereoPanner() { return { pan: {}, connect() {} }; }
      };
      App.feedback.successSound(0);
      App.feedback.errorSound();
    });
    assert.equal(await page.evaluate(() => window.__settingsTones), 1, 'sonido de tecla apagado y sonido de error encendido');
    await page.locator('#btnErrorSound').click();
    await page.evaluate(() => App.feedback.errorSound());
    assert.equal(await page.evaluate(() => window.__settingsTones), 1, 'al apagar sonido de error no debe sonar');
    await page.locator('#btnKeySound').click();
    await page.evaluate(() => App.feedback.successSound(0));
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => window.__settingsTones), 3, 'al activar sonido de tecla debe sonar el aviso de éxito');
    await page.locator('#btnKeySound').click();
    await page.locator('#btnErrorSound').click();
    await page.locator('#restMinutesSelect').selectOption('30');
    await page.locator('#goalSettings').locator('summary').click();
    await page.locator('#goalSettings').locator('#goalAccuracySelect').selectOption('95');
    await page.locator('#goalSettings').locator('#goalSpeedSelect').selectOption('50');

    const persisted = await saved();
    assert.equal(persisted.options.keyboard, 'extended');
    assert.equal(persisted.options.color, 'fingers');
    assert.equal(persisted.options.theme, 'light');
    assert.equal(persisted.options.textSize, 'huge');
    assert.equal(persisted.options.hideLegend, true);
    assert.equal(persisted.options.hideNumpad, true);
    assert.equal(persisted.options.dimCelebration, true);
    assert.equal(persisted.options.keySound, false);
    assert.equal(persisted.options.errorSound, true);
    assert.equal(persisted.options.metrics, true);
    assert.equal(persisted.options.showFingerText, false);
    assert.equal(persisted.options.restMinutes, 30);
    assert.equal(persisted.goal.accuracyMin, 95);
    assert.equal(persisted.goal.speedMin, 50);

    await page.locator('#btnCloseSettings').click();
    await drawer.waitFor({ state: 'hidden' });
    assert.equal(await settingsButton.getAttribute('aria-expanded'), 'false');

    await page.locator('#btnSkipName').click();
    await page.locator('#gameMenu [data-mode="placement"]').click();
    await page.locator('#screenGame').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#liveMetrics').evaluate((el) => el.classList.contains('hidden')), false,
      'métricas activadas deben aparecer al comenzar a practicar');
    assert.equal(await page.locator('#goalBars').evaluate((el) => el.classList.contains('hidden')), false,
      'las metas guardadas deben aparecer en la barra de progreso');

    // A fresh app boot must restore the saved settings and apply them again.
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#screenName').waitFor({ state: 'visible' });
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    assert.equal(await page.locator('html').getAttribute('data-text-size'), 'huge');
    assert.equal(await page.locator('html').evaluate((el) => el.classList.contains('hide-legend')), true);
    assert.equal(await page.locator('html').evaluate((el) => el.classList.contains('hide-numpad')), true);
    assert.equal(await page.locator('html').evaluate((el) => el.classList.contains('dim-celebration')), true);
    assert.ok(await page.locator('#screenName .keyboard').evaluate((el) => el.classList.contains('color-fingers')));
    assert.equal(await page.locator('#screenName .keyboard .key').count(), extendedCount);
    assert.equal(await page.locator('#btnKeySound').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('#btnErrorSound').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#restMinutesSelect').inputValue(), '30');

    // The locale picker uses the app's own language setting and text dictionary.
    await page.locator('#btnOpenSettings').click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#settingsDrawer')).transform === 'matrix(1, 0, 0, 1, 0, 0)');
    await page.locator('#locale-picker .locale-picker-btn').click();
    await page.locator('#locale-picker .locale-picker-panel').waitFor({ state: 'visible' });
    await page.locator('#locale-picker .locale-picker-panel li[data-locale="en"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.match(await page.locator('#btnSkipName').textContent(), /Not now/i);
    assert.equal(await page.evaluate(() => localStorage.getItem('teclatlon:locale')), 'en');

    assert.deepEqual(pageErrors, [], `errores de página: ${pageErrors.join('; ')}`);
    assert.deepEqual(consoleErrors, [], `errores de consola: ${consoleErrors.join('; ')}`);
    console.log(`[ui-smoke] PASS: teclado visible (${keyCount} teclas), Ajustes abre y cierra correctamente`);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(`[ui-smoke] FAIL: ${error.stack || error.message}`);
  process.exitCode = 1;
});
