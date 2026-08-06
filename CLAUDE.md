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

## Language policy

- **UI**: multilingual. Default locales are **Spanish (`es`)** and
  **English (`en`)**; `es` is the default and fallback when a key is
  missing or the detected locale is unsupported. UI text lives in
  `strings.<locale>.js` files (root app and `legal/`).
- **Technical code**: **always English** — variables, functions,
  identifiers, comments, and commit messages. Dictionary **keys** are
  code and must be English. UI copy lives in `strings.<locale>.js`,
  never hardcoded in `app.js` or `index.html`. Per-locale practice
  content (lessons, words, number-pad steps) lives in `data.js`
  locale-split arrays.
- **Product changes apply to all locales by default**: any change to
  product content (UI strings, lessons, words, accessibility labels,
  catalog entries, etc.) **must be applied to every supported
  locale** — at minimum `es` and `en`. Spanish (`es`) is the source of
  truth when not dictated otherwise; English (`en`) must keep parity.
  If a new locale is added, the same change applies there too. Never
  ship a product change that exists only in one language.
- **Self-test**: change the `es` file, then mirror in the `en` file
  before opening the PR. `scripts/check.js` enforces key parity but
  not translation quality — proofread both.
- Full reference (App.i18n core, number/time formatting, recipe to add
  a third language): [`doc/en/I18N.md`](doc/en/I18N.md) ·
  [`doc/es/I18N.md`](doc/es/I18N.md).

## Agent workflow

Read the affected source files before editing. Update the canonical doc
for the topic (`doc/en/SPEC.md` for product/accessibility rules,
`doc/en/technical.md` for architecture — plus their `doc/es/` mirrors),
not a copy in this file. Keep changes minimal and on-target.

Before finishing:
1. Run `node scripts/check.js`.
2. If you touched `index.html`, `styles.css`, `sw.js`, `app.js`,
   `data.js`, the `strings.*.js` or `assets/js/*` files, or added
   assets, bump `VERSION` in `sw.js` and add new files to `ARCHIVOS`.
   Anything in `ARCHIVOS` is served **network-first with cache
   fallback** by the SW (the SW always asks the network first and
   only uses the cache when the network is unreachable). The cache
   only becomes the source of truth if you fail to bump `VERSION`,
   in which case a change stays trapped in old clients. Full
   contract: `CLOUDFLARE.md` §"Cache contract".
3. Report only verifications you actually ran; flag remaining manual
   tests (e.g. a real browser check of the physical-keyboard flow).

A deploy (even to a preview channel) is a network operation: ask before
running one. Never push or open/close external resources without
explicit request or authorization.
