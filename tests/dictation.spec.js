'use strict';

const { test, expect } = require('playwright/test');

// ---------------------------------------------------------------------------
// Dictation: a letter is asked for by ear.
//
// This is the only mode that asks for a key through sound, so everything
// here is about the case where the sound does not arrive: the screen has
// to say what the activity is, the letter has to be askable again, and —
// whatever the audio does — the keyboard must never be left locked with
// nothing on screen to explain why.
// ---------------------------------------------------------------------------

const BASE = `http://127.0.0.1:${process.env.PORT || 4173}/`;

let _browser;
test.beforeAll(async ({ browser }) => { _browser = browser; });
/* Deliberately no afterAll closing the browser: it is a worker-scoped
   fixture shared with every other spec file, and closing it here leaves
   the next file with "Target page, context or browser has been closed". */

/** Opens the app in Spanish and skips the name screen. */
async function openApp(options = {}) {
  const ctx = await _browser.newContext();
  await ctx.addInitScript(({ withVoices }) => {
    if (!localStorage.getItem('teclatlon:locale')) localStorage.setItem('teclatlon:locale', 'es');
    window.__tts = { calls: [], ends: 0 };
    /* Headless Chromium ships no voices, so the voice list is faked
       here: withVoices=true is a machine that can read a letter aloud,
       withVoices=false is a machine that cannot. */
    const voices = withVoices
      ? [{ name: 'Voz de prueba', lang: 'es-ES', default: true, localService: true, voiceURI: 'test' }]
      : [];
    window.speechSynthesis.getVoices = () => voices;
    window.speechSynthesis.cancel = () => { };
    window.speechSynthesis.speak = (u) => {
      window.__tts.calls.push(u.text);
      /* A mute engine: it accepts the utterance and then never even
         starts. This is the case the page cannot detect by looking at
         the voice list, and the one a real machine hits. */
      if (window.__tts.silent) return;
      setTimeout(() => { if (u.onstart) u.onstart(); }, 5);
      setTimeout(() => { if (u.onend) { window.__tts.ends++; u.onend(); } }, 25);
    };
  }, { withVoices: options.withVoices !== false });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.locator('#btnSkipName').click();
  await expect(page.locator('#screenMenu')).toBeVisible();
  return { page, ctx };
}

/** Opens the dictation screen and starts the activity, which is a
    separate, deliberate act: nothing is asked for until the person
    presses "Start". */
async function startDictation(page) {
  await page.locator('[data-mode="dictation"]').click();
  await expect(page.locator('#screenGame')).toBeVisible();
  await expect(page.locator('#dictationPanel')).toBeVisible();
  await page.locator('#btnDictationStart').click();
  await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(0);
}

/** What the app has asked for so far, oldest first. */
function spoken(page) {
  return page.evaluate(() => window.__tts.calls.slice());
}

/** The key of the last letter asked for, read from the prompt the app
    actually spoke ("Letra zeta." / "Letter a."), so the test never has
    to guess which letter the random pick landed on. */
function askedKey(page) {
  return page.evaluate(() => {
    const last = window.__tts.calls[window.__tts.calls.length - 1];
    if (!last) return null;
    const name = last.replace(/^.*?\s/, '').replace(/\.$/, '');
    for (const ch of 'abcdefghijklmnopqrstuvwxyzñ') {
      if (App.i18n.t('dictationLetterNames.' + ch) === name) return ch;
    }
    return null;
  });
}

/** Presses a letter the way the physical keyboard does.
    NOT page.keyboard.type(): for ñ that produces no keydown at all
    (Playwright inserts the character as text), and keyboard.press('ñ')
    throws "Unknown key" — which made every test here that typed the
    shown letter fail roughly one run in 27, whenever the random pick
    landed on ñ. A dispatched KeyboardEvent is exactly what the browser
    delivers when the ñ key is pressed, and it works for every letter. */
async function pressLetter(page, letter) {
  await page.evaluate((k) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  }, letter);
}

async function pressRightKey(page) {
  const key = await askedKey(page);
  expect(key).toBeTruthy();
  await pressLetter(page, key);
  return key;
}

test('the screen explains the activity and waits for the person to start it', async () => {
  const { page, ctx } = await openApp();
  await page.locator('[data-mode="dictation"]').click();
  await expect(page.locator('#screenGame')).toBeVisible();
  await expect(page.locator('#dictationPanel')).toBeVisible();

  await expect(page.locator('#gameTitle')).toHaveText('Dictado');
  /* The card that holds the target is not used by this mode, and must
     not be left behind as an empty box. */
  await expect(page.locator('#gameCard')).toBeHidden();

  const steps = page.locator('.dictation-steps li');
  await expect(steps).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(steps.nth(i)).not.toBeEmpty();

  /* The step numbers are real text. They were a CSS counter once, which
     printed a literal 0 beside every step, and which no test could read
     either: getComputedStyle answers "counter(...)", not the number. */
  await expect(page.locator('.dictation-step-n')).toHaveText(['1', '2', '3', '4']);
  /* And the sentences still switch with the language. */
  await expect(page.locator('.dictation-step-t').first()).toHaveText('Oyes una letra.');

  /* Nothing is asked for, and no key counts, until it is started. */
  expect((await spoken(page)).length).toBe(0);
  await pressLetter(page, 'a');
  await pressLetter(page, 'e');
  await expect(page.locator('#feedback')).toHaveText('');
  await expect(page.locator('#btnDictationAgain')).toBeDisabled();

  await page.locator('#btnDictationStart').click();
  await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(0);
  await expect(page.locator('#btnDictationStart')).toBeHidden();
  await expect(page.locator('#btnDictationAgain')).toBeEnabled();

  /* A machine that can speak does not show the letter: asking for it by
     ear is the whole point of the mode. */
  await expect(page.locator('#dictationFallback')).toBeHidden();

  /* Asking again re-reads the SAME letter, it does not move on. */
  const first = await askedKey(page);
  await page.locator('#btnDictationAgain').click();
  await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(1);
  expect(await askedKey(page)).toBe(first);

  await ctx.close();
});

