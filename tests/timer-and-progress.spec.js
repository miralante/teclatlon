'use strict';

const { test, expect } = require('playwright/test');

// ---------------------------------------------------------------------------
// Practice clock (header) + the "all keys" progress bar
//
// Two separate things, one file because they touch the same screen.
//
// The clock: the rest reminder counts *practice* time in a module variable
// nobody outside feedback.js can see. `practiceSeconds()` exposes it, and
// app.js paints it in the header when the person turns it on. The gate that
// matters is not "a number appears" — it is that the clock and the reminder
// are the *same* number: it must count practice, ignore idle, and drop back
// to zero in the same instant the reminder fires.
//
// The progress bar: `.progress-bar` is the suite's 6px compact track, and in
// every Calculia activity it is a leaf holding only the fill and the text.
// Teclatlon used to point the id at the track itself and put the phase stars
// inside it, so `overflow: hidden` clipped them away and pushed the fill 44px
// down the same 6px window. The gate asserts the shape (track is a leaf,
// stars are a sibling) *and* the consequence (nothing is clipped), because
// the shape alone would pass again the day someone re-nests the markup.
// ---------------------------------------------------------------------------

const BASE = `http://127.0.0.1:${process.env.PORT || 4173}/`;
const MIN = 60 * 1000;

let _browser;
let _ctx = null;

/** Open the app on a brand-new context so no state leaks between tests. */
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

/** Add a controllable offset to the page clock (lost on reload). */
async function installClock(page) {
  await page.evaluate(() => {
    const realNow = Date.now;
    window.__offset = 0;
    Date.now = () => realNow() + window.__offset;
  });
}

/** Advance the clock while the person keeps typing: 30 s steps, so no single
    step crosses the 1 min idle window the counter allows. The keydown is
    dispatched non-bubbling on document, reaching the counter's capture
    listener without reaching the game's own key handler. */
async function simulatePractice(page, minutes) {
  await page.evaluate((totalMs) => {
    const step = 30 * 1000;
    let left = totalMs;
    while (left > 0) {
      const chunk = Math.min(step, left);
      window.__offset += chunk;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      left -= chunk;
    }
  }, minutes * MIN);
}

/** Advance the clock with nobody at the keyboard. */
async function simulateIdle(page, minutes) {
  await page.evaluate((totalMs) => { window.__offset += totalMs; }, minutes * MIN);
}

/** Open the ⚙️ drawer, flip #btnShowTimer, close it again. */
async function toggleTimer(page) {
  await page.locator('#btnOpenSettings').click();
  await expect(page.locator('#btnShowTimer')).toBeVisible();
  await page.locator('#btnShowTimer').click();
  await page.locator('#btnCloseSettings').click();
}

/** Minutes currently painted in the header clock, or null when hidden. */
async function shownMinutes(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#sessionTimer');
    if (!el || el.classList.contains('hidden')) return null;
    const m = /(\d+)/.exec(el.textContent || '');
    return m ? Number(m[1]) : null;
  });
}

function savedOptions(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('teclatlon:keyboard')).options);
}

