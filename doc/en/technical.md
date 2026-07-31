# Technical information

> Documentation for developers who want to understand, maintain or extend
> Teclatlon. Product scope and accessibility rules live in
> [`SPEC.md`](SPEC.md); this document is architecture only.

---

## 1. Non-negotiable technical constraints

- **HTML5 + CSS3 + Vanilla JavaScript.** No frameworks, no bundlers, no
  build step, no backend, no npm dependencies. There is no `package.json`
  in the repo, so Cloudflare Pages does not run `npm install` during the
  build and there is nothing to bundle.
- **Classic scripts**, not ES modules (compatibility with `file://` and
  old browsers). All shared code is exposed on `window.App.*`.
- **No JS CDNs.** Fonts are self-hosted in `assets/fonts/`.
- **Persistence only in `localStorage`.** No login, no cookies, no
  personal data, no analytics.
- **Offline-first PWA**: `manifest.json` + `sw.js` (cache-first of the
  app shell).
- **Code style**: ES5-style JS (`var`, classic functions, IIFE with
  `'use strict'`); identifiers, comments and commit messages always in
  English. UI text (`strings.es.js` / `strings.en.js`, lesson/word
  content in `data.js`) stays in the language it represents.
- **Computer keyboard only.** The on-screen keyboard is always
  decorative (`pointer-events: none` in CSS); there is no tappable
  input mode. Don't reintroduce one — see [`SPEC.md` §2](SPEC.md).

### 1.1 Hosting and deployment — Cloudflare Pages

Deployed on Cloudflare Pages via the Git connector, following the same
pattern as the sibling projects Apptonomia and Sinonimia:

- **No build step.** The repo root *is* the build output.
- **No `_redirects`, no `wrangler.toml`, no `functions/`.** Cloudflare
  Pages serves every static file with implicit `index.html` lookup per
  directory.
- **Cache headers live in `_headers`** at the repo root. `index.html`,
  `legal/*`, `manifest.json` and `sw.js` are forced to
  `must-revalidate`; fingerprinted JS/CSS/font assets get a 1-year
  immutable cache.
- **`manifest.json` and `sw.js` must use relative paths** (start `./`)
  so the app works on any host without changes.
- A one-off preview deploy from a dirty worktree, without committing any
  Wrangler config: `npx wrangler pages deploy . --project-name teclatlon`.

### 1.2 Cross-browser support

The on-screen keyboard, hand guide and physical `keydown` handling must
work on Chromium, Firefox and WebKit (Safari) on desktop — this is a
desktop-only app, so mobile/touch emulation is out of scope. Verify
manually in a real browser before landing a change to `app.js`,
`index.html`, or `styles.css`.

---

## 2. Architecture

```
teclatlon/
├── index.html          # The app itself — no separate landing page
├── app.js               # Logic only
├── data.js               # Locale-neutral keyboard layouts + per-locale
│                          # practice content (lessons, words, numpad steps)
├── strings.es.js         # Spanish UI text
├── strings.en.js         # English UI text
├── styles.css             # App-specific styles
├── assets/
│   ├── css/tokens.css     #   design variables (colors, typography, touch)
│   ├── css/base.css       #   reset, self-hosted fonts, visible focus,
│   │                       #   prefers-reduced-motion
│   ├── css/components.css #   reusable components (.btn, .card, …)
│   ├── js/utils.js        #   window.App.utils
│   ├── js/i18n.js         #   window.App.i18n
│   ├── js/tts.js          #   window.App.tts
│   ├── js/storage.js      #   window.App.storage
│   ├── js/feedback.js     #   window.App.feedback
│   ├── fonts/              #   self-hosted woff2 (Atkinson Hyperlegible, Nunito)
│   └── img/icono.svg       #   app icon (also the PWA icon)
├── legal/                 # Data-protection page (linked from the footer)
├── manifest.json           # PWA
├── sw.js                    # Service worker: cache list + VERSION
└── _headers                 # Cloudflare Pages cache and security headers
```

Unlike Apptonomia (many activities under `tools/<slug>/`, one shared
landing page), Teclatlon is a **single activity at the repo root**. There
is no `/settings/` hidden route either: progress reset is the inline
"🗑️ Borrar mi progreso" button in `index.html`.

### 2.1 `assets/` — shared core

Loaded in this exact order (see `index.html`): `utils.js` → `i18n.js` →
`tts.js` → `storage.js` → `feedback.js` → `strings.es.js` →
`strings.en.js` → `data.js` → `app.js`. `i18n.js` must load before
`tts.js`/`feedback.js`, which read the active language.

This core was ported from Apptonomia and **deliberately trimmed** to
what this single activity actually uses:

- `utils.js` keeps `shuffle`, `$`, `$$`, `reducedMotion` and the Wake
  Lock helper. Apptonomia's `esTactil()` (touch-device detection, used
  there to pre-select a tappable mobile keyboard) was dropped — there is
  no mobile mode here.
