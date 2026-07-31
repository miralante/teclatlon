# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Teclatlon is a static, dependency-free touch-typing trainer for the physical
computer keyboard. It teaches finger placement, letter-by-letter lessons, a
words game, a number-pad game, an "all keys" challenge and a free-writing
mode, with a decorative on-screen keyboard that mirrors the physical one
(never tappable — the real input is always the physical keyboard). See
[`doc/en/SPEC.md`](doc/en/SPEC.md) (or [`doc/es/SPEC.md`](doc/es/SPEC.md))
for the full product definition — target audience, accessibility rules and
non-negotiable product principles.

Teclatlon was split out of a sibling project, Apptonomia (a broader
occupational-therapy activity suite), where this used to be one activity
among many (including a tappable mobile-keyboard mode). That mobile mode
was deliberately dropped here: **Teclatlon targets the computer keyboard
only.** Do not reintroduce a tappable on-screen keyboard.

## Commands

There is no build step, no package.json, and no test framework — it's plain
HTML/CSS/JS served as static files.

- **Preview**: open `index.html` directly in a browser, or serve the folder
  with any static server (e.g. `npx serve .`). Everything runs client-side.
- **Validate everything** (this repo's only "test" step, and what CI runs
  on every PR via `.github/workflows/validate.yml`):
  ```
  node scripts/check.js
  ```
  It checks JS syntax, es/en key parity between `strings.es.js` and
  `strings.en.js` (root app and `legal/`), that every `sw.js` `ARCHIVOS`
  path exists on disk, and that `manifest.json` icons exist. Read the
  script before changing the file layout — it encodes the invariants
  that layout relies on.

## Architecture

**See [`doc/en/technical.md`](doc/en/technical.md) for the full technical
reference** — file-by-file breakdown, the keyboard-layout data shape,
the finger/hand color system, and the PWA/service-worker contract. It also
documents the project's language policy (English for code/comments,
Spanish/English for product content, `es` default and source of truth).

Quick orientation: this is a single-activity app, not a multi-tool suite
like Apptonomia — there is no landing page, no per-tool routing, and no
`/settings/` hidden route (progress reset lives inline in `index.html`,
the "🗑️ Borrar mi progreso" button). `index.html` is the app itself.
`app.js` is a single IIFE holding the whole client app (screens, the
sequence-game engine, the "all keys" challenge, physical `keydown`
handling). `data.js` holds locale-neutral keyboard layouts and per-locale
practice content (lessons, words, number-pad steps). `strings.es.js` /
`strings.en.js` are UI copy only, loaded unconditionally (both files
always load; `App.i18n` decides which is active). `assets/js/` is the
shared core (`utils`, `i18n`, `tts`, `storage`, `feedback`), trimmed down
from Apptonomia's version to only what this single activity actually
uses — don't re-add the multi-tool features (progress aggregation across
tools, font-size preference, structured data-tree merging) without a
concrete need; they were cut deliberately, not by oversight.

## Product change policy

Any change to product content (UI strings, lessons, words) must be applied
to **both** `es` and `en` — `es` is the default and source of truth. Never
ship a product change in only one language. `scripts/check.js` enforces
key parity but not translation quality — proofread both.

## Agent workflow

Read the affected source files before editing. Update the canonical doc
for the topic (`doc/en/SPEC.md` for product/accessibility rules,
`doc/en/technical.md` for architecture — plus their `doc/es/` mirrors),
not a copy in this file. Keep changes minimal and on-target.

Before finishing:
1. Run `node scripts/check.js`.
2. If you touched `index.html`, `styles.css`, `sw.js`, or added assets,
   bump `VERSION` in `sw.js` and add new files to `ARCHIVOS`.
3. Report only verifications you actually ran; flag remaining manual
   tests (e.g. a real browser check of the physical-keyboard flow).

A deploy (even to a preview channel) is a network operation: ask before
running one. Never push or open/close external resources without
explicit request or authorization.
