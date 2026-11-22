// @ts-check
// The star notebook (carnet): opened from the icon beside the star counter.
// It only reads progress that is saved: state.completed (done or not) and
// state.starsBy (stars per activity). Saves from before the counter count a
// completed activity as one star.
const { test, expect } = require('./playwright.js');

async function openWith(page, state) {
  await page.goto('/');
  await page.evaluate((s) => {
    localStorage.setItem('teclatlon:keyboard', JSON.stringify(s));
  }, state);
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.goto('/#/screenMenu');
  await expect(page.locator('#screenMenu')).toBeVisible();
}

test('the carnet icon sits beside the star counter and opens the notebook', async ({ page }) => {
  await openWith(page, { stars: 2, completed: { l1: true }, starsBy: { l1: 2 }, achievements: {}, options: {}, goal: {}, name: '' });
  await expect(page.locator('#stars #starsCount')).toHaveText('⭐ 2');
  await page.locator('#btnCarnet').click();
  await expect(page.locator('#screenCarnet')).toBeVisible();
  await expect(page.locator('#screenMenu')).toBeHidden();
  await expect(page.locator('#carnetSummary')).toContainText('Estrellas: 2');
  await expect(page.locator('#carnetSummary')).toContainText('Hechas: 1');
});

test('each lesson shows done or pending, and the stars it has', async ({ page }) => {
  await openWith(page, { stars: 3, completed: { l1: true, l2: true }, starsBy: { l1: 3, l2: 0 }, achievements: {}, options: {}, goal: {}, name: '' });
  await page.locator('#btnCarnet').click();
  const first = page.locator('.carnet-item', { hasText: 'F y J' });
  await expect(first.locator('.carnet-status')).toHaveText('Hecha');
  await expect(first.locator('.carnet-stars')).toHaveText('⭐ 3');
  const second = page.locator('.carnet-item', { hasText: 'D y K' });
  await expect(second.locator('.carnet-status')).toHaveText('Hecha');
  await expect(second.locator('.carnet-stars')).toHaveText('⭐ 1');
  const pending = page.locator('.carnet-item', { hasText: 'S y L' });
  await expect(pending.locator('.carnet-status')).toHaveText('Pendiente');
  await expect(pending.locator('.carnet-stars')).toHaveText('⭐ 0');
});

test('an old save with no star counter counts each completed activity as one star', async ({ page }) => {
  await openWith(page, { stars: 1, completed: { l1: true }, achievements: {}, options: {}, goal: {}, name: '' });
  await page.locator('#btnCarnet').click();
  const first = page.locator('.carnet-item', { hasText: 'F y J' });
  await expect(first.locator('.carnet-stars')).toHaveText('⭐ 1');
});

test('the back button returns to the menu', async ({ page }) => {
  await openWith(page, { stars: 0, completed: {}, starsBy: {}, achievements: {}, options: {}, goal: {}, name: '' });
  await page.locator('#btnCarnet').click();
  await expect(page.locator('#screenCarnet')).toBeVisible();
  await page.locator('#btnBackFromCarnet').click();
  await expect(page.locator('#screenMenu')).toBeVisible();
});
