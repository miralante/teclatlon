'use strict';

const { defineConfig } = require('playwright/test');

/* The preview port is overridable so two sessions (or two sibling
   projects) can run their suites at the same time. Hardcoding 4173 made
   this suite silently measure the WRONG app: when another session's
   preview server took the port, our ui-server could not bind, Playwright
   happily probed the foreign server, and 24 tests failed with
   ERR_CONNECTION_REFUSED while one "contrast" failure was actually a
   bug in a different project. Run with e.g. PORT=4188 to isolate. */
const PORT = Number(process.env.PORT || 4173);
const BASE_URL = `http://127.0.0.1:${PORT}/`;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 5000 },
  workers: 1,
  fullyParallel: false,
  reporter: 'line',
  use: {
    baseURL: BASE_URL,
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
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 30000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
