// @ts-check
// Stars are per session: a lesson finished in an earlier session must not
// show its ⭐ (or the "done" count) when the app opens again, but it stays
// unlocked, so the next lesson is still reachable. See doc/*/technical.md
// (award / doneThisSession).
const { test, expect } = require('@playwright/test');

test('a new session shows no ⭐ for old completions but keeps the next lesson unlocked', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('teclatlon:keyboard', JSON.stringify({
      stars: 2, completed: { l1: true, l2: true, words: true }, achievements: {}, options: {}, goal: {}, name: ''
    }));
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.goto('/#/screenMenu');
  await expect(page.locator('#screenMenu')).toBeVisible();

  // The header still counts the permanent stars.
  await expect(page.locator('#stars')).toContainText('2');

  // No lesson is marked done in this session, so no ⭐ and no "done" class.
  await page.locator('[data-mode="lessons"]').click();
  await expect(page.locator('#lessonsList .btn-lesson.done')).toHaveCount(0);
  await expect(page.locator('#lessonsList .btn-lesson').nth(1)).toBeEnabled();
  await expect(page.locator('#lessonsList .btn-lesson').nth(2)).toBeEnabled();
  await expect(page.locator('#lessonsList .btn-lesson').nth(0).locator('span').last()).toHaveText('');
});
