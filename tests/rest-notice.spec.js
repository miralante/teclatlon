'use strict';

const { test, expect } = require('playwright/test');

// ---------------------------------------------------------------------------
// Rest reminder ("aviso de descanso")
//
// The reminder is time-based: after N minutes of *practice* (default 20,
// configurable in the settings panel) the "you can rest" phrase joins the
// next celebration, the counter resets, and the phrase comes back N minutes
// later. The counter lives in memory only, so a new session starts at zero.
//
// Waiting 20 real minutes is not an option, so these tests move the page
// clock instead. Two helpers model the two kinds of time the counter
// distinguishes: simulatePractice() = the person keeps typing, simulateIdle()
// = the page is open but nobody touches it.
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

/** Add a controllable offset to the page clock (lost on reload). */
async function installClock(page) {
  await page.evaluate(() => {
    const realNow = Date.now;
    window.__offset = 0;
    Date.now = () => realNow() + window.__offset;
  });
}

/** Advance the clock while the person keeps typing. Done in 30 s steps so
    no single step exceeds the 1 min idle window the counter allows: that is
    what a real typing session looks like to it. The keydown is dispatched
    non-bubbling on document, so it reaches the counter's capture listener
    without reaching the game's own key handler. */
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

/** Fire a celebration and read back the message shown in the overlay. */
async function celebrate(page) {
  return page.evaluate(() => {
    App.feedback.celebrate('¡Muy bien!');
    return document.querySelector('#app-celebration .message').textContent;
  });
}

/** The reminder phrase in the active language (the tests are not tied to es/en). */
function restText(page) {
  return page.evaluate(() => App.i18n.t('core.rest'));
}

function savedOptions(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('teclatlon:keyboard')).options);
}

