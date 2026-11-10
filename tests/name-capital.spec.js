'use strict';

const { test, expect } = require('playwright/test');

// Regression: in the "Escribe tu nombre." step of the words game the saved name
// was shown in lowercase ("carlos") even though it is written with a capital.
// The step must show the first letter capitalised automatically, and the player
// must still press the lowercase key without Shift.

const BASE = `http://127.0.0.1:${process.env.PORT || 4173}/`;

test('escribe tu nombre: la primera letra se muestra en mayúscula sin exigir Shift', async ({ context }) => {
  await context.addInitScript(() => {
    if (!localStorage.getItem('teclatlon:keyboard')) {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        name: 'carlos',
        options: { lang: 'es', theme: 'dark', metrics: false },
        goal: { accuracyMin: 0, speedMin: 0 }
      }));
    }
  });
  const page = await context.newPage();
  await page.goto(BASE);
  await expect(page.locator('#screenMenu')).toBeVisible();

  await page.locator('[data-mode="words"]').click();
  await expect(page.locator('#screenGame')).toBeVisible();

  // First step is the name step.
  await expect(page.locator('#gameInstruction')).toHaveText('Escribe tu nombre.');
  const letters = await page.locator('#targetZone .letter').allTextContents();
  expect(letters.slice(0, 6).join('')).toBe('Carlos');

  // The guide asks for the lowercase key, with no Shift.
  const targetCh = await page.evaluate(() => {
    const el = document.querySelector('#keyboardPanel .key.target');
    return el ? el.dataset.ch : null;
  });
  expect(targetCh).toBe('c');
});