test.describe('Teclatlon — Temporizador de práctica', () => {
  test.beforeEach(({ browser }) => { _browser = browser; });

  test.afterEach(async () => {
    if (_ctx) { await _ctx.close(); _ctx = null; }
  });

  test('está apagado por defecto y solo aparece si se pide', async () => {
    const page = await openApp();

    // Off: nothing in the header, nothing in the saved options. The app
    // does not put a clock in front of anyone who did not ask for one.
    await expect(page.locator('#sessionTimer')).toBeHidden();
    expect(await savedOptions(page)).not.toHaveProperty('showTimer', true);
    expect(await page.evaluate(() => document.querySelector('#btnShowTimer').getAttribute('aria-pressed'))).toBe('false');

    // On: the clock appears and says zero.
    await toggleTimer(page);
    await expect(page.locator('#sessionTimer')).toBeVisible();
    expect(await savedOptions(page)).toHaveProperty('showTimer', true);
    expect(await shownMinutes(page)).toBe(0);
    expect(await page.evaluate(() => document.querySelector('#btnShowTimer').getAttribute('aria-pressed'))).toBe('true');

    // Off again, and the header goes quiet.
    await toggleTimer(page);
    await expect(page.locator('#sessionTimer')).toBeHidden();
    expect(await savedOptions(page)).toHaveProperty('showTimer', false);
    expect(await shownMinutes(page)).toBeNull();
  });

  test('cuenta el tiempo de escritura y no el tiempo de espera', async () => {
    const page = await openApp();
    await installClock(page);
    await toggleTimer(page);

    // Three minutes of typing moves the clock by three minutes. The clock
    // itself keeps ticking in real time while we wait, so the reading may
    // have crossed into the next minute: the point is the size, not the
    // exact second.
    await simulatePractice(page, 3);
    await page.waitForTimeout(1100);
    const afterTyping = await shownMinutes(page);
    expect(afterTyping).toBeGreaterThanOrEqual(3);
    expect(afterTyping).toBeLessThanOrEqual(4);

    // Five minutes with nobody touching the keyboard adds nothing.
    const before = afterTyping;
    await simulateIdle(page, 5);
    await page.waitForTimeout(1100);
    const afterIdle = await shownMinutes(page);
    expect(afterIdle).toBeLessThanOrEqual(before + 1);
  });

  test('es el mismo contador que el aviso de descanso: vuelve a cero con él', async () => {
    const page = await openApp();
    await installClock(page);

    // A one-minute interval, so the reminder fires while the test runs.
    await page.locator('#btnOpenSettings').click();
    await page.locator('#restMinutesInput').fill('1');
    await page.locator('#restMinutesInput').dispatchEvent('change');
    await page.locator('#btnCloseSettings').click();
    await toggleTimer(page);

    // Past the interval, so the next celebration carries the reminder and
    // resets the counter.
    await simulatePractice(page, 2);
    await page.waitForTimeout(1100);
    expect(await shownMinutes(page)).toBeGreaterThanOrEqual(2);

    const rest = await page.evaluate(() => App.i18n.t('core.rest'));
    const message = await page.evaluate(() => {
      App.feedback.celebrate('¡Muy bien!');
      return document.querySelector('#app-celebration .message').textContent;
    });
    expect(message).toContain(rest);

    // The clock is not a second counter that kept its own total: it starts
    // again from zero with the reminder.
    await page.waitForTimeout(1100);
    expect(await shownMinutes(page)).toBe(0);
  });

  test('el reloj se anuncia con un rol de temporizador, no como texto vivo', async () => {
    const page = await openApp();
    await toggleTimer(page);

    // A number that moves every second must not be read out on every
    // change (WCAG 4.1.3), but it must still carry a name of its own so
    // it is not announced as a bare number.
    expect(await page.evaluate(() =>
      document.querySelector('#sessionTimer').getAttribute('role'))).toBe('timer');
    expect(await page.evaluate(() =>
      document.querySelector('#sessionTimer').getAttribute('aria-live'))).toBe('off');

    const label = await page.evaluate(() =>
      document.querySelector('#sessionTimer').getAttribute('aria-label'));
    expect(label).toBeTruthy();
    expect(label).not.toBe('');
    expect(label).toMatch(/0/);
  });
});

