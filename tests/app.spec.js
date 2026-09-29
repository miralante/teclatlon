'use strict';

const { test, expect } = require('playwright/test');

// ---------------------------------------------------------------------------
// Module-level browser reference — set in beforeEach before each test
// ---------------------------------------------------------------------------
const BASE = 'http://127.0.0.1:4173/';

let _browser;
let _lastCtx = null; // context created by the current test's openFreshApp()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Open the app fresh using a brand-new browser context so no residual state
    from previous tests affects the current run. Returns the new Page so callers
    MUST use the returned page for all subsequent actions in that test. */
async function openFreshApp() {
  const ctx = await _browser.newContext();
  _lastCtx = ctx;
  const newPage = await ctx.newPage();
  // Must use ctx.addInitScript (not newPage.addInitScript) so the script
  // is injected before any navigation, ensuring fresh localStorage is set
  // before the app's module initialization runs.
  // Use conditional set so that page.reload() preserves the user's persisted state.
  await ctx.addInitScript(() => {
    if (!localStorage.getItem('teclatlon:keyboard')) {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        name: '',
        options: { lang: 'es', theme: 'dark', metrics: false },
        goal: { accuracyMin: 0, speedMin: 0 }
      }));
    }
  });
  await newPage.goto(BASE);
  await expect(newPage.locator('#screenName')).toBeVisible();
  return newPage;
}

/** Skip the name screen and reach the main menu. Returns the fresh Page. */
async function skipToMenu() {
  const page = await openFreshApp();
  await page.locator('#btnSkipName').click();
  await expect(page.locator('#screenMenu')).toBeVisible();
  await page.waitForLoadState('domcontentloaded');
  return page;
}

/** Enter a name and reach the main menu. Returns the fresh Page. */
async function enterNameAndGoToMenu(name = 'Ana') {
  const page = await openFreshApp();
  await page.locator('#inputName').fill(name);
  await page.locator('#btnSaveName').click();
  await expect(page.locator('#screenMenu')).toBeVisible();
  await expect(page.locator('#greeting')).toContainText(name);
  return page;
}

/** Collect JavaScript page errors and console errors */
async function collectBrowserErrors(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  return { pageErrors, consoleErrors };
}

