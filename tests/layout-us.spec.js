'use strict';

const { test, expect } = require('playwright/test');

// The physical keyboard follows the browser language: an English browser
// gets the US layout (Ñ is a semicolon key), a Spanish one gets the Spanish
// layout (with Ñ). Settings can change it either way.

const BASE = `http://127.0.0.1:${process.env.PORT || 4173}/`;

async function openPlacement(page) {
  await page.goto(BASE);
  await expect(page.locator('#screenName')).toBeVisible();
  await page.locator('#btnSkipName').click();
  await expect(page.locator('#screenMenu')).toBeVisible();
  await page.locator('[data-mode="placement"]').click();
  await expect(page.locator('#screenGame')).toBeVisible();
}

test.describe('teclado US según el idioma del navegador', () => {
  test.use({ locale: 'en-US' });

  test('un navegador en inglés usa el teclado US (; en lugar de Ñ)', async ({ page }) => {
    await openPlacement(page);
    await expect(page.locator('#keyboardPanel .key[data-ch=";"]')).toHaveCount(1);
    await expect(page.locator('#keyboardPanel .key[data-ch="ñ"]')).toHaveCount(0);
  });

  test('cambiar de teclado en mitad de una ronda avisa de que se usará en la siguiente', async ({ page }) => {
    await openPlacement(page);
    await page.locator('#btnOpenSettings').click();
    await page.locator('.btn-layout[data-layout="es"]').click();
    await page.locator('#btnCloseSettings').click();
    const notice = 'The new keyboard will be used in the next round.';
    await expect(page.locator('#feedback')).toHaveText(notice);

    // The notice stays on screen after a step is completed in the same round.
    await page.evaluate(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }));
    });
    await page.waitForTimeout(700);
    await expect(page.locator('#feedback')).toHaveText(notice);
  });

  test('en Ajustes se puede volver al teclado español y la Ñ reaparece', async ({ page }) => {
    await openPlacement(page);
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenMenu')).toBeVisible();

    await page.locator('#btnOpenSettings').click();
    await page.locator('.btn-layout[data-layout="es"]').click();
    await expect(page.locator('.btn-layout[data-layout="es"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#btnCloseSettings').click();

    await page.locator('[data-mode="placement"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await expect(page.locator('#keyboardPanel .key[data-ch="ñ"]')).toHaveCount(1);
    await expect(page.locator('#keyboardPanel .key[data-ch=";"]')).toHaveCount(0);
  });
});