test.describe('Teclatlon — Aviso de descanso', () => {
  test.beforeEach(({ browser }) => { _browser = browser; });

  test.afterEach(async () => {
    if (_ctx) { await _ctx.close(); _ctx = null; }
  });

  test('el aviso aparece al cumplirse el tiempo configurado (20 min por defecto)', async () => {
    const page = await openApp();
    await installClock(page);

    // Default interval is 20 minutes, shown in the settings panel.
    await page.locator('#btnOpenSettings').click();
    await expect(page.locator('#restMinutesInput')).toHaveValue('20');
    await page.locator('#btnCloseSettings').click();
    expect((await savedOptions(page)).restMinutes).toBe(20);

    const rest = await restText(page);

    // Not yet.
    await simulatePractice(page, 19);
    expect(await celebrate(page)).not.toContain(rest);

    // Now.
    await simulatePractice(page, 2);
    expect(await celebrate(page)).toContain(rest);
  });

  test('el contador se reinicia al mostrar el aviso y vuelve cada N minutos', async () => {
    const page = await openApp();
    await installClock(page);
    const rest = await restText(page);

    await simulatePractice(page, 21);
    expect(await celebrate(page)).toContain(rest);

    // Counter is back to zero: the very next celebration has no reminder.
    expect(await celebrate(page)).not.toContain(rest);

    // ...and it comes back after the same amount of practice.
    await simulatePractice(page, 21);
    expect(await celebrate(page)).toContain(rest);
  });

  test('el contador no se guarda: cada sesión empieza en cero', async () => {
    const page = await openApp();
    await installClock(page);
    const rest = await restText(page);

    await simulatePractice(page, 21);
    expect(await celebrate(page)).toContain(rest);

    // Only the chosen interval reaches localStorage, never the counter.
    const restKeys = Object.keys(await savedOptions(page)).filter((k) => /rest/i.test(k));
    expect(restKeys).toEqual(['restMinutes']);

    await page.reload();
    await expect(page.locator('#screenName')).toBeVisible();
    await installClock(page);

    // A brand-new session: 19 minutes of practice is not 21 any more.
    await simulatePractice(page, 19);
    expect(await celebrate(page)).not.toContain(rest);
  });

  test('el intervalo se cambia en ajustes y el tiempo sin escribir no cuenta', async () => {
    const page = await openApp();

    await page.locator('#btnOpenSettings').click();
    // 45 is not one of the values the old menu offered: the setting is a
    // number box, so any whole number of minutes goes.
    await page.locator('#restMinutesInput').fill('45');
    await page.locator('#restMinutesInput').press('Tab');
    await page.locator('#btnCloseSettings').click();
    expect((await savedOptions(page)).restMinutes).toBe(45);

    // The choice survives a reload.
    await page.reload();
    await expect(page.locator('#screenName')).toBeVisible();
    await page.locator('#btnOpenSettings').click();
    await expect(page.locator('#restMinutesInput')).toHaveValue('45');
    await page.locator('#btnCloseSettings').click();

    await installClock(page);
    const rest = await restText(page);

    // 30 minutes are no longer enough with a 45-minute interval.
    await simulatePractice(page, 30);
    expect(await celebrate(page)).not.toContain(rest);

    await simulatePractice(page, 16);
    expect(await celebrate(page)).toContain(rest);

    // An open but untouched page is not practice: two idle hours, no reminder.
    await page.reload();
    await expect(page.locator('#screenName')).toBeVisible();
    await installClock(page);
    await simulateIdle(page, 120);
    expect(await celebrate(page)).not.toContain(rest);
  });

  test('la caja de minutos acepta cualquier número y sus flechas lo suben y bajan', async () => {
    const page = await openApp();
    await page.locator('#btnOpenSettings').click();
    const box = page.locator('#restMinutesInput');

    // A number box with a stepper, not a menu with a fixed list.
    await expect(box).toHaveAttribute('type', 'number');
    await expect(page.locator('#restMinutesSelect')).toHaveCount(0);

    // The allowed range is the module's, and the box mirrors it.
    const range = await page.evaluate(() => ({
      min: App.feedback.REST_MIN,
      max: App.feedback.REST_MAX,
      def: App.feedback.DEFAULT_REST_MINUTES
    }));
    expect(await box.getAttribute('min')).toBe(String(range.min));
    expect(await box.getAttribute('max')).toBe(String(range.max));

    // Any whole number goes through, not only the ones a menu would offer.
    await box.fill('37');
    await box.press('Tab');
    expect((await savedOptions(page)).restMinutes).toBe(37);
    await expect(box).toHaveValue('37');

    // The steppers move it a minute at a time and save each time.
    await box.press('ArrowUp');
    await box.press('ArrowUp');
    expect((await savedOptions(page)).restMinutes).toBe(39);
    await box.press('ArrowDown');
    expect((await savedOptions(page)).restMinutes).toBe(38);

    // The ▲/▼ pair is visible without focusing the box (the browser's own
    // stepper only paints while it has the focus) and saves too.
    await page.locator('#restMinutesUp').click();
    expect((await savedOptions(page)).restMinutes).toBe(39);
    await page.locator('#restMinutesDown').click();
    expect((await savedOptions(page)).restMinutes).toBe(38);

    // Out of range: pulled back to the nearest end, not thrown away.
    await box.fill('9999');
    await box.press('Tab');
    await expect(box).toHaveValue(String(range.max));
    expect((await savedOptions(page)).restMinutes).toBe(range.max);

    await box.fill('0');
    await box.press('Tab');
    await expect(box).toHaveValue(String(range.min));
    expect((await savedOptions(page)).restMinutes).toBe(range.min);

    // At the ends of the range the matching arrow is parked.
    await expect(page.locator('#restMinutesDown')).toBeDisabled();
    await expect(page.locator('#restMinutesUp')).toBeEnabled();

    // An emptied field goes back to the default, never left blank.
    await box.fill('');
    await box.press('Tab');
    await expect(box).toHaveValue(String(range.def));
    expect((await savedOptions(page)).restMinutes).toBe(range.def);
  });
});