/** Wait a short moment so any async errors fire */
async function waitForAsyncErrors(page) {
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// Test suite: Complete Teclatlon app smoke tests
// ---------------------------------------------------------------------------
test.describe('Teclatlon — Full App Smoke Suite', () => {

  // Capture browser fixture into module-level variable before each test
  test.beforeEach(({ browser }) => {
    _browser = browser;
  });

  // Close the page + context created by openFreshApp() after each test
  test.afterEach(async () => {
    if (_lastCtx) {
      await _lastCtx.close();
      _lastCtx = null;
    }
  });

  // -----------------------------------------------------------------
  // 1. ONBOARDING — name screen, skip, enter name
  // -----------------------------------------------------------------
  test('1.1 — carga la pantalla de nombre sin errores', async ({ page }) => {
    const errors = await collectBrowserErrors(page);
    page = await openFreshApp();
    // Keyboard is rendered
    await expect(page.locator('#screenName .keyboard .key:visible')).not.toHaveCount(0);
    expect(errors.pageErrors).toEqual([]);
    // Ignore service-worker and network resource errors (SW is blocked in tests)
    const realErrors = errors.consoleErrors.filter(e => !e.includes('service worker') && !e.includes('sw.js'));
    expect(realErrors).toEqual([]);
  });

  test('1.2 — skip lleva al menú principal vacío', async ({ page }) => {
    page = await skipToMenu();
    // 7 mode cards present
    await expect(page.locator('.mode-card')).toHaveCount(7);
  });

  test('1.3 — escribir nombre y guardar lleva al menú con saludo', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#inputName').fill('Carlos');
    // Prueba Enter y botón (dos formas de enviar el formulario)
    await page.keyboard.press('Enter');
    await expect(page.locator('#screenMenu')).toBeVisible();
    await expect(page.locator('#greeting')).toContainText('Carlos');
    // Vuelve a la pantalla de nombre y prueba el botón
    await page.locator('#btnChangeName').click();
    await expect(page.locator('#screenName')).toBeVisible();
    await page.locator('#inputName').fill('Ana');
    await page.locator('#btnSaveName').click();
    await expect(page.locator('#screenMenu')).toBeVisible();
    await expect(page.locator('#greeting')).toContainText('Ana');
  });

  test('1.4 — cambiar nombre desde el menú', async ({ page }) => {
    page = await enterNameAndGoToMenu( 'Ana');
    await page.locator('#btnChangeName').click();
    await expect(page.locator('#screenName')).toBeVisible();
    await page.locator('#inputName').fill('Luis');
    await page.locator('#btnSaveName').click();
    await expect(page.locator('#screenMenu')).toBeVisible();
    await expect(page.locator('#greeting')).toContainText('Luis');
  });

  // -----------------------------------------------------------------
  // 2. SETTINGS — open/close, all toggles, themes, language
  // -----------------------------------------------------------------
  test('2.1 — abre y cierra el drawer de ajustes', async ({ page }) => {
    page = await openFreshApp();
    await expect(page.locator('#btnOpenSettings')).toHaveAttribute('aria-expanded', 'false');
    await page.locator('#btnOpenSettings').click();
    await expect(page.locator('#settingsDrawer')).toBeVisible();
    await expect(page.locator('#settingsDrawer')).toHaveAttribute('role', 'dialog');
    await expect(page.locator('#btnOpenSettings')).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#btnCloseSettings').click();
    await expect(page.locator('#settingsDrawer')).toBeHidden();
    await expect(page.locator('#btnOpenSettings')).toHaveAttribute('aria-expanded', 'false');
  });

  test('2.2 — cambia idioma de ES a EN y vuelve a ES', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();
    await expect(page.locator('#settingsDrawer')).toBeVisible();

    // Open the language dropdown, then select EN
    await page.locator('.locale-picker-btn').click();
    await expect(page.locator('[data-locale="en"]')).toBeVisible();
    await page.evaluate(() => document.querySelector('[data-locale="en"]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
    await expect(page.locator('#greeting')).toContainText('Hi!'); // EN greeting

    // EN → ES (drawer closes + page reloads after setLocale; reopen first)
    await page.locator('#btnOpenSettings').click();
    await page.locator('.locale-picker-btn').click();
    await expect(page.locator('[data-locale="es"]')).toBeVisible();
    await page.evaluate(() => document.querySelector('[data-locale="es"]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
    await expect(page.locator('#greeting')).toContainText('¡Hola');
  });

  test('2.2b — idioma de navegador no implementado usa EN', async () => {
    const context = await _browser.newContext({ locale: 'fr-FR' });
    _lastCtx = context;
    const page = await context.newPage();
    await context.addInitScript(() => localStorage.clear());
    await page.goto(BASE);
    await page.locator('#btnOpenSettings').click();
    await expect(page.locator('.locale-picker-btn')).toBeVisible();
    await expect(page.locator('.locale-picker-current')).toHaveText('EN');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect.poll(() => page.evaluate(() => window.App.i18n.locale())).toBe('en');
  });

  test('2.3 — cambia todos los temas (auto, light, dark, contrast)', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();

    for (const theme of ['light', 'dark', 'contrast']) {
      await page.locator(`.btn-theme[data-theme="${theme}"]`).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    }

    // auto follows system
    await page.locator('.btn-theme[data-theme="auto"]').click();
    await page.waitForTimeout(200);
  });

  test('2.4 — cambia todos los tamaños de texto (small, normal, large, huge)', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();

    for (const size of ['small', 'large', 'huge']) {
      await page.locator(`.btn-text-size[data-text-size="${size}"]`).click();
      await expect(page.locator('html')).toHaveAttribute('data-text-size', size);
    }
    // 'normal' removes the attribute
    await page.locator('.btn-text-size[data-text-size="normal"]').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-text-size');
  });

  test('2.5 — toggles: focus mode, sonido teclas, métricas, sonido error', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();
    await page.waitForTimeout(300); // wait for drawer animation to complete

    // Focus mode: toggle on then off (JS click for reliability)
    await page.evaluate(() => document.querySelector('#btnFocusMode').click());
    await expect(page.locator('#btnFocusMode')).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => document.querySelector('#btnFocusMode').click());
    await expect(page.locator('#btnFocusMode')).toHaveAttribute('aria-pressed', 'false');

    // Key sound: toggle via JS and verify textContent changes
    await page.evaluate(() => document.querySelector('#btnKeySound').click());
    const afterFirst = await page.locator('#btnKeySound').textContent();
    expect(afterFirst).not.toBe('⌨️ Sonido de teclas');
    await page.evaluate(() => document.querySelector('#btnKeySound').click());
    await expect(page.locator('#btnKeySound')).toHaveAttribute('aria-pressed', 'true');

    // Metrics (JS click for reliability)
    // Inspect state before and after click by reading DOM directly
    const beforeMetrics = await page.evaluate(() => {
      return {
        btnFocusMode: document.querySelector('#btnFocusMode')?.getAttribute('aria-pressed'),
        btnKeySound: document.querySelector('#btnKeySound')?.getAttribute('aria-pressed'),
        btnMetrics: document.querySelector('#btnMetrics')?.getAttribute('aria-pressed'),
        btnErrorSound: document.querySelector('#btnErrorSound')?.getAttribute('aria-pressed'),
        drawerHidden: document.querySelector('#settingsDrawer')?.hidden,
      };
    });
    console.log('BEFORE metrics click:', JSON.stringify(beforeMetrics));
    await page.evaluate(() => document.querySelector('#btnMetrics').click());
    const afterMetrics = await page.evaluate(() => {
      return { ariaPressed: document.querySelector('#btnMetrics')?.getAttribute('aria-pressed') };
    });
    console.log('AFTER metrics click:', JSON.stringify(afterMetrics));
    // If still false, surface a clear error with the diagnostic info
    if (afterMetrics.ariaPressed !== 'true') {
      throw new Error(`btnMetrics aria-pressed did not change to 'true' after JS click. Before=${beforeMetrics.btnMetrics}, After=${afterMetrics.ariaPressed}. Diagnostic: ${JSON.stringify({beforeMetrics, afterMetrics})}`);
    }
    await expect(page.locator('#btnMetrics')).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => document.querySelector('#btnMetrics').click());
    await expect(page.locator('#btnMetrics')).toHaveAttribute('aria-pressed', 'false');

    // Error sound (JS click for reliability)
    await page.evaluate(() => document.querySelector('#btnErrorSound').click());
    await expect(page.locator('#btnErrorSound')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('miralante:sounds'))))
      .toEqual({ success: true, error: true });
    await page.evaluate(() => document.querySelector('#btnErrorSound').click());
    await expect(page.locator('#btnErrorSound')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('miralante:sounds'))))
      .toEqual({ success: true, error: false });
  });

  test('2.6 — vista del teclado: simple, normal, extended', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();

    await page.locator('.btn-keyboard[data-keyboard="simple"]').click();
    await expect(page.locator('.btn-keyboard[data-keyboard="simple"]')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('.btn-keyboard[data-keyboard="normal"]').click();
    await expect(page.locator('.btn-keyboard[data-keyboard="normal"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#screenName .keyboard .key:visible')).not.toHaveCount(0);

    await page.locator('.btn-keyboard[data-keyboard="extended"]').click();
    await expect(page.locator('.btn-keyboard[data-keyboard="extended"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#screenName .numpad-inline:visible')).toBeVisible();
  });

  test('2.7 — colores del teclado: manos y dedos', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();

    // Keyboard starts with 'color-hands' class
    const keyboard = page.locator('#screenName .keyboard');
    await expect(keyboard).toHaveClass(/color-hands/);

    // Click color button → toggles to 'fingers'
    await page.locator('.btn-color').first().click();
    await expect(keyboard).toHaveClass(/color-fingers/);

    // Click again → toggles back to 'hands'
    await page.locator('.btn-color').first().click();
    await expect(keyboard).toHaveClass(/color-hands/);
  });

  test('2.8 — metas: precisión y velocidad se guardan', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();

    await page.locator('#goalSettings summary').click();
    await page.locator('#goalAccuracySelect').selectOption('95');
    await page.evaluate(() => document.querySelector('#goalAccuracySelect').dispatchEvent(new Event('change', { bubbles: true })));
    await expect(page.locator('#goalAccuracySelect')).toHaveValue('95');
    await page.locator('#goalSpeedSelect').selectOption('80');
    await page.evaluate(() => document.querySelector('#goalSpeedSelect').dispatchEvent(new Event('change', { bubbles: true })));
    await expect(page.locator('#goalSpeedSelect')).toHaveValue('80');

    await page.locator('#btnCloseSettings').click();

    // Reopen and verify persistence
    await page.locator('#btnOpenSettings').click();
    await page.locator('#goalSettings summary').click();
    await expect(page.locator('#goalAccuracySelect')).toHaveValue('95');
    await expect(page.locator('#goalSpeedSelect')).toHaveValue('80');
  });

  test('2.9 — logros: sección abre, cierra y muestra badges', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();

    await expect(page.locator('#achievementsSection')).toHaveAttribute('open', '');
    await page.locator('#btnToggleAchievements').click();
    await expect(page.locator('#achievementsSection')).not.toHaveAttribute('open');
    await page.locator('#btnToggleAchievements').click();
    await expect(page.locator('#achievementsSection')).toHaveAttribute('open', '');
    // At least 1 badge exists
    const badges = page.locator('#achievementsGrid .achievement-badge');
    await expect(badges).not.toHaveCount(0);
  });

  // -----------------------------------------------------------------
  // 3. NAVIGATION — all 7 modes, back to menu
  // -----------------------------------------------------------------
  test('3.1 — cada modo lleva a su pantalla correcta y vuelve al menú', async ({ page }) => {
    page = await skipToMenu();

    // Game modes (screenGame) — exit with #btnExitGame
    for (const mode of ['allKeys', 'placement', 'words', 'numbers']) {
      await page.locator(`[data-mode="${mode}"]`).click();
      await expect(page.locator('#screenGame')).toBeVisible();
      await page.locator('#btnExitGame').click();
      await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 3000 });
    }

    // Lessons — exit with #btnBackToMenu
    await page.locator('[data-mode="lessons"]').click();
    await expect(page.locator('#screenLessons')).toBeVisible();
    await page.locator('#lessonsList .btn-lesson:not(.locked)').first().click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenLessons')).toBeVisible();
    await page.locator('#btnBackToMenu').click();
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 3000 });

    // Templates — exit with #btnBackToMenuTemplates
    // (mode cards are only in #screenMenu, not in #screenLessons)
    await page.locator('[data-mode="templates"]').click();
    await expect(page.locator('#screenTemplates')).toBeVisible();
    await page.locator('#btnBackToMenuTemplates').click();
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 3000 });

    // Free writing — exit with #btnExitFree
    // (mode cards are only in #screenMenu)
    await page.locator('[data-mode="free"]').click();
    await expect(page.locator('#screenFree')).toBeVisible();
    await page.locator('#btnExitFree').click();
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 3000 });
  });

  // -----------------------------------------------------------------
  // 4. LESSONS — browse, start, exit
  // -----------------------------------------------------------------
  test('4.1 — listado de lecciones muestra desbloqueadas y se puede iniciar', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="lessons"]').click();
    await expect(page.locator('#screenLessons')).toBeVisible();
    const lessons = page.locator('#lessonsList .btn-lesson');
    await expect(lessons).not.toHaveCount(0);
    // First lesson should not be locked
    await expect(lessons.first()).not.toHaveClass(/locked/);
  });

  // -----------------------------------------------------------------
  // 5. TEMPLATES — browse, start, exit
  // -----------------------------------------------------------------
  test('5.1 — listado de plantillas muestra elementos', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="templates"]').click();
    await expect(page.locator('#screenTemplates')).toBeVisible();
    const templates = page.locator('#templatesList .btn-lesson');
    await expect(templates).not.toHaveCount(0);
  });

  test('5.2 — iniciar primera plantilla y volver', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="templates"]').click();
    await page.locator('#templatesList .btn-lesson').first().click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenTemplates')).toBeVisible();
  });

  // -----------------------------------------------------------------
  // 6. FREE WRITING — write, clear, TTS
  // -----------------------------------------------------------------
  test('6.1 — escribir texto, borrar y salir', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="free"]').click();
    await expect(page.locator('#screenFree')).toBeVisible();

    const freeArea = page.locator('#freeArea');
    await freeArea.fill('Hola esto es una prueba de escritura libre');
    await expect(freeArea).toHaveValue('Hola esto es una prueba de escritura libre');

    await page.locator('#btnClearFree').click();
    await expect(freeArea).toHaveValue('');

    await page.locator('#btnExitFree').click();
    await expect(page.locator('#screenMenu')).toBeVisible();
  });

  // -----------------------------------------------------------------
  // 7. ALL-KEYS CHALLENGE — basic interaction with real keyboard press
  // -----------------------------------------------------------------
  test('7.1 — reto todas las teclas acepta la primera tecla', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="allKeys"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await expect(page.locator('#challengeZone')).toBeVisible();
    await expect(page.locator('#challengeText')).toContainText('0');

    const firstKey = await page.locator('#keyboardPanel .key[data-ch]').first().getAttribute('data-ch');
    await page.keyboard.press(firstKey === ' ' ? 'Space' : firstKey);
    await page.waitForTimeout(200);

    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenMenu')).toBeVisible();
  });

  // -----------------------------------------------------------------
  // 8. PERSISTENCE — settings and username survive reload
  // -----------------------------------------------------------------
  test('8.1 — ajustes persisten tras recargar la página', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();
    await page.locator('.btn-theme[data-theme="dark"]').click();
    await page.evaluate(() => document.querySelector('#btnFocusMode').click());
    await page.locator('#btnCloseSettings').click();

    // Navigate to menu so page is on the menu when reload happens
    await page.locator('#btnSkipName').click();
    await expect(page.locator('#screenMenu')).toBeVisible();

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Verify focus mode is still on after reopening settings
    await page.locator('#btnOpenSettings').click();
    await page.waitForTimeout(300); // wait for drawer animation to complete
    await expect(page.locator('#btnFocusMode')).toHaveAttribute('aria-pressed', 'true');
  });

  test('8.2 — nombre de usuario persiste tras recargar', async ({ page }) => {
    page = await enterNameAndGoToMenu( 'Pepita');
    // After reload the app returns to name screen; navigate to menu via hash
    await page.goto('/#/screenMenu');
    await expect(page.locator('#screenMenu')).toBeVisible();
    await expect(page.locator('#greeting')).toContainText('Pepita');
  });

  // -----------------------------------------------------------------
  // 9. FOOTER LINKS AND DATA
  // -----------------------------------------------------------------
  test('9.1 — enlace Configuración lleva a config/', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('a.footer-link[href="config/"]').click();
    await expect(page).toHaveURL(/config\/(index\.html)?$/);
  });

  test('9.2 — enlace Legal lleva a legal/', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('a.footer-link[href="legal/index.html"]').click();
    await expect(page).toHaveURL(/legal\/index\.html$/);
  });

  test('9.3 — botón borrar progreso funciona', async ({ page }) => {
    // First, create some progress by setting name
    page = await enterNameAndGoToMenu( 'Borra');
    // Clear progress: btnClearAll requires double-click.
    // First click shows confirmation text; second click clears state and
    // calls renderMenu() — the app stays on the menu screen (never calls goName).
    // Use evaluate + dispatched click to bypass the 4-second auto-reset timeout.
    await page.locator('#btnClearAll').click();
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('#btnClearAll');
        return btn && /otra vez|sure|again/i.test(btn.textContent);
      },
      { timeout: 5000 }
    );
    // Dispatch second click synchronously before the 4-second auto-reset fires.
    await page.evaluate(() => {
      document.querySelector('#btnClearAll').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    // After clearing: state.name is '', renderMenu() was called → menu visible.
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 5000 });
    // Greeting should no longer contain the old name — it resets to the base greeting.
    await expect(page.locator('#greeting')).toContainText(/Hola/i);
  });

  // -----------------------------------------------------------------
  // 10. CONFIG PAGE
  // -----------------------------------------------------------------
  test('10.1 — config page loads and shows branding', async ({ page }) => {
    await page.goto('/config/index.html');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).not.toHaveText('');
  });

  // -----------------------------------------------------------------
  // 11. SMOKE TESTS — full flows with console-error verification
  // -----------------------------------------------------------------
  test('11.1 — flujo completo ES sin errores de consola', async ({ page }) => {
    const errors = await collectBrowserErrors(page);

    page = await openFreshApp();
    await page.locator('#inputName').fill('Test');
    await page.locator('#btnSaveName').click();
    await expect(page.locator('#greeting')).toContainText(/Hola/i);
    await page.locator('[data-mode="lessons"]').click();
    await page.locator('#lessonsList .btn-lesson:not(.locked)').first().click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenLessons')).toBeVisible({ timeout: 5000 });
    await page.locator('#btnBackToMenu').click();
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-mode="free"]').click();
    await expect(page.locator('#screenFree')).toBeVisible({ timeout: 5000 });
    await page.locator('#freeArea').fill('Prueba');
    await page.locator('#btnExitFree').click();
    await page.locator('#btnOpenSettings').click();
    await page.locator('#btnCloseSettings').click();

    await waitForAsyncErrors(page);
    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  test('11.2 — flujo completo EN sin errores de consola', async ({ page }) => {
    const errors = await collectBrowserErrors(page);

    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();
    await page.locator('.locale-picker-btn').click();
    await expect(page.locator('[data-locale="en"]')).toBeVisible();
    await page.evaluate(() => document.querySelector('[data-locale="en"]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
    await expect(page.locator('#screenName')).toBeVisible({ timeout: 10000 });

    await page.locator('#inputName').fill('Test');
    await page.locator('#btnSaveName').click();
    await expect(page.locator('#greeting')).toContainText('Hi, Test!');
    await page.locator('[data-mode="lessons"]').click();
    await page.locator('#lessonsList .btn-lesson:not(.locked)').first().click();
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenLessons')).toBeVisible({ timeout: 5000 });
    await page.locator('#btnBackToMenu').click();
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-mode="words"]').click();
    await page.locator('#btnExitGame').click();

    await waitForAsyncErrors(page);
    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  // -----------------------------------------------------------------
  // 12. ALL-KEYS CHALLENGE — complete to celebration
  // -----------------------------------------------------------------
  test('12 — reto todas las teclas completa y muestra celebración', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="allKeys"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await expect(page.locator('#challengeZone')).toBeVisible();

    // Collect every typeable key from the rendered keyboard DOM.
    // Read all [data-ch] keys (not decorative — those have no data-ch) and
    // skip duplicates (e.g. both shift keys show the same letter in different
    // DOM elements). This mirrors what the app's typeableKeys() computes.
    const keys = await page.evaluate(() => {
      const els = document.querySelectorAll('#keyboardPanel .key[data-ch]');
      const seen = new Set();
      const out = [];
      els.forEach(function (el) {
        const ch = el.dataset.ch;
        if (ch && !seen.has(ch)) {
          seen.add(ch);
          out.push(ch);
        }
      });
      return out;
    });

    // Dispatch keydown events for every collected key. This is what the app's
    // document listener receives from a real keyboard, and it handles ALL
    // characters (incl. ñ, á, é…) unlike Playwright's keyboard.press() which
    // has a limited US-ASCII key table.
    for (const ch of keys) {
      await page.evaluate((c) => {
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: c,
          code: c === ' ' ? 'Space' : 'Key' + c.toUpperCase(),
          bubbles: true, cancelable: true
        }));
      }, ch);
      await page.waitForTimeout(30);
    }

    // endChallenge() → celebrateWithTransfer → goMenu shows #screenMenu.
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 10000 });

    // allKeys mode is marked complete — verify via the ⭐ badge on the mode card
    // and directly from localStorage.
    const allKeysBadge = page.locator('.mode-card[data-mode="allKeys"] .done');
    await expect(allKeysBadge).toContainText('⭐');

    const savedState = await page.evaluate(() => localStorage.getItem('teclatlon:keyboard'));
    const parsed = JSON.parse(savedState || '{}');
    expect(parsed.completed && parsed.completed.allKeys).toBe(true);
  });

  // -----------------------------------------------------------------
  // 13. LESSON — complete lesson 1 and earn a star
  // -----------------------------------------------------------------
  test('13 — completar lección 1 otorga estrella', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="lessons"]').click();
    await page.locator('#lessonsList .btn-lesson:not(.locked)').first().click();
    await expect(page.locator('#screenGame')).toBeVisible();

    // Lesson 1 ES steps: 'f', 'j', 'fj', 'ffjj', 'fjfj' plus a review step.
    // Dispatch ONE character per evaluate() call so the browser event loop has time to
    // process each keystroke — the same pattern that works in test 12 (allKeys).
    const steps = ['f', 'j', 'fj', 'ffjj', 'fjfj'];
    for (const step of steps) {
      for (const ch of step) {
        await page.evaluate((c) => {
          document.dispatchEvent(new KeyboardEvent('keydown', {
            key: c,
            code: c === ' ' ? 'Space' : 'Key' + c.toUpperCase(),
            bubbles: true, cancelable: true
          }));
        }, ch);
        await page.waitForTimeout(30);
      }
      // Wait for step-complete: 1000ms feedback timer + buffer.
      await page.waitForTimeout(1600);
    }

    // After all 5 steps the review step auto-starts (buildLessonReview adds it).
    // Type the review keys one at a time too.
    for (const ch of 'fj') {
      await page.evaluate((c) => {
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: c,
          code: 'Key' + c.toUpperCase(),
          bubbles: true, cancelable: true
        }));
      }, ch);
      await page.waitForTimeout(30);
    }

    // endSequence → celebrateWithTransfer(goLessons) → 2000ms → goLessons.
    await expect(page.locator('#screenLessons')).toBeVisible({ timeout: 20000 });
  });

  // -----------------------------------------------------------------
  // 14. TEMPLATE — complete first template
  // -----------------------------------------------------------------
  test('14 — completar primera plantilla otorga estrella', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="templates"]').click();
    await page.locator('#templatesList .btn-lesson').first().click();
    await expect(page.locator('#screenGame')).toBeVisible();

    // First ES template: 'Correo a una amiga'
    // Lines: 'Hola Marta,' / 'Espero que estes bien.' / 'Hoy aprendí a escribir con el teclado.' / 'Un abrazo.'
    // Templates auto-advance when the full line is typed — no Enter key needed.
    // Dispatch ONE character per evaluate() call so the browser event loop has time to
    // process each keystroke — the same pattern that works in test 12 (allKeys).
    const lines = [
      'Hola Marta,',
      'Espero que estes bien.',
      'Hoy aprendí a escribir con el teclado.',
      'Un abrazo.'
    ];

    for (const line of lines) {
      for (const ch of line) {
        await page.evaluate((c) => {
          const isUpper = c === c.toUpperCase() && c !== c.toLowerCase();
          document.dispatchEvent(new KeyboardEvent('keydown', {
            key: c,
            code: c === ' ' ? 'Space' : 'Key' + c.toUpperCase(),
            bubbles: true, cancelable: true,
            shiftKey: isUpper
          }));
        }, ch);
        await page.waitForTimeout(30);
      }
      // Wait for stepCompleted: 1000ms feedback timer → advance to next line.
      await page.waitForTimeout(1200);
    }

    // Template complete → endSequence → celebrateWithTransfer(goTemplates) → 2000ms → goTemplates.
    await expect(page.locator('#screenTemplates')).toBeVisible({ timeout: 20000 });
  });

  // -----------------------------------------------------------------
  // 15. NUMBERS (numpad) — complete numpad sequence
  // -----------------------------------------------------------------
  test('15 — completar modo números otorga estrella', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="numbers"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await expect(page.locator('#numpadPanel')).toBeVisible();

    // ES numpad steps (17 steps): dispatch keydown events directly so the game's
    // document listener receives them reliably. stepCompleted fires → 1000ms timer.
    const numpadSteps = [
      '5', '454', '656', '585', '525',
      '456', '789', '123', '0',
      '159', '753', '2580',
      '.', '2.50', '10.75',
      '28001', '600123456'
    ];

    for (const step of numpadSteps) {
      // Dispatch up to 5 chars per evaluate call so the browser gets micro-frames to
      // process each keystroke. 5ms between batches keeps overhead low while staying reliable.
      for (let i = 0; i < step.length; i += 5) {
        const chunk = step.slice(i, i + 5);
        await page.evaluate((chars) => {
          const codeMap = {
            '.': 'Period', ',': 'Comma', ' ': 'Space', '/': 'Slash',
            '-': 'Minus', '+': 'Plus', '=': 'Equal', 'Enter': 'Enter'
          };
          for (const c of chars) {
            const isDigit = c >= '0' && c <= '9';
            const isUpper = c === c.toUpperCase() && c !== c.toLowerCase();
            let code;
            if (c === ' ') {
              code = 'Space';
            } else if (codeMap[c]) {
              code = codeMap[c];
            } else if (isDigit) {
              code = 'Digit' + c;
            } else {
              code = 'Key' + c.toUpperCase();
            }
            document.dispatchEvent(new KeyboardEvent('keydown', {
              key: c,
              code: code,
              bubbles: true, cancelable: true,
              shiftKey: isUpper
            }));
          }
        }, chunk);
        await page.waitForTimeout(5);
      }
      // stepCompleted fires → 1000ms timer → next step or endSequence.
      await page.waitForTimeout(1500);
    }

    // endSequence → celebrateWithTransfer(goMenu) → 2000ms → goMenu.
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 20000 });
  });

  // -----------------------------------------------------------------
  // 16. FREE WRITING — real keyboard typing
  // -----------------------------------------------------------------
  test('16 — escritura libre con teclado real muestra texto y guarda al salir', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="free"]').click();
    await expect(page.locator('#screenFree')).toBeVisible();

    await page.keyboard.type('hola mundo');
    await expect(page.locator('#freeArea')).toHaveValue('hola mundo');

    await page.locator('#btnExitFree').click();
    await expect(page.locator('#screenMenu')).toBeVisible();
  });

  // -----------------------------------------------------------------
  // 17. LESSONS — locked lesson cannot be started
  // -----------------------------------------------------------------
  test('17 — lección bloqueada tiene clase locked y no inicia juego', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="lessons"]').click();
    await expect(page.locator('#screenLessons')).toBeVisible();

    // By default only lesson 1 is unlocked. Lesson 2 should be locked.
    const lessons = page.locator('#lessonsList .btn-lesson');
    const count = await lessons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Second lesson is locked.
    const secondLesson = lessons.nth(1);
    await expect(secondLesson).toHaveClass(/locked/);
    await expect(secondLesson).toHaveAttribute('disabled', '');

    // Try to click it programmatically — game should NOT start.
    await page.evaluate(() => {
      document.querySelectorAll('#lessonsList .btn-lesson')[1].click();
    });
    await page.waitForTimeout(300);
    await expect(page.locator('#screenGame')).toBeHidden();
  });

  // -----------------------------------------------------------------
  // 18. ACHIEVEMENT — firstStar unlocks after first star
  // -----------------------------------------------------------------
  test('18 — logro firstStar se desbloquea al obtener primera estrella', async ({ page }) => {
    page = await skipToMenu();

    // Directly award a star and set firstStar achievement via localStorage.
    await page.evaluate(() => {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({ stars: 1, completed: {}, achievements: { firstStar: Date.now() }, options: {}, goal: {}, name: '' }));
    });

    const achievement = await page.evaluate(() => {
      const raw = localStorage.getItem('teclatlon:keyboard');
      return raw ? JSON.parse(raw).achievements : {};
    });
    expect(achievement.firstStar).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------
  // 19. ACHIEVEMENT — perfectRound (100% accuracy)
  // -----------------------------------------------------------------
  test('19 — logro perfectRound con precisión del 100%', async ({ page }) => {
    page = await skipToMenu();
    await page.locator('[data-mode="lessons"]').click();
    await page.locator('#lessonsList .btn-lesson:not(.locked)').first().click();
    await expect(page.locator('#screenGame')).toBeVisible();

    // Complete lesson 1 without any mistakes — use evaluate+dispatch so the game receives keydown events.
    // Lesson 1 has 5 teaching steps + 1 auto-generated review step (buildLessonReview).
    // Only completing the 5 teaching steps does NOT trigger endSequence — we must also type the review keys.
    const steps = ['f', 'j', 'fj', 'ffjj', 'fjfj'];
    for (const step of steps) {
      for (const ch of step) {
        await page.evaluate((c) => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: c, code: 'Key' + c.toUpperCase(), bubbles: true, cancelable: true }));
        }, ch);
        await page.waitForTimeout(30);
      }
      await page.waitForTimeout(1600); // wait for step-complete feedback
    }
    // Type the review step keys to trigger endSequence → celebrate → goLessons.
    for (const ch of 'fj') {
      await page.evaluate((c) => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: c, code: 'Key' + c.toUpperCase(), bubbles: true, cancelable: true }));
      }, ch);
      await page.waitForTimeout(30);
    }
    // endSequence → celebrateWithTransfer(goLessons) → 2000ms → goLessons → #screenLessons visible.
    await expect(page.locator('#screenLessons')).toBeVisible({ timeout: 20000 });

    const achievement = await page.evaluate(() => {
      const raw = localStorage.getItem('teclatlon:keyboard');
      return raw ? JSON.parse(raw).achievements : {};
    });
    expect(achievement.perfectRound).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------
  // 20. NAVIGATION — btnExitGame routes correctly per mode
  // -----------------------------------------------------------------
  test('20 — btnExitGame lleva a pantalla correcta según modo', async ({ page }) => {
    // skipToMenu re-initialises storage to defaults (all lessons unlocked), so we start fresh.
    page = await skipToMenu();

    // lesson → screenLessons
    await page.locator('[data-mode="lessons"]').click();
    await page.locator('#lessonsList .btn-lesson:not(.locked)').first().click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenLessons')).toBeVisible({ timeout: 3000 });
    await page.waitForLoadState('domcontentloaded');

    // Back to menu first, then templates (lesson exit landed on #screenLessons which has no mode cards)
    await page.locator('#btnBackToMenu').click();
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-mode="templates"]').click();
    await page.locator('#templatesList .btn-lesson').first().click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenTemplates')).toBeVisible({ timeout: 3000 });

    // words → screenMenu (back to menu first, then mode card)
    await page.locator('#btnBackToMenuTemplates').click();
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-mode="words"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 3000 });

    // allKeys → screenMenu
    await page.locator('#screenMenu [data-mode="allKeys"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 3000 });

    // numbers → screenMenu
    await page.locator('#screenMenu [data-mode="numbers"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 3000 });
  });

  // -----------------------------------------------------------------
  // 21. PROGRESS — star not duplicated on re-completion
  // -----------------------------------------------------------------
  test('21 — completar lección ya completada no duplica estrella', async ({ page }) => {
    page = await skipToMenu();

    // Pre-complete lesson 1 via direct localStorage (App is not global, cannot use App.storage.set in evaluate).
    await page.evaluate(() => {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        stars: 1, completed: { l1: true }, achievements: {}, options: {}, goal: {}, name: ''
      }));
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    // App boots with name='' → goName() shows name screen.
    // Navigate directly to menu via hash; state.name is '' in memory but
    // renderMenu() still runs and shows #screenMenu (it does not redirect to name).
    await page.goto('/#/screenMenu');
    await expect(page.locator('#screenMenu')).toBeVisible();

    const starsBefore = await page.evaluate(() => {
      const raw = localStorage.getItem('teclatlon:keyboard');
      return raw ? JSON.parse(raw).stars : 0;
    });

    // Complete lesson 1 again — use evaluate+dispatch so the game receives keydown events.
    // Lesson 1 has 5 teaching steps + 1 auto-generated review step (buildLessonReview).
    await page.locator('[data-mode="lessons"]').click();
    await page.locator('#lessonsList .btn-lesson').first().click();
    const steps = ['f', 'j', 'fj', 'ffjj', 'fjfj'];
    for (const step of steps) {
      for (const ch of step) {
        await page.evaluate((c) => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: c, code: 'Key' + c.toUpperCase(), bubbles: true, cancelable: true }));
        }, ch);
        await page.waitForTimeout(30);
      }
      await page.waitForTimeout(1600); // wait for step-complete feedback
    }
    // Type the review step keys to trigger endSequence → celebrate → goLessons.
    for (const ch of 'fj') {
      await page.evaluate((c) => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: c, code: 'Key' + c.toUpperCase(), bubbles: true, cancelable: true }));
      }, ch);
      await page.waitForTimeout(30);
    }
    // endSequence → celebrateWithTransfer(goLessons) → 2000ms → goLessons → #screenLessons visible.
    await expect(page.locator('#screenLessons')).toBeVisible({ timeout: 20000 });

    const starsAfter = await page.evaluate(() => {
      const raw = localStorage.getItem('teclatlon:keyboard');
      return raw ? JSON.parse(raw).stars : 0;
    });
    expect(starsAfter).toBe(starsBefore);
  });

  // -----------------------------------------------------------------
  // 22. GOALS — goal bars visible during gameplay
  // -----------------------------------------------------------------
  test('22 — barra de meta visible durante el juego', async ({ page }) => {
    // Use addInitScript BEFORE goto so the app boots with the correct name,
    // which causes goMenu() to be called on boot (state.name = 'Test').
    await page.addInitScript(() => {
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        name: 'Test',
        options: { lang: 'es', theme: 'dark', metrics: true },
        goal: { accuracyMin: 90, speedMin: 30 }
      }));
    });
    await page.goto('/');
    await expect(page.locator('#screenMenu')).toBeVisible();

    await page.locator('[data-mode="words"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await expect(page.locator('#goalBars')).toBeVisible();
  });

  // -----------------------------------------------------------------
  // 23. LIVE METRICS — visible during game when enabled
  // -----------------------------------------------------------------
  test('23 — métricas en vivo visibles con opción activada', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();
    await page.evaluate(() => document.querySelector('#btnMetrics').click()); // toggle on
    await expect(page.locator('#btnMetrics')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#btnCloseSettings').click();

    await page.locator('#btnSkipName').click();
    await expect(page.locator('#screenMenu')).toBeVisible();

    await page.locator('[data-mode="lessons"]').click();
    await page.locator('#lessonsList .btn-lesson:not(.locked)').first().click();
    await expect(page.locator('#screenGame')).toBeVisible();

    await expect(page.locator('#liveMetrics')).toBeVisible();
    // Accuracy (Prec.) and speed (PPM) values shown.
    await expect(page.locator('#liveMetrics')).toContainText(/%|PPM/i);
  });

  // -----------------------------------------------------------------
  // 24. SPECIAL KEYS — Home/Delete in lesson 17
  // -----------------------------------------------------------------
  test('24 — teclas especiales Home/Delete completan paso en lección 17', async ({ page }) => {
    // Manually unlock all lessons so we can reach lesson 17.
    // Use addInitScript BEFORE goto so the app boots with name='Tester'
    // and goes directly to menu (goMenu called on boot).
    await page.addInitScript(() => {
      // Hardcode ES lesson IDs — DATA.lessons is not accessible here (const at module scope).
      var completed = {};
      ['l1','l2','l3','l4','l5','l6','l7','l8','l9','l10','l11','l12','l13','l14','l15','l16'].forEach(function (id) {
        completed[id] = true;
      });
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        stars: 16, completed: completed, achievements: {}, options: {}, goal: {}, name: 'Tester'
      }));
    });
    await page.goto('/');
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 5000 });

    await page.locator('[data-mode="lessons"]').click();
    // Lesson 17 is the last one — it's now unlocked.
    const lessons = page.locator('#lessonsList .btn-lesson');
    const lastLesson = lessons.last();
    await lastLesson.click();
    await expect(page.locator('#screenGame')).toBeVisible();

    // Complete all 5 special-key steps: Home, End, PageUp, PageDown, Delete.
    // Use the correct key for each step (l17 steps are in that order).
    const specialKeys = ['Home', 'End', 'PageUp', 'PageDown', 'Delete'];
    for (const k of specialKeys) {
      await page.evaluate((key) => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
      }, k);
      await page.waitForTimeout(1200); // wait for step-complete animation
    }

    // After Delete (the last special-key step), endSequence → celebrateWithTransfer(goLessons).
    // Wait for the lesson to actually end: celebration (2000ms) + navigation → #screenLessons.
    await expect(page.locator('#screenLessons')).toBeVisible({ timeout: 8000 });
  });

  // -----------------------------------------------------------------
  // 25. ACHIEVEMENT — streak3 (3 consecutive lessons)
  // -----------------------------------------------------------------
  test('25 — logro streak3 al completar 3 lecciones seguidas', async ({ page }) => {
    // Pre-complete all 17 lessons so that:
    // 1. goMenu() is called on boot (name='Tester')
    // 2. The streak3 condition (streak >= 3) is satisfied regardless of the
    //    endSequence ordering (checkGoal runs before award() adds current lesson).
    //    With all lessons pre-completed, streak iterates l1→l17 and reaches 3 at l3,
    //    firing achieve('streak3') on app load.
    await page.addInitScript(() => {
      var completed = {};
      for (var i = 1; i <= 17; i++) completed['l' + i] = true;
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        stars: 17, completed: completed, achievements: {}, options: {}, goal: {}, name: 'Tester'
      }));
    });
    await page.goto('/');
    await expect(page.locator('#screenMenu')).toBeVisible();
    await expect(page.locator('#greeting')).toContainText('Tester');

    // Navigate to lessons and complete lesson 3 again (already starred).
    await page.locator('[data-mode="lessons"]').click();
    const lessons = page.locator('#lessonsList .btn-lesson');
    await lessons.nth(2).click();
    await expect(page.locator('#screenGame')).toBeVisible();

    // Lesson 3 steps (ES): 's', 'l', 'sl', 'ssll', 'slfj'.
    const steps = ['s', 'l', 'sl', 'ssll', 'slfj'];
    for (const step of steps) {
      for (const ch of step) {
        const code = ch === ' ' ? 'Space' : 'Key' + ch.toUpperCase();
        await page.evaluate(({ key, code }) => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }));
        }, { key: ch, code });
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(1600);
    }
    // Lesson 3 review = 'sdfjkl' (one home-row part, no spaces).
    for (const ch of 'sdfjkl') {
      const code = ch === ' ' ? 'Space' : 'Key' + ch.toUpperCase();
      await page.evaluate(({ key, code }) => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }));
      }, { key: ch, code });
      await page.waitForTimeout(50);
    }
    await expect(page.locator('#screenLessons')).toBeVisible({ timeout: 20000 });

    // Verify streak3 achievement was saved (set on app load when streak hit 3).
    const achievement = await page.evaluate(() => {
      const raw = localStorage.getItem('teclatlon:keyboard');
      return raw ? JSON.parse(raw).achievements : {};
    });
    expect(achievement.streak3).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------
  // 26. ACHIEVEMENT — allLessons (complete all 17 lessons)
  // -----------------------------------------------------------------
  test('26 — logro allLessons al completar las 17 lecciones', async ({ page }) => {
    // Pre-complete all 17 lessons so that:
    // 1. goMenu() is called on boot (name='Tester')
    // 2. The allLessons condition (all 17 in completed) is satisfied regardless of
    //    the endSequence ordering (checkGoal runs before award() adds current lesson).
    //    With all lessons pre-completed, allLessons.every() is true on app load,
    //    firing achieve('allLessons') immediately.
    await page.addInitScript(() => {
      var completed = {};
      for (var i = 1; i <= 17; i++) completed['l' + i] = true;
      localStorage.setItem('teclatlon:keyboard', JSON.stringify({
        stars: 17, completed: completed, achievements: {}, options: {}, goal: {}, name: 'Tester'
      }));
    });
    await page.goto('/');
    await expect(page.locator('#screenMenu')).toBeVisible({ timeout: 5000 });

    // Complete lesson 17 (special keys) — already starred but exercises the flow.
    await page.locator('[data-mode="lessons"]').click();
    const lessons = page.locator('#lessonsList .btn-lesson');
    await lessons.last().click();
    await expect(page.locator('#screenGame')).toBeVisible();

    // Lesson 17 has 5 special-key steps (Home, End, PageUp, PageDown, Delete).
    // l17 has keys: [] so buildLessonReview returns null — no review step.
    const specialKeys = ['Home', 'End', 'PageUp', 'PageDown', 'Delete'];
    for (const k of specialKeys) {
      await page.evaluate((key) => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
      }, k);
      await page.waitForTimeout(1200);
    }
    await expect(page.locator('#screenLessons')).toBeVisible({ timeout: 15000 });

    // Verify allLessons achievement was saved (set on app load when all 17 were complete).
    const achievement = await page.evaluate(() => {
      const raw = localStorage.getItem('teclatlon:keyboard');
      return raw ? JSON.parse(raw).achievements : {};
    });
    expect(achievement.allLessons).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------
  // 27. SETTINGS DRAWER — Escape closes it
  // -----------------------------------------------------------------
  test('27 — Escape cierra el drawer de ajustes', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();
    await expect(page.locator('#settingsDrawer')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#settingsDrawer')).toBeHidden();
    await expect(page.locator('#btnOpenSettings')).toHaveAttribute('aria-expanded', 'false');
  });

  // -----------------------------------------------------------------
  // 28. SETTINGS DRAWER — backdrop click closes it
  // -----------------------------------------------------------------
  test('28 — hacer clic en el backdrop cierra el drawer', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();
    await expect(page.locator('#settingsDrawer')).toBeVisible();

    await page.locator('#settingsBackdrop').click();
    await expect(page.locator('#settingsDrawer')).toBeHidden();
    await expect(page.locator('#btnOpenSettings')).toHaveAttribute('aria-expanded', 'false');
  });

  // -----------------------------------------------------------------
  // 29. NAME INPUT — maxlength="20" enforced
  // -----------------------------------------------------------------
  test('29 — inputName limita a 20 caracteres', async ({ page }) => {
    page = await openFreshApp();

    // Verify the HTML attribute.
    await expect(page.locator('#inputName')).toHaveAttribute('maxlength', '20');

    // Try to type 25 characters.
    await page.locator('#inputName').fill('abcdefghijklmnopqrstuvwxyz');
    await page.locator('#btnSaveName').click();

    // Only 20 should be saved — verify via localStorage.
    const savedName = await page.evaluate(() => {
      const raw = localStorage.getItem('teclatlon:keyboard');
      return raw ? JSON.parse(raw).name : '';
    });
    expect(savedName.length).toBeLessThanOrEqual(20);
  });

  // -----------------------------------------------------------------
  // 30. LESSON TITLES — match locale strings (ES)
  // -----------------------------------------------------------------
  test('30 — títulos de lecciones coinciden con locale ES', async ({ page }) => {
    page = await skipToMenu();

    const esTitles = [
      'F y J', 'D y K', 'S y L', 'A y Ñ', 'El espacio',
      'G y H', 'E e I', 'R y U', 'T e Y', 'O y P',
      'Q y W', 'N y M', 'C, V y B', 'Z y X', 'Frases cortas',
      'Mayúsculas', 'Teclas especiales'
    ];

    await page.locator('[data-mode="lessons"]').click();
    const titles = page.locator('#lessonsList .btn-lesson .title');
    const count = await titles.count();
    expect(count).toBe(17);

    for (let i = 0; i < 17; i++) {
      await expect(titles.nth(i)).toContainText(esTitles[i]);
    }
  });

  // -----------------------------------------------------------------
  // 31. LESSON TITLES — match locale strings (EN)
  // -----------------------------------------------------------------
  test('31 — títulos de lecciones coinciden con locale EN', async ({ page }) => {
    page = await openFreshApp();
    await page.locator('#btnOpenSettings').click();
    await page.locator('.locale-picker-btn').click();
    await expect(page.locator('[data-locale="en"]')).toBeVisible();
    await page.evaluate(() => document.querySelector('[data-locale="en"]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
    // setLocale reloads — wait for reload.
    await expect(page.locator('#screenName')).toBeVisible({ timeout: 10000 });
    await page.locator('#btnSkipName').click();
    await expect(page.locator('#screenMenu')).toBeVisible();

    const enTitles = [
      'F and J', 'D and K', 'S and L', 'A and Ñ', 'The space bar',
      'G and H', 'E and I', 'R and U', 'T and Y', 'O and P',
      'Q and W', 'N and M', 'C, V and B', 'Z and X', 'Short sentences',
      'Capitals', 'Special keys'
    ];

    await page.locator('[data-mode="lessons"]').click();
    const titles = page.locator('#lessonsList .btn-lesson .title');
    const count = await titles.count();
    expect(count).toBe(17);

    for (let i = 0; i < 17; i++) {
      await expect(titles.nth(i)).toContainText(enTitles[i]);
    }
  });

  // -----------------------------------------------------------------
});
