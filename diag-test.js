const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push('PAGE ERROR: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') errors.push('CONSOLE ERROR: ' + m.text());
  });

  await page.goto('http://127.0.0.1:4173');
  await page.locator('#btnSkipName').click();
  await page.locator('#screenMenu').waitFor({ state: 'visible' });

  await page.locator('[data-mode="lessons"]').click();
  await page.locator('#lessonsList .btn-lesson:not(.locked)').first().click();
  await page.locator('#screenGame').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);

  // Check initial DOM state
  const getState = async () => {
    return await page.evaluate(() => {
      const target = document.getElementById('targetZone');
      const feedback = document.getElementById('feedback');
      const instr = document.getElementById('gameInstruction');
      return {
        targetText: target ? target.textContent : null,
        feedbackText: feedback ? feedback.textContent : null,
        instrText: instr ? instr.textContent : null,
        screenGameHidden: document.getElementById('screenGame').classList.contains('hidden'),
        screenLessonsHidden: document.getElementById('screenLessons').classList.contains('hidden'),
        screenMenuHidden: document.getElementById('screenMenu').classList.contains('hidden'),
        screenFreeHidden: document.getElementById('screenFree').classList.contains('hidden'),
      };
    });
  };

  console.log('=== STEP 0 (initial) ===');
  console.log(JSON.stringify(await getState(), null, 2));

  // Type 'f' for step 1 (seq = 'f')
  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(100);
  console.log('=== AFTER f (100ms) ===');
  console.log(JSON.stringify(await getState(), null, 2));

  // Wait for step complete (1s feedback + buffer)
  await page.waitForTimeout(1300);
  console.log('=== AFTER WAIT 1400ms ===');
  console.log(JSON.stringify(await getState(), null, 2));

  // Type 'j' for step 2 (seq = 'j')
  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ', bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(100);
  console.log('=== AFTER j (100ms) ===');
  console.log(JSON.stringify(await getState(), null, 2));

  await page.waitForTimeout(1300);
  console.log('=== AFTER WAIT 1400ms ===');
  console.log(JSON.stringify(await getState(), null, 2));

  if (errors.length > 0) {
    console.log('ERRORS:\n' + errors.join('\n'));
  } else {
    console.log('NO ERRORS');
  }

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
