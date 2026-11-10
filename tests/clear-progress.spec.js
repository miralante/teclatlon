'use strict';

const { test, expect } = require('playwright/test');

// Regression: "Borrar mi progreso" rebuilt the options by hand and left out the
// rest interval, the finger-text switch and the physical layout. The rest box
// showed nothing, the finger guide stayed hidden and aria-pressed read
// "undefined" until a reload. A reset must leave the same defaults as a first run.

const BASE = `http://127.0.0.1:${process.env.PORT || 4173}/`;

// Spanish browser, so the default physical layout is 'es'.
test.use({ locale: 'es-ES' });

test('borrar progreso restaura los valores por defecto de la primera vez', async ({ context }) => {
  await context.addInitScript(() => {
    if (!localStorage.getItem('teclatlon:keyboard')) {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        name: 'Ana', stars: 2, completed: { placement: true },
        options: { keyboard: 'extended', layout: 'us', showFingerText: false, restMinutes: 45, theme: 'dark', textSize: 'large' },
        goal: { accuracyMin: 0, speedMin: 0 }
      }));
    }
  });
  const page = await context.newPage();
  await page.goto(BASE);
  await expect(page.locator('#screenMenu')).toBeVisible();

  // Two presses: the first asks for confirmation, the second clears.
  await page.locator('#btnClearAll').click();
  await page.locator('#btnClearAll').click();

  await expect(page.locator('#restMinutesInput')).toHaveValue('20');
  await expect(page.locator('#btnFingerText')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#guideText')).not.toHaveClass(/hidden/);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('teclatlon:keyboard')));
  expect(saved.options.restMinutes).toBe(20);
  expect(saved.options.showFingerText).toBe(true);
  expect(saved.options.layout).toBe('es');
});

test('borrar progreso también borra los logros ganados', async ({ context }) => {
  await context.addInitScript(() => {
    if (!localStorage.getItem('teclatlon:keyboard')) {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({ name: 'Ana', stars: 1, completed: { l1: true }, options: {} }));
      localStorage.setItem('teclatlon:achievements', JSON.stringify({ firstStar: 1700000000000 }));
    }
  });
  const page = await context.newPage();
  await page.goto(BASE);
  await expect(page.locator('#screenMenu')).toBeVisible();

  await page.locator('#btnClearAll').click();
  await page.locator('#btnClearAll').click();

  const achievements = await page.evaluate(() => localStorage.getItem('teclatlon:achievements'));
  expect(achievements).toBeNull();
});
