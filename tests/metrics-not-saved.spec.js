// @ts-check
// Round metrics (accuracy and key counts) live in memory only. The legal page
// promises that accuracy and time are never stored, so nothing of them may
// reach localStorage, not even a leftover from an older version.
const { test, expect } = require('@playwright/test');

test('las métricas de la ronda no llegan a localStorage', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('teclatlon:keyboard', JSON.stringify({
      name: 'Ana', stars: 0, completed: {}, options: {},
      metrics: { keys: 5, hits: 5, misses: 0, startMs: 1 }
    }));
  });
  await page.reload();
  await page.goto('/#/screenMenu');
  await expect(page.locator('#screenMenu')).toBeVisible();

  await page.locator('[data-mode="placement"]').click();
  await expect(page.locator('#screenGame')).toBeVisible();
  await page.keyboard.press('x');
  await page.keyboard.press('f');

  await page.evaluate(() => window.Teclatlon.save());
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('teclatlon:keyboard')));
  expect(saved).not.toHaveProperty('metrics');
});
