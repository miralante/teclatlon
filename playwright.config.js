'use strict';

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 5000 },
  workers: 1,
  fullyParallel: false,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    locale: 'es-ES',
    serviceWorkers: 'block',
    viewport: { width: 1280, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: {
      slowMo: 200, // 200ms delay between each Playwright action
    },
  },
  webServer: {
    command: 'node scripts/ui-server.js',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: false,
    timeout: 30000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
