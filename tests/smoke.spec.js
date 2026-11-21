// tests/smoke.spec.js — the shared smoke of every app of the suite.
//
// It checks the contract that the shared components promise, and nothing that
// belongs to a single app: the page loads, the settings drawer opens and
// closes, the language row lives inside it, the page does not scroll sideways
// on a narrow screen, and the 404 page answers with the error and the way
// back. The flows of the app itself live in the app's own spec
// (tests/app.spec.js).
//
// Canonical source: apptonomia/scripts/suite/smoke.spec.js. Copied byte for
// byte to <app>/tests/smoke.spec.js by
// apptonomia/scripts/sync-suite-test-kit.js. Never edit a copy by hand.
'use strict';

const { test, expect } = require('./playwright.js');

/* Fails the test on any console error or uncaught exception of the page. */
function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  return errors;
}

/* The browser logs the 404 of the page itself as a console error. On the 404
   page that answer is the expected one, not a defect. */
function without404(errors) {
  return errors.filter((text) => !/Failed to load resource.*404/.test(text));
}

test('the home loads, with the settings drawer and no errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('./');

  const gear = page.locator('.locale-settings-trigger');
  await expect(gear).toBeVisible();
  await expect(gear).toHaveAttribute('aria-expanded', 'false');

  const drawer = page.locator('#accessibility-settings');
  await expect(drawer).toBeHidden();

  await gear.click();
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveAttribute('role', 'dialog');
  await expect(drawer).toHaveAttribute('aria-modal', 'true');
  // The language picker lives inside the drawer, as the first row.
  await expect(drawer.locator('.locale-picker-btn')).toHaveCount(1);

  await drawer.locator('[data-settings-close]').click();
  await expect(drawer).toBeHidden();
  expect(errors).toEqual([]);
});

test('no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('the 404 page shows the error, with the shared chrome and the way back', async ({ page }) => {
  const errors = watchErrors(page);
  /* A path that does not exist, the way a reader reaches the 404 page: the
     server answers with the 404 page and the 404 status. */
  const response = await page.goto('/esta-pagina-no-existe/');
  expect(response.status()).toBe(404);

  await expect(page.locator('.suite-chrome-header')).toBeVisible();
  await expect(page.locator('.suite-chrome-footer')).toBeVisible();
  await expect(page.locator('main h1')).toHaveText('Página no encontrada');
  // The way back is root-absolute: Cloudflare serves this page at the URL
  // that was asked for, so a relative link would resolve to another 404.
  await expect(page.locator('main a')).toHaveAttribute('href', '/');
  expect(without404(errors)).toEqual([]);
});
