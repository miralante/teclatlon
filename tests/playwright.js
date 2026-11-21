/*
 * tests/playwright.js — loads the Playwright test API without a project
 * dependency (CLAUDE.md, "Shared Playwright installation").
 *
 * The tests must use the SAME copy of Playwright as the runner that loads them,
 * or Playwright refuses to run. So the copy is taken from the runner itself: the
 * runner has already loaded its own modules, and their path names its package
 * (the machine-wide `playwright` locally, a local `@playwright/test` in CI).
 * Plain `require` is only the fallback.
 *
 * Canonical source: apptonomia/scripts/suite/tests-playwright.js. Copied byte
 * for byte to <app>/tests/playwright.js by
 * apptonomia/scripts/sync-suite-test-kit.js. Never edit a copy by hand.
 */
'use strict';

const path = require('node:path');

function runnerPackage() {
  for (const file of Object.keys(require.cache)) {
    const m = file.match(/^(.*[\\/]node_modules[\\/](?:playwright|@playwright[\\/]test))[\\/]/);
    if (m) return m[1];
  }
  return null;
}

function load() {
  const root = runnerPackage();
  if (root) return require(path.join(root, root.endsWith('test') ? 'index.js' : 'test.js'));
  for (const name of ['@playwright/test', 'playwright/test']) {
    try { return require(name); } catch (e) { /* try the next one */ }
  }
  throw new Error('Playwright not found: run the tests with the machine-wide `playwright test`.');
}

module.exports = load();
