# Technical information

> Documentation for developers who want to understand, maintain or extend Teclatlon.

| Document | What it contains | When to read it |
|---|---|---|
| [`doc/en/SPEC.md`](SPEC.md) | Product scope, audience and non-negotiable rules | When changing what the app does or for whom |
| [`doc/en/technical.md`](technical.md) (this) | Architecture, shared core, contracts and development recipes | When modifying the codebase |
| [`doc/en/I18N.md`](I18N.md) | How to add a new supported language | When adding a translation |
| [`doc/en/SPEC.md` §2](SPEC.md) | "Computer only" rule, mobile-blocker gate | When touching the on-screen keyboard or the gate |
| `CLAUDE.md` at the repo root | Operational workflow for AI agents | Only when an AI agent performs a change |
| `git log` | Project history | When asking "why" about a past decision |

Each subject has one canonical source: product in `SPEC.md`, technical matters in this document, i18n in `I18N.md`. The closed project roadmap lives in `git log`. `CLAUDE.md` only defines the workflow for AI agents and does not redefine these rules.

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
- **Offline-first PWA**: `manifest.json` + `sw.js` (network-first with
  cache fallback for the app shell). The full cache contract — what
  each layer caches, when to bump `VERSION`, how to verify — lives in
  [`CLOUDFLARE.md` §"Cache contract"](../../CLOUDFLARE.md#cache-contract).
- **Code style**: ES5-style JS (`var`, classic functions, IIFE with
  `'use strict'`); identifiers, comments and commit messages always in
  English. UI text (`strings.es.js` / `strings.en.js`, lesson/word
  content in `data.js`) stays in the language it represents.
- **Computer keyboard only.** The on-screen keyboard is always
  decorative (`pointer-events: none` in CSS); there is no tappable
  input mode. Don't reintroduce one — see [`SPEC.md` §2](SPEC.md).

### 1.1 Hosting and deployment

The app is served as a static site on **Cloudflare Pages** via the
Git connector, with no build step (the repo root *is* the build
output). The operational details — why there is no `wrangler.toml`,
`_redirects`, `functions/` or `package.json`; the Cloudflare dashboard
configuration; the `sw.js` and SW-redirect note — live in
[`CLOUDFLARE.md`](../../CLOUDFLARE.md). Three things suffice here:

- `_headers` at the repo root controls cache and security headers
  (HTML/SW/manifest with `must-revalidate`, fingerprinted assets
  with a 1-year immutable cache).
- `manifest.json` and `sw.js` must use relative paths (start `./`) so
  the app works on any host without changes.
- `404.html`, `robots.txt` and `sitemap.xml` follow the same pattern
  as the sibling `calculia` / `sinonimia` repos (they are added to the
  `sw.js` `ARCHIVOS` list so they keep working offline).
- A deploy — even to a preview channel — is a network operation: ask
  before running one (see `CLAUDE.md` §"Agent workflow").

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
├── 404.html                  # Friendly fallback for stale paths (matches calculia/sinonimia)
├── robots.txt                # Allows all, points to sitemap.xml
├── sitemap.xml               # Indexable pages (app, legal, doc/{en,es}/SPEC.md)
├── CONTRIBUTING.es.md         # How to contribute (Spanish, source of truth)
├── CONTRIBUTING.md            # English translation
├── SECURITY.es.md             # Security policy (Spanish, source of truth)
├── SECURITY.md                # English translation
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

The settings panel (`#drawerAjustes`, a lateral drawer opened from the
`#btnAbrirAjustes` gear icon in the header — see SPEC.md §4.1) is read
from `state.opciones` and applied by `aplicarOpciones()`, called at
boot and after every toggle. `abrirAjustes()`/`cerrarAjustes()` handle
the open/close animation, backdrop click and focus management
(focus moves to the drawer's close button on open, back to whatever
triggered it on close); the drawer's `Tab`/`Escape` handling lives at
the top of the physical `keydown` listener (see below), ahead of the
game-input handling, since the drawer can be opened mid-game.
Interactions with the engine:

- `state.metricas` (teclas / aciertos / fallos / inicioMs) is
  initialised on every game start, updated by `teclaJuego` /
  `teclaReto`, and surfaced as live accuracy (%) and PPM when
  `state.opciones.metricas` is true.
- `premiar()` increments the streak and the best streak, then calls
  `verificarInsignias()` to unlock any badge whose condition becomes
  true. New badges trigger a brief banner (`#app-bandera-insignia`).
- `feedback.success(zona, pan)` accepts an optional stereo pan. The
  caller computes it from the column of the key
  (`App.utils.columnaDe` + `App.utils.panDeColumna`); the audio
  feedback only routes through `StereoPannerNode` when
  `state.opciones.espacial` is true.
- `feedback.success` / `encourage` also call `navigator.vibrate`
  when `state.opciones.vibracion` is true.

### 2.3 `data.js` — keyboard layouts and practice content

- `DATA.rows` / `DATA.numberRow`: the physical Spanish keyboard layout
  (`{ ch, finger, wide?, bump?, label?, decor? }` per key). `finger` is
  hand (`l`/`r`) + finger (`p` pinky, `r` ring, `m` middle, `i` index),
  or `th` for the thumbs (space bar).
  `bump`: tactile marker (F, J, numpad 5). `decor`: decorative key with
  no `ch` (Tab, Shift, Enter, Backspace) — shapes the keyboard but is
  never a game target.
- `DATA.layouts`: the selectable visual keyboards —
  `simplificado` (letters plus both Shift keys — needed so the
  capitals lesson has a Shift key to point at even in this
  stripped-down view), `normal` (full physical layout with decorative
  keys), `extendido` (same as `normal`, plus the number pad shown
  alongside). All three are physical/decorative layouts; there is no
  touchable layout.
  The three buttons in the UI are labeled, in plain language for
  beginners, "Letters only" / "Letters and numbers" / "With numbers
  on the side" (see `btnSimple`/`btnNormal`/`btnExtendido` in
  `strings.<locale>.js`); under the selected button a one-line
  description (e.g. "You only see the letters. It is the simplest
  view.") is shown via `.detalle-teclado` so each option explains
  itself in everyday words.
- `DATA.placement` / `DATA.lessons` / `DATA.words` / `DATA.numpadSteps` /
  `DATA.templates`: per-locale practice content (`{ es: [...], en: [...] }`),
  read via `DATA.<field>[App.i18n.locale()]`.
- `DATA.insignias`: the badge table. Each entry is
  `{ id, clave, condicion(state) => bool }`. `clave` is the i18n key
  (`insigniaPrimera`, etc.). `condicion` is evaluated on every
  progress change and after boot; new badges unlock the banner in
  `app.js`.
- Finger display names live in `strings.<locale>.js` under
  `dedo.<id>.mano` / `.nombre`, not in `data.js`.

To extend: add a lesson or word to **both** `es` and `en` arrays.

**Capital letters (Shift):** a lesson step's `seq` may contain an
uppercase letter (e.g. `'A'`) to require Shift for that character —
see the `l16`/"Mayúsculas"/"Capitals" lesson. There is no separate
physical key for the capital; `teclaJuego(ch, mayus)` compares the
normalized (lowercase) pressed key against `seq[pos].toLowerCase()`
and additionally requires `mayus` (the keydown's `e.shiftKey`) only
when `seq[pos]` is itself uppercase — a lowercase step never checks
Shift state, so accidentally holding it doesn't count as a mistake.
`ladoMayusOpuesto(finger)` in `app.js` encodes the standard
touch-typing convention (hold Shift with the pinky on the side
*opposite* the letter's hand); `manosSVG`/`pintarManos` highlight that
second finger at reduced opacity (`.dedo.activo-mayus`) alongside the
primary finger, and `guiaTexto` appends a sentence naming it.

**Special keys (Home/End/Page Up/Page Down/Delete):** a lesson step
can be `{ especial: 'inicio' }` instead of `{ seq: '...' }` — see the
`l17`/"Teclas especiales"/"Special keys" lesson and
`esPasoEspecial(p)` in `app.js`. These keys don't type a character, so
the step completes in one shot on the right keydown instead of walking
a `seq` index, and — since no consistent finger convention exists for
them — the hand-guide finger highlight is skipped entirely
(`pintarManos(null, null)`); only the matching on-screen key gets the
`.objetivo` highlight. Only `DATA.layouts.extendido` draws these keys
(a `teclaEspecial(id)` row prepended in `data.js`); they carry a real
`ch` (unlike other decorative keys) so `marcarObjetivo`/`flashTecla`
can target them, but `special: true` keeps them out of the "all keys"
challenge (`clavesTipeables`/`actualizarReto` both skip `k.special`).
`normalizarTecla`'s `TECLA_ESPECIAL_DOM` table is the only place that
maps the raw `KeyboardEvent.key` values (`'Home'`, `'PageUp'`, …) to
the internal ids used everywhere else (`data-ch`, `especial`,
`teclaLabel.*`).

**Extensible templates ("Textos reales"/"Real texts" mode):**
`DATA.templates.<locale>` is an array of `{ id, title, lines }` — a
full real-world writing task (an email, a letter…) instead of a single
word or drill sentence. Unlike `DATA.lessons`, these are **not**
gated behind a linear unlock chain (see `pintarPlantillas()` in
`app.js`): every entry is always open, since they're independent
practice texts, not a graded curriculum. `lines` is the text split
into short lines; `jugarPlantilla(p)` turns each line into one
sequence-engine step (`{ seq: linea }`), the same mechanism a lesson's
plain-string step already uses — no new engine code was needed for
this, only a new menu card, a new screen (`#pantallaPlantillas`,
modeled on `#pantallaLecciones`) and this data table. **To add a new
template:** append `{ id, title, lines }` to *both* the `es` and `en`
arrays in `data.js`; keep `lines` to characters the layout models
(lowercase letters, `ñ`, the punctuation in `DATA.rows`: `,` `.` `-`,
and uppercase letters via Shift — see lesson "Capitals"). Avoid
`¡`, `¿`, `!`, `?` and accented vowels: those keys aren't modeled in
`DATA.rows`, so they would silently swallow the keystroke. `id` must
be unique and stable — it's reused as the badge/progress key
(`'plantilla_' + id`).

### 2.4 Meaningful-learning anchor: `transferencia`

Every completion (a lesson, the words game, the number pad, or the "all
keys" challenge) appends `App.i18n.t('transferencia')` to the closing
celebration message (`celebrarConTransferencia()` in `app.js`) — a short
line connecting the exercise to writing real messages on a real
computer. This activity has no separate "round complete" screen, so the
line lives in the celebration overlay text itself, not in a dedicated
DOM element.

### 2.5 Computer-only gate and pre-paint i18n bootstrap

The `<head>` of `index.html` ships a tiny inline `<script>`, with no
dependencies and synchronous, that runs **before the first paint** and
does two things:

1. **Picks the UI language** from `navigator.languages` (first 2-letter
   prefix in `SOPORTADOS = ['es', 'en']`, fallback `es`) and applies it
   to `document.documentElement.lang` so it matches the `<title>` that
   `App.i18n.apply()` will later fill in. The same logic lives in
   `assets/js/i18n.js#detectar()` — if you add a supported locale,
   update both spots.
2. **Detects mobile/tablet** by combining UA
   (`mobile|tablet|android|…`), `pointer: coarse`, `maxTouchPoints` and
   `matchMedia('(max-width: 900px)')`. If it triggers, it sets
   `data-app-bloqueada="movil"` on `<html>` and rewrites `<title>` to
   "Solo en el ordenador — Teclatlon" / "Computer only — Teclatlon" so
   the browser tab also warns. Desktop UAs
   (`windows nt|macintosh|x11|cros `) pass even with a touch screen —
   a Surface, MacBook with Touch Bar, or a convertible Chromebook
   with a physical keyboard are still "computer".

The same script also reads `localStorage['teclatlon:keyboard']`
directly (same key `assets/js/storage.js` writes, wrapped in the same
try/catch pattern for private-mode safety) and applies
`opciones.tema`/`.texto`/`.foco` to `<html>` before first
paint — otherwise the page would flash the default theme/text-size/
font for a moment before `app.js#aplicarOpciones()` runs on
`DOMContentLoaded`. Focus mode targets `html.modo-foco` (not
`body.modo-foco`) specifically so this pre-paint script can set it
before `<body>` exists.

The HTML carries a static overlay at the top of `<body>`
(`#bloqueoMovil`) with `hidden`, the `data-i18n` keys
(`soloOrdenador`, `soloOrdenadorMotivo`, `soloOrdenadorSugerencia`) and
`role="alertdialog"`. The CSS rule
`html[data-app-bloqueada="movil"] .container { display: none }` hides
the app shell instantly; `app.js` removes the overlay's `hidden` in
the "Arranque" block and, when blocked, `return`s before wiring up
listeners, audio contexts or the game engine (no point reserving
resources on a device that won't use the app). The overlay styles
(`bloqueo-movil*`) live at the bottom of `styles.css` with fallback
colors in case `tokens.css` hasn't loaded yet.

---

## 3. Internationalization

Multilingual architecture shipped today with the **base pair**
`es`/`en` (Spanish, default and source of truth, and English). The
i18n runtime (`App.i18n`) is designed to support **N languages** — the
shapes that would change (`SOPORTADOS`, the pre-paint detector,
`lang()`, `scripts/check.js`, `sw.js#ARCHIVOS`, the language selector
buttons) and the full step-by-step recipe live in [`I18N.md`](I18N.md),
which is the canonical reference for extending the app to additional
languages. Read it together with `SPEC.md` §6 (language policy) and
this section.

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

The active language still defaults to the browser-detected one
(`i18n.js#detectar`, mirrored pre-paint in `index.html` — see §2.5), but
it can be overridden manually: the "Idioma" row in the settings panel
(`#panelAjustes`, `.btn-idioma` buttons, wired in `app.js`) and the
explicit selector in `legal/index.html` (`#btnIdiomaEs`/`#btnIdiomaEn`)
call `App.i18n.setLocale('es' | 'en')`. `setLocale` persists the choice
to `localStorage` (`teclatlon:locale`, read by `i18n.js#locale()` ahead
of detection) and reloads the page — there is no in-place re-render.

To add a new language: see [`I18N.md` §5](I18N.md) for the full
recipe. At a glance it means updating both `SOPORTADOS` arrays
(`i18n.js` and the `index.html` pre-paint script) plus the internal
`lang()` map, `scripts/check.js#STRING_LOCALES`, `sw.js#ARCHIVOS` and
`VERSION`, adding `strings.<locale>.js` and `legal/strings.<locale>.js`,
adding the per-locale arrays in `data.js`, and adding a `.btn-idioma`
button in `index.html`.

---

## 4. PWA and service worker

- `sw.js` is **network-first with cache fallback** (not cache-first:
  that wording in older docs is wrong). The fetch handler hits the
  network first and mirrors the response into the SW cache, so the
  latest server version is authoritative whenever the device is
  online; the cache only kicks in when the network is unreachable.
- Contract when touching files:
  1. New file → add it to the `ARCHIVOS` list.
  2. Any change to a cached file → bump `VERSION` (`teclatlon-vN`),
     otherwise users with the installed PWA won't receive the change.
     `VERSION` is the only knob that purges the old SW cache on next
     app open; without a bump, a redeploy stays invisible to clients
     that already have the SW installed.
- `manifest.json` uses a single SVG icon (`sizes: "any"`) — this is a
  desktop-only app, so there's no need for the 192/512 PNG set an
  iOS-home-screen target would require.

---

## 5. Verification

```bash
# Local server (either works; no build step)
python -m http.server 8080     # → http://localhost:8080/index.html
npx serve .

# Structural + i18n check (no npm install needed — stdlib only)
node scripts/check.js
```

`scripts/check.js` checks: every `.js` file parses, `strings.es.js` /
`strings.en.js` have matching keys (root app and `legal/`), every path
in `sw.js`'s `ARCHIVOS` exists on disk, and every `manifest.json`
icon exists. CI (`.github/workflows/validate.yml`) runs the same
command on every push and pull request.

Not yet automated (manual before shipping a change): a real-browser
walk through the name screen, each game mode (lessons, words, number
pad, all-keys challenge) and free writing, in both `es` and `en`,
verifying the physical-keyboard flow (no click-to-type), audio
buttons, and that "🗑️ Borrar mi progreso" actually resets state. See
`SPEC.md` for the full manual checklist and `§1.2` above for the
cross-browser expectation.

---

## 6. Deployment

See [`CLOUDFLARE.md`](../../CLOUDFLARE.md) for the operational
details (dashboard configuration, deploy warnings, SW note). TL;DR:
the repo root is the build output, a push to `master` triggers the
build via the Cloudflare Git connector, pull requests get an
automatic preview channel. A deploy — even to a preview channel — is
a network operation: ask before running one.

---

## 7. Sibling projects: real differences

Teclatlon is one of five static PWAs in the same family, all sharing
the accessibility-first / no-backend philosophy and the same Cloudflare
Pages deploy. The canonical guide for the group lives in
[Apptonomia's `technical.md`](https://github.com/thenkdframe/apptonomia/blob/master/doc/en/technical.md);
this section is the project-specific delta — the table below records
the **real** differences between this repo and the four siblings so
you know what is shared, what is trimmed, and what is intentionally
different.

The other four:

- **Apptonomia** (the reference, hub-and-spoke): `tools/<slug>/` per
  activity (~60), `site/` landing, `settings/`, `about/`, `team/`,
  `content/`, `legals/` shared.
- **Calculia** (hub-and-spoke, single domain): the closest in shape to
  Apptonomia, just narrowed to 12 math/logic activities in two
  sections.
- **Okeymoney** (single-activity, money/personal-finance domain):
  the closest sibling to Teclatlon — both single-activity, both
  trimmed `assets/js/`, both share the same Cloudflare Pages shape
  without `wrangler.toml` and `_redirects`.
- **Sinonimia** (legacy flat layout): pre-pattern PWA, uses flat
  `css/` / `js/` / `img/` at the repo root instead of `assets/`, no
  `sw.js` / `manifest.json` (no PWA contract), a different
  `scripts/validar.js` instead of `scripts/check.js`.

### What the four `assets/js/*` cores actually export

| Module | Teclatlon | Okeymoney | Apptonomia | Calculia | Sinonimia |
|---|---|---|---|---|---|
| `utils.js` (`shuffle, $, $$, reducedMotion`) | ✅ trimmed | ✅ full | ✅ full | ✅ full | n/a (flat `js/`) |
| `i18n.js` (`locale, setLocale, lang, register, t, pick, apply`) | ✅ trimmed + English identifiers (`SUPPORTED`, `DEFAULT_LOCALE`, `LOCALE_KEY`, `BCP47`, `LABEL`, `FLAG`) | ✅ full + BCP47/LABEL/FLAG | ✅ full | ✅ full | n/a |
| `tts.js` (`App.tts.speak`) | ✅ | ✅ | ✅ | ✅ | n/a |
| `storage.js` (`get/set/remove`) | ✅ trimmed (no multi-tool aggregation) | ✅ full + `clearAll` | ✅ full | ✅ full | n/a |
| `feedback.js` (`success, encourage, celebrate`) | ✅ trimmed (no `lockUntilAck`) | ✅ full | ✅ full | ✅ full | n/a |
| `dinero.js` / `money.js` (money domain) | ❌ trimmed (not used here) | ✅ `money.js` (fork of `dinero.js`) | ✅ `dinero.js` | ✅ `dinero.js` | n/a |

### File-layout differences (Teclatlon vs the rest)

| File / folder | Teclatlon | Okeymoney | Apptonomia | Calculia | Sinonimia |
|---|---|---|---|---|---|
| `index.html` at repo root (single-activity) | ✅ | ✅ | ❌ (lives at `site/index.html`) | ❌ (`site/index.html`) | ✅ |
| `tools/<slug>/` per activity | ❌ trimmed | ❌ trimmed | ✅ (~60) | ✅ (12) | ❌ |
| `site/` landing | ❌ trimmed (none) | ❌ trimmed | ✅ | ✅ | ❌ |
| `settings/` (hidden route) | ❌ trimmed (reset is inline in `index.html`) | ✅ | ✅ | ✅ | ❌ |
| `about/`, `team/`, `content/` | ❌ trimmed (none) | ❌ trimmed | ✅ | ❌ | ❌ (`about/` only) |
| `legal/` (data-protection page) | ✅ | ✅ | ✅ | ✅ | ❌ |
| `assets/css/{tokens,base,components}.css` | ✅ | ✅ | ✅ | ✅ | ❌ (flat `css/styles.css`) |
| `assets/fonts/` (Atkinson + Nunito) | ✅ | ✅ | ✅ | ✅ | ❌ |
| `assets/img/icono.svg` | ✅ | ✅ | ✅ | ✅ | ✅ (`img/logo.svg`) |
| `scripts/check.js` (no deps, Node stdlib) | ✅ N-locales | ✅ N-locales | ✅ sprawling (`tools/`, `site/`, …) | ✅ with catalog-parity lock | ❌ `scripts/validar.js` |
| `scripts/check.js` identifier language | English | English | Spanish (older convention) | English | Spanish (different file) |
| `sw.js` (network-first PWA with cache fallback) | ✅ | ✅ | ✅ | ✅ | ❌ |
| `manifest.json` (single SVG icon) | ✅ | ✅ | ✅ (also had PNG raster) | ✅ (SVG only) | ❌ |
| `_headers` (CSP + Permissions-Policy + CORP + COOP + Upgrade-Insecure-Requests) | ✅ | ✅ | partial (no CSP) | ✅ | ✅ (with CSP) |
| `404.html`, `robots.txt`, `sitemap.xml` | ✅ | ❌ (Okeymoney depends on `wrangler.toml`'s `not_found_handling`) | ❌ (`quick-guide.md`) | ✅ | ❌ |
| `wrangler.toml` | ❌ absent (documented in `CLOUDFLARE.md` — classic Pages Git connector) | ✅ (`[assets] directory = "."`, Workers + static assets) | ❌ | ✅ | ✅ (kept on purpose, Pinned name) |
| `_redirects` | ❌ absent (documented in `CLOUDFLARE.md` — Pages rejects the SPA catch-all as a loop) | ❌ | ❌ | ❌ | ❌ |
| `package.json` | ❌ absent (deliberate: avoids `npm install` overshooting the 25 MiB asset limit) | ❌ | ❌ | ❌ | ❌ |

### Where the differences are documented

| Decision | Where Teclatlon explains it |
|---|---|
| "No landing page, no per-tool routing, no `/settings/`" | This file §2 and `CLAUDE.md` "Architecture" |
| "`tools/<slug>/` per activity was deliberately dropped" | This file §2 "Architecture" paragraph |
| "`assets/js/` trimmed to what this single activity actually uses" | This file §2.1 "shared core" and `CLAUDE.md` |
| "No `wrangler.toml`, no `_redirects`" | [`CLOUDFLARE.md`](../../CLOUDFLARE.md) "Why no `wrangler.toml`?" and "Why no `_redirects`?" |
| "Bilingual by default (`es` + `en`); how to add a third language" | [`I18N.md`](I18N.md) |
| "Zero mentions of disability / occupational therapy / minors in user-facing files" | [`SPEC.md`](SPEC.md) §4 and `scripts/check.js` §5 |

If any of those "trimmed" or "absent" items above looks like a bug to
you, check the cited source before re-adding it: most are
documented fork decisions, not oversights.

---

## 8. License

MIT. See [`LICENSE`](../../LICENSE).
