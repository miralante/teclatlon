'use strict';

const { test, expect } = require('playwright/test');
const BASE = `http://127.0.0.1:${process.env.PORT || 4173}/`;

let _browser;
test.beforeEach(({ browser }) => { _browser = browser; });

async function openFreshApp() {
  const ctx = await _browser.newContext();
  const newPage = await ctx.newPage();
  await ctx.addInitScript(() => {
    localStorage.setItem('teclatlon:keyboard', JSON.stringify({
      name: '',
      options: { lang: 'es', theme: 'dark', metrics: true },
      goal: { accuracyMin: 0, speedMin: 0 }
    }));
  });
  await newPage.goto(BASE);
  await expect(newPage.locator('#screenName')).toBeVisible();
  return newPage;
}

test('debug metrics state after opening settings', async ({ page }) => {
  page = await openFreshApp();

  // Check button BEFORE opening settings
  const beforeOpen = await page.evaluate(() => ({
    btnMetricsAria: document.querySelector('#btnMetrics') ? document.querySelector('#btnMetrics').getAttribute('aria-pressed') : null,
    btnMetricsText: document.querySelector('#btnMetrics') ? document.querySelector('#btnMetrics').textContent : null,
  }));
  console.log('BEFORE OPENING SETTINGS:', JSON.stringify(beforeOpen, null, 2));

  // Open settings like test 2.5 does
  await page.locator('#btnOpenSettings').click();
  await page.waitForTimeout(500);

  // Check button right after opening settings, before any click
  const afterOpen = await page.evaluate(() => ({
    btnMetricsAria: document.querySelector('#btnMetrics') ? document.querySelector('#btnMetrics').getAttribute('aria-pressed') : null,
    btnMetricsText: document.querySelector('#btnMetrics') ? document.querySelector('#btnMetrics').textContent : null,
    settingsDrawerVisible: !document.querySelector('#settingsDrawer').hidden,
  }));
  console.log('AFTER OPENING SETTINGS:', JSON.stringify(afterOpen, null, 2));

  // Now click btnMetrics
  await page.locator('#btnMetrics').click();
  await page.waitForTimeout(200);

  // Check after click
  const afterClick = await page.evaluate(() => ({
    btnMetricsAria: document.querySelector('#btnMetrics') ? document.querySelector('#btnMetrics').getAttribute('aria-pressed') : null,
    btnMetricsText: document.querySelector('#btnMetrics') ? document.querySelector('#btnMetrics').textContent : null,
  }));
  console.log('AFTER CLICK:', JSON.stringify(afterClick, null, 2));
});
