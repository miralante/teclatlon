'use strict';

const { test, expect } = require('playwright/test');

// ---------------------------------------------------------------------------
// "All keys" challenge: phases, phase stars and the finger guide
//
// The challenge sweeps the whole keyboard three times, in three different
// orders (left→right, right→left, random). Those phases are internal: the
// guide next to the hand only names the key and the finger, never the
// phase. A star lights up at the end of each phase and the mode only ends
// after the last one.
// ---------------------------------------------------------------------------

const BASE = 'http://127.0.0.1:4173/';

let _browser;
let _ctx = null;

async function openApp() {
  const ctx = await _browser.newContext();
  _ctx = ctx;
  const page = await ctx.newPage();
  await ctx.addInitScript(() => {
    if (!localStorage.getItem('teclatlon:locale')) localStorage.setItem('teclatlon:locale', 'es');
    if (!localStorage.getItem('teclatlon:keyboard')) {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        name: '',
        options: { theme: 'dark', metrics: false },
        goal: { accuracyMin: 0, speedMin: 0 }
      }));
    }
  });
  await page.goto(BASE);
  await expect(page.locator('#screenName')).toBeVisible();
  return page;
}

async function skipToMenu() {
  const page = await openApp();
  await page.locator('#btnSkipName').click();
  await expect(page.locator('#screenMenu')).toBeVisible();
  return page;
}

async function startChallenge(page) {
  await page.locator('[data-mode="allKeys"]').click();
  await expect(page.locator('#screenGame')).toBeVisible();
  await expect(page.locator('#challengeZone')).toBeVisible();
}

/** The key the app is asking for right now (the one marked .target), or
    null while it waits between phases. */
function currentTarget(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#keyboardPanel .key.target');
    return el ? el.dataset.ch : null;
  });
}

async function press(page, ch) {
  await page.evaluate((c) => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: c,
      code: c === ' ' ? 'Space' : 'Key' + c.toUpperCase(),
      bubbles: true,
      cancelable: true
    }));
  }, ch);
  await page.waitForTimeout(30);
}

/** Press keys until `until` is true, reading the current target each time
    (the order differs per phase, so the test never hardcodes it). */
async function pressUntil(page, until, maxSteps) {
  for (let i = 0; i < maxSteps; i++) {
    if (await until()) return true;
    const target = await currentTarget(page);
    if (target === null) {
      if (await page.locator('#screenMenu').isVisible()) return false;
      await page.waitForTimeout(200);
      continue;
    }
    await press(page, target);
  }
  return until();
}

/** The `#challengeStars` markers, as [earned, active] per phase. */
function starStates(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('#challengeStars .challenge-star')).map((el) => ({
      earned: el.classList.contains('earned'),
      active: el.classList.contains('active')
    }))
  );
}

test.describe('Teclatlon — reto de todas las teclas', () => {
  test.beforeEach(({ browser }) => { _browser = browser; });

  test.afterEach(async () => {
    if (_ctx) { await _ctx.close(); _ctx = null; }
  });

  test('el texto de la mano no dice en qué fase está y sí dice el dedo', async ({ page }) => {
    page = await skipToMenu();
    await startChallenge(page);

    // Three stars in the progress zone, none earned yet.
    expect(await starStates(page)).toEqual([
      { earned: false, active: true },
      { earned: false, active: false },
      { earned: false, active: false }
    ]);

    const rest = await page.evaluate(() => App.i18n.t('core.rest'));
    const phaseWords = ['Fase', 'fase', 'Phase', 'phase'];

    for (let i = 0; i < 5; i++) {
      const text = await page.locator('#guideText').textContent();
      expect(text.trim()).not.toBe('');
      for (const word of phaseWords) {
        expect(text).not.toContain(word);
      }
      expect(text).not.toContain(rest);
      // It still points at a key and a finger.
      expect(text).toMatch(/dedo|pulgar|finger|thumb/i);
      const target = await currentTarget(page);
      if (target === null) break;
      await press(page, target);
    }
  });

  test('cada fase encciende su estrella y el reto sigue hasta la última', async ({ page }) => {
    page = await skipToMenu();
    await startChallenge(page);

    // Phase 1 done: the first star is lit, the second is the active one
    // and the challenge is still running.
    await pressUntil(page, async () => (await starStates(page))[0].earned, 120);
    expect(await page.locator('#screenGame')).toBeVisible();
    await expect(page.locator('#challengeText')).not.toContainText('0 de');

    // Phase 2 done: two stars, still playing.
    await pressUntil(page, async () => (await starStates(page))[1].earned, 120);
    expect(await page.locator('#screenGame')).toBeVisible();
    expect((await starStates(page)).filter((s) => s.earned).length).toBe(2);

    // Phase 3 done: the challenge ends and awards the mode.
    await pressUntil(page, async () => await page.locator('#screenMenu').isVisible(), 200);
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 10000 });
    // The last phase earns its star too, so the row was full before the
    // challenge closed.
    const finalStars = await starStates(page);
    expect(finalStars.length).toBe(3);
    expect(finalStars.every((s) => s.earned)).toBe(true);
    const completed = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('teclatlon:keyboard')).completed);
    expect(completed.allKeys).toBe(true);
  });

  test('el texto del dedo se puede ocultar y volver a mostrar (por defecto visible)', async ({ page }) => {
    page = await skipToMenu();
    await startChallenge(page);

    // Default: visible.
    await expect(page.locator('#guideText')).toBeVisible();
    const shown = (await page.locator('#guideText').textContent()).trim();
    expect(shown).not.toBe('');

    // Off: hidden, without having to press anything else.
    await page.locator('#btnOpenSettings').click();
    await page.evaluate(() => document.querySelector('#btnFingerText').click());
    await page.locator('#btnCloseSettings').click();
    await expect(page.locator('#guideText')).toBeHidden();
    expect(await page.evaluate(() =>
      JSON.parse(localStorage.getItem('teclatlon:keyboard')).options.showFingerText)).toBe(false);

    // On again: the same sentence comes back.
    await page.locator('#btnOpenSettings').click();
    await page.evaluate(() => document.querySelector('#btnFingerText').click());
    await page.locator('#btnCloseSettings').click();
    await expect(page.locator('#guideText')).toBeVisible();
    expect((await page.locator('#guideText').textContent()).trim()).toBe(shown);
  });
});