- `storage.js` keeps only `get`/`set`/`remove`. Apptonomia's
  cross-tool aggregation (`estrellasTotales`, `listaToolIds`, used by a
  multi-tool landing page and a settings screen) doesn't apply to a
  single-activity app and was dropped.
- `i18n.js` keeps `locale`/`setLocale`/`lang`/`register`/`t`/`pick`/
  `apply`. Apptonomia's legacy structured-data-tree merging
  (`data()`/`datos()`/`registerStructure()`) was dropped — unused here.
- `feedback.js` keeps `success`/`encourage`/`celebrate`. Apptonomia's
  `lockUntilAck()` (multiple-choice "reading pause" gate) was dropped —
  this activity has no multiple-choice screens.

Don't re-add any of the above without a concrete need; they were cut on
purpose, not missed.

### 2.2 `app.js` — single IIFE

Holds the whole client app: screen switching (`PANTALLAS`), the
sequence-game engine (`iniciarSecuencia`/`teclaJuego`/`pasoCompletado`)
used by "place your fingers", lessons, words and the number pad, the
"all keys" challenge (`jugarReto`/`teclaReto`), the hand-guide SVG, the
visual keyboard renderer, and the physical `keydown`/`keyup` listeners
that drive every game mode. There is no click-to-type path: the on-screen
keyboard only ever *reflects* key presses (`flashTecla`), it never
originates them.

### 2.3 `data.js` — keyboard layouts and practice content

- `DATA.rows` / `DATA.numberRow`: the physical Spanish keyboard layout
  (`{ ch, finger, wide?, bump?, label?, decor? }` per key). `finger` is
  hand (`l`/`r`) + finger (`p` pinky, `r` ring, `m` middle, `i` index),
  or `th` for the thumbs (space bar).
  `bump`: tactile marker (F, J, numpad 5). `decor`: decorative key with
  no `ch` (Tab, Shift, Enter, Backspace) — shapes the keyboard but is
  never a game target.
- `DATA.layouts`: the selectable visual keyboards —
  `simplificado` (letters only), `normal` (full physical layout with
  decorative keys), `extendido` (same as `normal`, plus the number pad
  shown alongside). All three are physical/decorative layouts; there is
  no touchable layout.
- `DATA.placement` / `DATA.lessons` / `DATA.words` / `DATA.numpadSteps`:
  per-locale practice content (`{ es: [...], en: [...] }`), read via
  `DATA.<field>[App.i18n.locale()]`.
- Finger display names live in `strings.<locale>.js` under
  `dedo.<id>.mano` / `.nombre`, not in `data.js`.

To extend: add a lesson or word to **both** `es` and `en` arrays.

### 2.4 Meaningful-learning anchor: `transferencia`

Every completion (a lesson, the words game, the number pad, or the "all
keys" challenge) appends `App.i18n.t('transferencia')` to the closing
celebration message (`celebrarConTransferencia()` in `app.js`) — a short
line connecting the exercise to writing real messages on a real
computer. This activity has no separate "round complete" screen, so the
line lives in the celebration overlay text itself, not in a dedicated
DOM element.

---

## 3. Internationalization

Same multi-file pattern as Apptonomia: `strings.es.js` and
`strings.en.js` each register one language via
`App.i18n.register(dict, 'es' | 'en')`; both files always load (see
`index.html`), and `App.i18n.locale()` decides which is active.
`scripts/check.js` checks key parity between the two files (root app and
`legal/`). Brace placeholders (`'{n} times'`) are substituted in `app.js`
with `.replace('{n}', value)`.

Common keys already registered in `core.*` in `assets/js/i18n.js` (don't
redefine them in `strings.<locale>.js`): `back`, `understood`, `listen`,
`listenInstructions`, `listenText`, `rest`, `dataProtection`.

---

## 4. PWA and service worker

- `sw.js` is cache-first for the app shell. Contract when touching files:
  1. New file → add it to the `ARCHIVOS` list.
  2. Any change to a cached file → bump `VERSION` (`teclatlon-vN`),
     otherwise users with the installed PWA won't receive the change.
- `manifest.json` uses a single SVG icon (`sizes: "any"`) — this is a
  desktop-only app, so there's no need for the 192/512 PNG set an
  iOS-home-screen target would require.

---

## 5. Verification

```bash
node scripts/check.js
```

No `npm install` needed. For a manual pass: open `index.html` in a
browser, go through the name screen, each game mode, and free writing,
in both `es` and `en`, verifying the physical-keyboard flow (no
click-to-type), audio buttons, and that "🗑️ Borrar mi progreso" actually
resets state.

---

## 6. Deployment

Cloudflare Pages, same pattern as Apptonomia and Sinonimia: the
repository root is the build output, no bundler. Push to `master`
triggers the build through the Cloudflare Git connector; pull requests
get an automatic preview channel. A deploy — even to a preview channel —
is a network operation: ask before running one (see `CLAUDE.md` §"Agent
workflow").

---

## 7. License

MIT. See [`LICENSE`](../../LICENSE).
