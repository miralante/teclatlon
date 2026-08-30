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

## Service worker cache (read this before touching any cached file)

`sw.js` is **network-first, cache-fallback**: every request goes to the
network first; on offline (or any other failure), the SW serves the file
from the cache.

**Rule**: when you edit any file listed in `sw.js` `FILES` (or any new
file that should be cached), bump `VERSION` in `sw.js` (e.g.
`teclatlon-v29` → `teclatlon-v30`). The reason is offline-only: the
`activate` handler purges caches with a name different from `VERSION`,
but the cache that was installed under the old version sticks around
forever. Bump liberally — the cost of one integer vs. the cost of an
offline user being stuck on an old lesson layout. The `CLOUDFLARE.md`
§"Cache contract" page documents the same rule; this section is the
machine-readable summary.

> For comparison: in the cache-first SWs of Calculia and Apptonomia
> the bump matters in both **online** and offline (their `fetch`
> returns the cached response before trying the network). In
> Teclatlon's network-first SW the bump only affects offline — but
> we keep the same rule in all three projects to keep the directive
> homogeneous and avoid case-by-case reasoning in CI.

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
  `strings.en.js` (root app and `legal/`), that every `sw.js` `FILES`
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

## graphify

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when `query`/`path`/`explain` do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Agent workflow

Read the affected source files before editing. Update the canonical doc
for the topic (`doc/en/SPEC.md` for product/accessibility rules,
`doc/en/technical.md` for architecture — plus their `doc/es/` mirrors),
not a copy in this file. Keep changes minimal and on-target.

Before finishing:
1. Run `node scripts/check.js`.
2. If you touched `index.html`, `styles.css`, `sw.js`, `app.js`,
   `data.js`, the `strings.*.js` or `assets/js/*` files, or added
   assets, bump `VERSION` in `sw.js` and add new files to `FILES`.
   Anything in `FILES` is served **network-first with cache
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

## UNE 153101 reference (suite-wide)

All seven sibling projects follow **UNE 153101:2018 EX** (Spanish
easy-read standard) and Inclusion Europe's European easy-read
guidelines as the normative basis for the cognitive accessibility
principles that guide content and UI: short sentences, one idea per
sentence, everyday vocabulary, no clinical or technical jargon in
what the end user reads. This is the standard each `SPEC.md` cites
when it states the "easy read always" rule (see `doc/en/SPEC.md` §3.3
or its mirror in `doc/es/SPEC.md` §3.3). Adding a new language or a
new piece of UI copy means following UNE 153101 — not paraphrasing
it.

## WCAG AAA baseline (suite-wide)

This project conforms to WCAG 2.1 at **AA minimum** and adopts the
**AAA criteria that apply to the suite's audience** whenever feasible.
Full conformance at AAA is not feasible for a whole web application
(the W3C itself states AAA is meant for specific contexts); the rule
below lists the AAA criteria that ARE applicable and that this project
honours.

Adopted AAA criteria:

- **1.4.6 Contrast (Enhanced)** — text contrast ≥ 7:1 (large text
  ≥ 4.5:1). WCAG AA (4.5:1) is the legal floor; AAA is the design
  target. Verified pairs in Okeymoney (`#F2F4F8` on `#161A21` = 14.6:1,
  `#B7BDC9` on `#161A21` = 8.4:1) already meet AAA; this project aims
  at the same ratio when its token palette is next touched.
- **3.1.5 Reading Level** — content for the general public does not
  require advanced reading ability. Already complied with through
  UNE 153101 (see the section above) and Inclusion Europe's easy-read
  guidelines.
- **1.4.1 Use of Color** — color is never the only means of conveying
  information. Every feedback state (success / hint / error / lock)
  also uses shape, icon, text or sound, so users with color-vision
  deficiencies are not excluded. (`App.feedback.success()` /
  `App.feedback.encourage()` / `App.feedback.lockUntilAck()` already
  encode this.)

The product-facing wording in `doc/en/SPEC.md` §3.5 / §5 (and the
Spanish mirror in `doc/es/SPEC.md`) references this baseline using the
literal phrase **"WCAG AA minimum, AAA whenever possible"**, mirroring
the suite-wide rule in the metaproject's `apptonomia/CLAUDE.md`.

## Public-facing wording: "usuario/a tipo" euphemism

This directive applies across the entire Miralante suite (Apptonomia,
Calculia, Memofun, Okeymoney, Sinonimia, Teclatlon, Routime) and the
metaproject landing at `apptonomia.uk`. The suite's real objective is
occupational-therapy support for people with intellectual disability, but
**that framing is not used in public surfaces** — only in internal
documentation.

### Where each term is allowed

- **"Discapacidad intelectual" / "intellectual disability"** is the
  canonical term and **may only appear in internal documentation**
  (`CLAUDE.md`, `doc/<lang>/SPEC.md`, `technical.md` / `tecnico.md`,
  `roles.md`, `CONTRIBUTING.md`, `CONTRIBUTING.es.md`, tooling files
  in `scripts/`). It is explicitly **forbidden** in public-facing
  surfaces, READMEs that anyone can read without authentication, public
  talks, social media copy, press notes, and marketing material.
- **"Usuario/a tipo"** (plural "usuarios/as tipo") is the accepted
  euphemism for the audience in public-facing surfaces. It is used as
  a generic profile marker, not as a label for any real person.
  - It applies to `README.md` / `README.es.md`, public talks, social
    media copy, press notes, marketing material, and any
    contributor-facing document that also doubles as a public
    description of the project (e.g. `CONTRIBUTING.md`).
  - It does **not** apply to the UI of the app itself: the project's
    "Mandatory rule: zero mentions in the user-facing product" (see
    `doc/en/SPEC.md` §4 / `doc/es/SPEC.md` §4) continues to forbid
    **any** mention, including "usuario/a tipo", in `index.html`,
    `app.js`, `data.js`, `strings.<locale>.js`, `legal/`, and any
    other user-facing surface. The euphemism is for the outside world,
    not for what the visitor reads on the site.
  - It does **not** apply to project content that names a clinical
    concept by its real-world name (e.g. an activity about a real
    bureaucratic procedure): that is content, not labelling of an
    audience.

### Rationale

Presenting the project's real objective in maintainer docs is useful
and necessary for whoever maintains and contributes to the suite.
Presenting it in marketing or landing surfaces is neither necessary nor
respectful of the audience — "usuario/a tipo" lets public material
describe what the app is for (who the typical profile is) without
publicly naming a clinical group. This rule is mirrored in the
metaproject's `apptonomia/CLAUDE.md` and in every sibling's own
`CLAUDE.md` and `SPEC.md` so it survives a single project's docs going
out of sync.
