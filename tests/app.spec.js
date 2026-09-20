const { test, expect } = require('@playwright/test');

async function openFreshApp(page) {
  await page.goto('/');
  await expect(page.locator('#screenName')).toBeVisible();
}

async function openMenu(page) {
  await openFreshApp(page);
  await page.locator('#btnSkipName').click();
  await expect(page.locator('#screenMenu')).toBeVisible();
}

async function collectBrowserErrors(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  return { pageErrors, consoleErrors };
}

test.describe('Teclatlon UI', () => {
  test('carga el teclado y permite abrir y cerrar Ajustes', async ({ page }) => {
    const errors = await collectBrowserErrors(page);
    await openFreshApp(page);

    await expect(page.locator('#screenName .keyboard .key:visible')).not.toHaveCount(0);
    await expect(page.locator('#btnOpenSettings')).toHaveAttribute('aria-expanded', 'false');

    await page.locator('#btnOpenSettings').click();
    await expect(page.locator('#settingsDrawer')).toBeVisible();
    await expect(page.locator('#settingsDrawer')).toHaveAttribute('role', 'dialog');
    await expect(page.locator('#btnOpenSettings')).toHaveAttribute('aria-expanded', 'true');

    await page.locator('#btnCloseSettings').click();
    await expect(page.locator('#settingsDrawer')).toBeHidden();
    await expect(page.locator('#btnOpenSettings')).toHaveAttribute('aria-expanded', 'false');

    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  test('completa la bienvenida y muestra el menú principal', async ({ page }) => {
    await openFreshApp(page);
    await page.locator('#inputName').fill('Ana');
    await page.locator('#btnSaveName').click();

    await expect(page.locator('#screenMenu')).toBeVisible();
    await expect(page.locator('#greeting')).toContainText('Ana');
    await expect(page.locator('.mode-card')).toHaveCount(7);
  });

  test('cambia la vista y los colores del teclado', async ({ page }) => {
    await openFreshApp(page);
    await page.locator('#btnOpenSettings').click();
    const normal = page.locator('.btn-keyboard[data-keyboard="normal"]');
    const extended = page.locator('.btn-keyboard[data-keyboard="extended"]');

    await normal.click();
    await expect(normal).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#screenName .keyboard .key:visible')).not.toHaveCount(0);

    await extended.click();
    await expect(extended).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#screenName .numpad-inline:visible')).toBeVisible();

    const colors = page.locator('.btn-color').first();
    await colors.click();
    await expect(colors).toHaveAttribute('aria-pressed', 'true');
  });

  test('guarda los ajustes de accesibilidad, metas y logros', async ({ page }) => {
    await openFreshApp(page);
    await page.locator('#btnOpenSettings').click();

    await page.locator('#btnFocusMode').click();
    await expect(page.locator('#btnFocusMode')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.btn-theme[data-theme="dark"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#goalSettings summary').click();
    // Click the option directly (not selectOption) so the app's click handler picks it up
    await page.locator('#goalAccuracySelect option[value="90"]').click();
    await expect(page.locator('#goalAccuracySelect')).toHaveValue('90');
    await page.locator('#goalSpeedSelect option[value="50"]').click();
    await expect(page.locator('#goalSpeedSelect')).toHaveValue('50');
    await page.locator('#btnMetrics').click();
    await expect(page.locator('#btnMetrics')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#btnErrorSound').click();
    await expect(page.locator('#btnErrorSound')).toHaveAttribute('aria-pressed', 'true');

    await expect(page.locator('#achievementsSection')).toHaveAttribute('open', '');
    await page.locator('#btnToggleAchievements').click();
    await expect(page.locator('#achievementsSection')).not.toHaveAttribute('open');
    await page.locator('#btnToggleAchievements').click();
    await expect(page.locator('#achievementsSection')).toHaveAttribute('open', '');
    await expect(page.locator('#achievementsGrid .achievement-badge')).toHaveCount(6);

    await page.locator('#btnCloseSettings').click();
    await expect(page.locator('#settingsDrawer')).toBeHidden();
    await page.locator('#btnOpenSettings').click();
    await expect(page.locator('#btnFocusMode')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#goalSettings summary').click();
    await expect(page.locator('#goalAccuracySelect')).toHaveValue('90');
    await expect(page.locator('#goalSpeedSelect')).toHaveValue('50');
  });

  test('navega a Lecciones y puede iniciar y salir de una lección', async ({ page }) => {
    await openMenu(page);
    await page.locator('[data-mode="lessons"]').click();
    await expect(page.locator('#screenLessons')).toBeVisible();
    await expect(page.locator('#lessonsList .btn-lesson')).not.toHaveCount(0);

    await page.locator('#lessonsList .btn-lesson:not(.locked)').first().click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await expect(page.locator('#gameTitle')).not.toHaveText('');
    await expect(page.locator('#targetZone')).toBeVisible();

    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenLessons')).toBeVisible();
  });

  test('navega a Escritura libre, escribe y borra texto', async ({ page }) => {
    await openMenu(page);
    await page.locator('[data-mode="free"]').click();
    await expect(page.locator('#screenFree')).toBeVisible();

    const freeArea = page.locator('#freeArea');
    await freeArea.fill('Hola Teclatlon');
    await expect(freeArea).toHaveValue('Hola Teclatlon');
    await page.locator('#btnClearFree').click();
    await expect(freeArea).toHaveValue('');
    await page.locator('#btnExitFree').click();
    await expect(page.locator('#screenMenu')).toBeVisible();
  });

  test('navega a Plantillas y puede iniciar y salir de una plantilla', async ({ page }) => {
    await openMenu(page);
    await page.locator('[data-mode="templates"]').click();
    await expect(page.locator('#screenTemplates')).toBeVisible();
    await expect(page.locator('#templatesList .btn-lesson')).not.toHaveCount(0);

    await page.locator('#templatesList .btn-lesson').first().click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenTemplates')).toBeVisible();
  });

  test('inicia el reto de todas las teclas y permite salir', async ({ page }) => {
    await openMenu(page);
    await page.locator('[data-mode="allKeys"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await expect(page.locator('#challengeZone')).toBeVisible();
    await expect(page.locator('#challengeText')).toContainText('0');

    const firstKey = await page.locator('#keyboardPanel .key[data-ch]').first().getAttribute('data-ch');
    await page.keyboard.press(firstKey === ' ' ? 'Space' : firstKey);
    await expect(page.locator('#challengeText')).not.toHaveText(/^0 /);

    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenMenu')).toBeVisible();
  });

  test('navega al modo Números y puede salir', async ({ page }) => {
    await openMenu(page);
    await page.locator('[data-mode="numbers"]').click();
    await expect(page.locator('#screenGame')).toBeVisible();
    await expect(page.locator('#numpadPanel')).toBeVisible();
    await page.locator('#btnExitGame').click();
    await expect(page.locator('#screenMenu')).toBeVisible();
  });

  test('inicia Colocación de dedos y Palabras y permite salir', async ({ page }) => {
    await openMenu(page);
    for (const mode of ['placement', 'words']) {
      await page.locator(`[data-mode="${mode}"]`).click();
      await expect(page.locator('#screenGame')).toBeVisible();
      await expect(page.locator('#targetZone')).toBeVisible();
      await page.locator('#btnExitGame').click();
      await expect(page.locator('#screenMenu')).toBeVisible();
    }
  });
});