test.describe('Teclatlon — barra de progreso del reto', () => {
  test.beforeEach(({ browser }) => { _browser = browser; });

  test.afterEach(async () => {
    if (_ctx) { await _ctx.close(); _ctx = null; }
  });

  async function startChallenge() {
    const page = await skipToMenu();
    await page.locator('[data-mode="allKeys"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await expect(page.locator('#challengeZone')).toBeVisible();
    return page;
  }

  test('la barra es una hoja: las estrellas están fuera, no dentro', async () => {
    const page = await startChallenge();

    const shape = await page.evaluate(() => {
      const zone = document.querySelector('#challengeZone');
      const track = zone.querySelector('.progress-bar');
      const stars = document.querySelector('#challengeStars');
      const fill = document.querySelector('#challengeFill');
      return {
        /* The defect: #challengeZone WAS the track, so the stars were
           inside a 6px box with overflow: hidden. */
        zoneIsTrack: zone.classList.contains('progress-bar'),
        trackInsideZone: !!track && track !== zone,
        starsInsideTrack: track ? track.contains(stars) : null,
        fillInsideTrack: track ? track.contains(fill) : null,
        trackHeight: track ? track.getBoundingClientRect().height : null
      };
    });

    expect(shape.zoneIsTrack).toBe(false);
    expect(shape.trackInsideZone).toBe(true);
    expect(shape.starsInsideTrack).toBe(false);
    expect(shape.fillInsideTrack).toBe(true);
    // Still the suite's compact track, not something taller "to fit" the
    // stars in.
    expect(shape.trackHeight).toBeLessThanOrEqual(8);
  });

  test('las estrellas se ven y el relleno se pinta sobre la barra', async () => {
    const page = await startChallenge();
    await page.waitForTimeout(300);

    const geo = await page.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height, width: r.width };
      };
      return {
        zone: box('#challengeZone'),
        stars: box('#challengeStars'),
        firstStar: box('#challengeStars .challenge-star'),
        track: box('#challengeZone .progress-bar'),
        fill: box('#challengeFill'),
        starsCount: document.querySelectorAll('#challengeStars .challenge-star').length
      };
    });

    expect(geo.starsCount).toBe(3);
    // Three stars at 24px each: they were being painted, just outside the
    // 6px window that could show them.
    expect(geo.firstStar).not.toBeNull();
    expect(geo.firstStar.height).toBeGreaterThan(15);
    expect(geo.stars.height).toBeGreaterThan(15);
    // Above the track, inside the zone: nothing is cut off.
    expect(geo.stars.bottom).toBeLessThanOrEqual(geo.zone.bottom + 0.5);
    expect(geo.stars.top).toBeGreaterThanOrEqual(geo.zone.top - 0.5);
    // The fill sits on the track. It used to land 44px below the top of a
    // 6px box, which is why the bar never moved.
    expect(geo.fill.top).toBeGreaterThanOrEqual(geo.track.top - 0.5);
    expect(geo.fill.bottom).toBeLessThanOrEqual(geo.track.bottom + 0.5);
  });

  test('el relleno crece al pulsar teclas', async () => {
    const page = await startChallenge();

    const readWidth = () => page.evaluate(() =>
      document.querySelector('#challengeFill').getBoundingClientRect().width);
    const readTotal = () => page.evaluate(() => {
      const t = document.querySelector('#challengeText').textContent || '';
      const m = /(\d+)\D+(\d+)/.exec(t);
      return m ? { done: Number(m[1]), total: Number(m[2]) } : null;
    });

    const before = await readWidth();
    const start = await readTotal();
    expect(start.total).toBeGreaterThan(0);
    expect(start.done).toBe(0);

    // Press what the challenge asks for until the bar has moved.
    for (let i = 0; i < 12; i++) {
      const target = await page.evaluate(() => {
        const el = document.querySelector('#keyboardPanel .key.target');
        return el ? el.dataset.ch : null;
      });
      if (target === null) break;
      await page.evaluate((c) => {
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: c,
          code: c === ' ' ? 'Space' : 'Key' + c.toUpperCase(),
          bubbles: true,
          cancelable: true
        }));
      }, target);
      await page.waitForTimeout(60);
    }

    // .progress-fill has `transition: width 0.4s ease`, so the painted
    // width is still catching up with the number behind it. Measure once
    // it has landed — otherwise this compares a moving value with a still
    // one and fails on the animation, not on the bar.
    await page.waitForTimeout(600);
    const grown = await readWidth();
    expect(grown).toBeGreaterThan(before);
    const after = await readTotal();
    expect(after.done).toBeGreaterThan(0);
    // The painted width agrees with the number behind it. app.js writes a
    // rounded whole percentage, so that is what is compared — on an 830px
    // track a single percent is 8px, which is far more than a subpixel
    // tolerance would forgive.
    const trackWidth = await page.evaluate(() =>
      document.querySelector('#challengeZone .progress-bar').getBoundingClientRect().width);
    const expected = Math.round(after.done / after.total * 100) / 100 * trackWidth;
    expect(Math.abs(grown - expected)).toBeLessThan(1.5);
  });
});