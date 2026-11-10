'use strict';

const { test, expect } = require('playwright/test');

// Regressions for three boot and navigation edge cases:
// - a stored value that is not an object ("null") used to stop the app from
//   starting, and the progress could then only be reset by hand;
// - a deep link to #/screenGame left every screen hidden.

const BASE = `http://127.0.0.1:${process.env.PORT || 4173}/`;

test('un progreso guardado como "null" no impide arrancar la app', async ({ context }) => {
  await context.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('teclatlon:keyboard', 'null');
    }
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE);

  // Without a name the app opens on the name screen.
  await expect(page.locator('#screenName')).toBeVisible();
  expect(errors).toEqual([]);
});

test('el enlace #/screenGame lleva al menú en vez de dejar la página vacía', async ({ context }) => {
  await context.addInitScript(() => {
    if (!localStorage.getItem('teclatlon:keyboard')) {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({ name: 'Ana', options: {} }));
    }
  });
  const page = await context.newPage();
  await page.goto(BASE + '#/screenGame');

  await expect(page.locator('#screenMenu')).toBeVisible();
  await expect(page.locator('#screenGame')).toBeHidden();
});
