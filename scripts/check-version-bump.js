#!/usr/bin/env node
/*
 * Fails if a file listed in sw.js's cache manifest changed in this diff
 * without VERSION also being bumped in the same diff.
 *
 * Why this exists: the SW's cache-first strategy makes a "forgot to
 * bump VERSION" mistake invisible to any live/post-deploy smoke test —
 * a returning visitor's Cache Storage is per-browser state that no
 * server-side script can observe. It has to be caught before it ships,
 * from the diff, not after. (Sibling project sinonimia hit the
 * closest analogue of this bug — a stale immutable HTTP cache, not a
 * SW — and it was only visible in production, days after the change
 * that caused it. This check exists so this project can't have that
 * kind of gap: it fails the PR/push itself.)
 *
 * Diff base resolution: DIFF_BASE (set by the workflow) for pushes and
 * PRs; falls back to HEAD~1; skips (does not fail) if neither exists,
 * e.g. a single-commit shallow clone.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

function readSw(ref) {
  const src = ref ? git(["show", ref + ":sw.js"]) : fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  const versionMatch = src.match(/VERSION\s*=\s*['"]([^'"]+)['"]/);
  const listMatch = src.match(/var\s+(?:ARCHIVOS|FILES)\s*=\s*\[([\s\S]*?)\];/);
  const files = listMatch
    ? Array.from(listMatch[1].matchAll(/['"]\.\/([^'"]+)['"]/g)).map(function (m) { return m[1]; })
    : [];
  return { version: versionMatch ? versionMatch[1] : null, files: files };
}

function resolveBase() {
  const candidates = [process.env.DIFF_BASE, "HEAD~1"].filter(Boolean);
  for (const ref of candidates) {
    try {
      git(["cat-file", "-e", ref]);
      return ref;
    } catch (e) { /* try next */ }
  }
  return null;
}

const base = resolveBase();
if (!base) {
  console.log("~ skipping VERSION-bump check: no previous commit to diff against");
  process.exit(0);
}

const before = readSw(base);
const after = readSw(null);

if (!after.version || !after.files.length) {
  console.error("✗ could not parse VERSION or the cache manifest from the current sw.js");
  process.exit(1);
}

let changed;
try {
  changed = git(["diff", "--name-only", base, "HEAD"]).split("\n").filter(Boolean);
} catch (e) {
  console.error("✗ could not diff against " + base + ": " + e.message);
  process.exit(1);
}

const cachedChanged = changed.filter(function (f) { return after.files.indexOf(f) !== -1; });

if (cachedChanged.length && before.version === after.version) {
  console.error("✗ these sw.js-cached files changed but VERSION (" + after.version + ") was not bumped:");
  cachedChanged.forEach(function (f) { console.error("    " + f); });
  console.error("  Returning visitors with the PWA installed won't see this change until VERSION is bumped (see CLAUDE.md).");
  process.exit(1);
}

console.log(
  "✓ sw.js VERSION bump check passed (" + cachedChanged.length + " cached file(s) changed" +
  (cachedChanged.length ? ", VERSION correctly bumped: " + before.version + " -> " + after.version : ", VERSION unchanged as expected") + ")"
);