test('the right key moves on to another letter, a wrong key asks again', async () => {
  const { page, ctx } = await openApp();
  await startDictation(page);

  await pressRightKey(page);
  await expect(page.locator('#feedback')).toHaveClass(/success/);

  const second = await page.waitForFunction(() => window.__tts.calls.length > 1)
    .then(() => askedKey(page));
  expect(second).toBeTruthy();

  // A letter that is not the one asked for is never the right answer.
  const wrong = (second === 'q' ? 'w' : 'q');
  const beforeWrong = (await spoken(page)).length;
  await pressLetter(page, wrong);
  await expect(page.locator('#feedback')).toHaveClass(/encourage/);

  /* The same letter comes back, so a mistake is recoverable. Waited for
     on purpose: the repeat is queued 300 ms after the key, and reading
     the list before it lands compares the wrong two entries. */
  await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(beforeWrong);
  const all = await spoken(page);
  expect(all.at(-1)).toBe(all.at(-2));

  await ctx.close();
});

test('a machine with no voice shows the letter, and the activity still runs', async () => {
  const { page, ctx } = await openApp({ withVoices: false });
  await startDictation(page);

  /* No voice installed: the request moves from the speakers to the
     screen instead of silently doing nothing. */
  await expect(page.locator('#dictationFallback')).toBeVisible();
  await expect(page.locator('.dictation-fallback-note')).not.toBeEmpty();
  const letter = (await page.locator('#dictationLetter').textContent()).trim();
  expect(letter).toMatch(/^[a-zñ]$/);

  /* And the exercise is a real exercise: that letter can be typed. */
  await pressLetter(page, letter);
  await expect(page.locator('#feedback')).toHaveClass(/success/);
  await expect.poll(async () => (await page.locator('#dictationLetter').textContent()).trim()).not.toBe(letter);

  await ctx.close();
});

test('a letter that is never read out loud does not lock the keyboard', async () => {
  const { page, ctx } = await openApp();
  /* The worst case: the machine claims it can speak, and the utterance
     never comes back at all — no `end`, no error, nothing. The activity
     must still accept the key instead of waiting on a sound forever. */
  await page.evaluate(() => {
    App.tts.speak = function (text) { window.__tts.calls.push(text); return true; };
    App.tts.hasVoice = function () { return true; };
  });
  await startDictation(page);

  const key = await askedKey(page);
  expect(key).toBeTruthy();
  /* Nothing has been released yet, so this press is (correctly) ignored:
     the key the app is waiting for has not been asked aloud. */
  await pressLetter(page, key);
  await page.waitForTimeout(1500);
  await expect(page.locator('#feedback')).toHaveText('');

  /* Past the release, the very same key is accepted. */
  await page.waitForTimeout(5500);
  await pressLetter(page, key);
  await expect(page.locator('#feedback')).toHaveClass(/success/, { timeout: 8000 });

  await ctx.close();
});

test('a machine that lists voices but never speaks still shows the letter', async () => {
  const { page, ctx } = await openApp();
  /* The real-world case: a voice is installed, so the voice list is
     not empty, but nothing ever comes out of the speakers. The only
     signal is `onstart`, and when it never arrives the letter has to
     come to the screen. */
  await page.evaluate(() => { window.__tts.silent = true; });
  await startDictation(page);

  await expect(page.locator('#dictationFallback')).toBeVisible({ timeout: 6000 });
  const letter = (await page.locator('#dictationLetter').textContent()).trim();
  expect(letter).toMatch(/^[a-zñ]$/);

  /* And the activity is still a real exercise. A mute engine also never
     releases the between-letters lock, so the 6 s net is what frees the
     keyboard here — which is exactly the path that has to work. */
  await page.waitForTimeout(4000);
  await pressLetter(page, letter);
  await expect(page.locator('#feedback')).toHaveClass(/success/, { timeout: 8000 });

  await ctx.close();
});

test('leaving dictation takes its panel with it', async () => {
  const { page, ctx } = await openApp();
  await startDictation(page);
  await page.locator('#btnExitGame').click();
  await expect(page.locator('#screenMenu')).toBeVisible();
  await expect(page.locator('#dictationPanel')).toBeHidden();

  /* The card the other modes need must come back with them. */
  await page.locator('[data-mode="allKeys"]').click();
  await expect(page.locator('#gameCard')).toBeVisible();
  await expect(page.locator('#dictationPanel')).toBeHidden();

  await ctx.close();
});
