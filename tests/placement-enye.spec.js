'use strict';

const { test, expect } = require('playwright/test');

// Regression: in the "finger placement" activity the guide lit the N key
// (and pointed at the middle finger) when the lesson asked for Ñ, so a real N
// press was marked as an error and the Ñ never lit. The guide must mark the
// Ñ key itself, and only a Ñ press may advance the step.

const BASE = `http://127.0.0.1:${process.env.PORT || 4173}/`;

async function targetKey(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#keyboardPanel .key.target');
    return el ? el.dataset.ch : null;
  });
}

/** Dispatch a keydown the way the app's document listener receives it from a
    real keyboard. Used for ñ, which Playwright's keyboard.press() cannot send. */
async function dispatchKey(page, key) {
  await page.evaluate((k) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  }, key);
}

test('posición de los dedos: la guía marca la Ñ, no la N', async ({ context }) => {
  await context.addInitScript(() => {
    if (!localStorage.getItem('teclatlon:keyboard')) {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        name: '',
        options: { lang: 'es', theme: 'dark', metrics: false },
        goal: { accuracyMin: 0, speedMin: 0 }
      }));
    }
  });
  const page = await context.newPage();
  await page.goto(BASE);
  await expect(page.locator('#screenName')).toBeVisible();
  await page.locator('#btnSkipName').click();
  await expect(page.locator('#screenMenu')).toBeVisible();

  await page.locator('[data-mode="placement"]').click();
  await expect(page.locator('#screenGame')).toBeVisible();

  // Press the guided key for each step until the guide reaches the Ñ step.
  for (let i = 0; i < 40; i++) {
    const t = await targetKey(page);
    if (t === 'ñ') break;
    if (t === null) { await page.waitForTimeout(150); continue; }
    await dispatchKey(page, t);
    await page.waitForTimeout(60);
  }

  expect(await targetKey(page)).toBe('ñ');
  await expect(page.locator('#keyboardPanel .key.target[data-ch="ñ"]')).toHaveCount(1);
  await expect(page.locator('#keyboardPanel .key.target[data-ch="n"]')).toHaveCount(0);

  // A real N press is not the Ñ: the step must not advance.
  await page.keyboard.press('n');
  await page.waitForTimeout(100);
  expect(await targetKey(page)).toBe('ñ');

  // The Ñ press completes the step.
  await dispatchKey(page, 'ñ');
  await page.waitForTimeout(700);
  expect(await targetKey(page)).not.toBe('ñ');

  await page.locator('#btnExitGame').click();
  await expect(page.locator('#screenMenu')).toBeVisible();
});
