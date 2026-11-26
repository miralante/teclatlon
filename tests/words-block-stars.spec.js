'use strict';

const { test, expect } = require('./playwright.js');

// ---------------------------------------------------------------------------
// Words round: blocks and their stars
//
// A long words round is split into blocks. Each block earns one star under
// the progress bar, the same way the all-keys challenge shows its phase stars:
// the star lights when its block is finished, the next one pulses while it is
// being typed, and the pause between blocks ("Seguir") waits for the person.
// ---------------------------------------------------------------------------

const BASE = `http://127.0.0.1:${process.env.PORT || 4173}/`;

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

async function press(page, ch) {
  await page.evaluate((c) => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: c,
      code: c === ' ' ? 'Space' : 'Key' + c.toUpperCase(),
      bubbles: true,
      cancelable: true
    }));
  }, ch);
  await page.waitForTimeout(20);
}

/** Type the letter the round is asking for, one at a time, until `until` is
    true. Between words the target is empty for half a second; wait it out. */
async function typeUntil(page, until, maxSteps) {
  const current = page.locator('#targetZone .letter.current');
  for (let i = 0; i < maxSteps; i++) {
    if (await until()) return true;
    if (!(await current.count())) {
      await page.waitForTimeout(100);
      continue;
    }
    const letter = await current.first().textContent();
    await press(page, letter === '␣' ? ' ' : letter);
  }
  return until();
}

/** The `#challengeStars` markers of the round, as [earned, active] per block. */
function starStates(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('#challengeStars .challenge-star')).map((el) => ({
      earned: el.classList.contains('earned'),
      active: el.classList.contains('active')
    }))
  );
}

test.describe('Teclatlon — bloques de palabras y sus estrellas', () => {
  test.beforeEach(({ browser }) => { _browser = browser; });

  test.afterEach(async () => {
    if (_ctx) { await _ctx.close(); _ctx = null; }
  });

  test('cada bloque de palabras enciende una estrella al terminarlo', async ({ page }) => {
    test.setTimeout(120000);
    page = await skipToMenu();
    await page.locator('[data-mode="words"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();

    // A round of 20 or more words has two blocks, so two stars under the bar.
    await expect(page.locator('#challengeZone')).toBeVisible();
    const start = await starStates(page);
    expect(start.length).toBeGreaterThan(1);
    expect(start[0]).toEqual({ earned: false, active: true });
    expect(start.slice(1).every((s) => !s.earned)).toBe(true);

    // Type until the first block is done: the pause shows and the first star lights.
    expect(await typeUntil(page, () => page.locator('#blockPause').isVisible(), 400)).toBe(true);
    const paused = await starStates(page);
    expect(paused[0]).toEqual({ earned: true, active: false });
    expect(paused[1]).toEqual({ earned: false, active: true });

    // "Seguir" resumes the round; nothing is typed while the pause is up.
    await page.locator('#btnBlockContinue').click();
    await expect(page.locator('#blockPause')).toBeHidden();
    await expect(page.locator('#targetZone .letter.current')).toHaveCount(1);

    // Finish the round: every star is lit when the round ends.
    expect(await typeUntil(page, () => page.locator('#app-celebration').isVisible(), 600)).toBe(true);
    const finished = await starStates(page);
    expect(finished.length).toBe(start.length);
    expect(finished.every((s) => s.earned)).toBe(true);
  });

  test('la actividad de todas las teclas sigue mostrando sus propias estrellas de fase', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="allKeys"]').click();
    await expect(page.locator('#challengeZone')).toBeVisible();
    // Three phases, three stars: the block markers never add to them.
    expect((await starStates(page)).length).toBe(3);
  });
});
