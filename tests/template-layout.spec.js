'use strict';

const { test, expect } = require('playwright/test');

// Regression: the Spanish "real texts" were not filtered by the keyboard. On
// the US layout a Spanish template with ñ or an accent could never be finished.
// Lines the active keyboard cannot type are now left out, and a template with
// none left is shown as unavailable.

const BASE = `http://127.0.0.1:${process.env.PORT || 4173}/`;

test.use({ locale: 'es-ES' });

async function openTemplates(context, layout) {
  await context.addInitScript((lay) => {
    if (!localStorage.getItem('teclatlon:keyboard')) {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        name: 'Ana', stars: 0, completed: {},
        options: { keyboard: 'normal', layout: lay, theme: 'light', textSize: 'normal' },
        goal: { accuracyMin: 0, speedMin: 0 }
      }));
    }
  }, layout);
  const page = await context.newPage();
  await page.goto(BASE);
  await expect(page.locator('#screenMenu')).toBeVisible();
  await page.locator('[data-mode="templates"]').click();
  await expect(page.locator('#screenTemplates')).toBeVisible();
  return page;
}

test('teclado US: las plantillas con ñ o acentos quedan no disponibles', async ({ context }) => {
  const page = await openTemplates(context, 'us');
  const buttons = page.locator('#templatesList button');
  const total = await buttons.count();
  const disabled = await page.locator('#templatesList button:disabled').count();
  expect(total).toBeGreaterThan(0);
  expect(disabled).toBeGreaterThan(0);
  expect(disabled).toBeLessThan(total);
});

test('teclado US: una plantilla jugable no pide ñ ni acentos', async ({ context }) => {
  const page = await openTemplates(context, 'us');
  await page.locator('#templatesList button:not(:disabled)').first().click();
  await expect(page.locator('#screenGame')).toBeVisible();
  const text = await page.locator('#targetZone').innerText();
  expect(text).not.toMatch(/[ñáéíóú]/i);
});

test('teclado español: todas las plantillas se pueden jugar', async ({ context }) => {
  const page = await openTemplates(context, 'es');
  await expect(page.locator('#templatesList button:disabled')).toHaveCount(0);
});
