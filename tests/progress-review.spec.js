'use strict';

const { test, expect } = require('./playwright.js');

// The shared progress bar (assets/css/components.css) shows the advance of
// every sequence activity, and a real text ends with a review of every line
// typed, before the achievement. "Repetir este texto" starts the same text again.

const BASE = `http://127.0.0.1:${process.env.PORT || 4173}/`;

test.use({ locale: 'es-ES' });

async function openMenu(context) {
  await context.addInitScript(() => {
    if (!localStorage.getItem('teclatlon:keyboard')) {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        name: 'Ana', stars: 0, completed: {},
        options: { keyboard: 'normal', layout: 'es', theme: 'light', textSize: 'normal' },
        goal: { accuracyMin: 0, speedMin: 0 }
      }));
    }
  });
  const page = await context.newPage();
  await page.goto(BASE);
  await expect(page.locator('#screenMenu')).toBeVisible();
  return page;
}

async function typeChar(page, c) {
  await page.evaluate((ch) => {
    const isUpper = ch === ch.toUpperCase() && ch !== ch.toLowerCase();
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: ch,
      code: ch === ' ' ? 'Space' : 'Key' + ch.toUpperCase(),
      bubbles: true, cancelable: true,
      shiftKey: isUpper
    }));
  }, c);
  await page.waitForTimeout(30);
}

test('palabras: la barra de progreso aparece y avanza al escribir', async ({ context }) => {
  const page = await openMenu(context);
  await page.locator('[data-mode="words"]').click();
  await expect(page.locator('#screenGame')).toBeVisible();
  const bar = page.locator('#gameProgress');
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute('aria-valuenow', '0');
  const cur = (await page.locator('#targetZone .letter.current').innerText()).trim();
  await typeChar(page, cur);
  const now = Number(await bar.getAttribute('aria-valuenow'));
  expect(now).toBeGreaterThan(0);
});

test('textos reales: la barra de progreso aparece durante el texto', async ({ context }) => {
  const page = await openMenu(context);
  await page.locator('[data-mode="templates"]').click();
  await page.locator('#templatesList .btn-lesson').first().click();
  await expect(page.locator('#screenGame')).toBeVisible();
  await expect(page.locator('#gameProgress')).toBeVisible();
});

test('textos reales: al terminar se repasa lo escrito y se puede repetir', async ({ context }) => {
  const page = await openMenu(context);
  await page.locator('[data-mode="templates"]').click();
  await page.locator('#templatesList .btn-lesson').first().click();
  await expect(page.locator('#screenGame')).toBeVisible();

  // Same first template as test 14 in app.spec.js ('Correo a una amiga').
  const lines = [
    'Hola Marta,',
    'Espero que estes bien.',
    'Hoy aprendí a escribir con el teclado.',
    'Un abrazo.'
  ];
  for (const line of lines) {
    for (const ch of line) await typeChar(page, ch);
    await page.waitForTimeout(1200);
  }

  // Before the achievement: every line typed is shown.
  await expect(page.locator('#reviewZone')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#reviewLines li')).toHaveCount(lines.length);
  await expect(page.locator('#app-celebration')).toBeHidden();

  // Repeat: the same text starts again, the review closes.
  await page.locator('#btnReviewRepeat').click();
  await expect(page.locator('#reviewZone')).toBeHidden();
  await expect(page.locator('#gameCard')).toBeVisible();
  await expect(page.locator('#gameProgress')).toHaveAttribute('aria-valuenow', '0');
});
