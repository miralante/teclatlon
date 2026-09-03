# Suite pattern — how every app of Miralante is built

> 🌐 **Otro idioma:** [Español](../es/patron-suite.md)

This document is the **canonical, cross-project guide** for how every
app of the [Miralante suite](https://apptonomia.uk) is built and
maintained. It is the source of truth that overrides any single
repo's `technical.md` when they disagree, because the goal is to keep
the seven sibling apps (Apptonomia, Calculia, Memofun, Okeymoney,
Sinonimia, Teclatlon, Routime) consistent: same shape, same
conventions, same deploy, same i18n, same offline behaviour.

A change to this document is a **suite-wide change** and must be
applied to every repo. A change to one repo's `technical.md` is
project-specific and stays there.

> **Source of truth for product rules** in this repo:
> [`SPEC.md`](SPEC.md).
> **Source of truth for technical recipes** in this repo:
> [`technical.md`](technical.md).
> **Source of truth for i18n**: [`I18N.md`](I18N.md).
> This document does **not** redefine those; it codifies the
> pattern they all share.

---

## 0. The pattern in one paragraph

Every app of the Miralante suite is a **static, dependency-free,
offline-first PWA** built from the same minimal skeleton:

1. A small set of **standalone HTML pages** at the repo root
   (one activity) or under `tools/<slug>/` (multi-activity hubs).
2. Every page is a **real, navigable URL** — there is **no SPA
   routing**, no in-page view switching, no `pushState`. Each page
   reloads on entry; navigation between pages is a normal `<a>`
   click.
3. Hidden routes (`about/`, `team/`, `legal/`, `config/`) share
   the same shape: `index.html` + `styles.css` + `strings.<locale>.js`
   pair, with **interlinking in the footer** so any of them is one
   click away from any other.
4. A **service worker** (`sw.js`, network-first) caches the shell
   (`FILES` list, bumped `VERSION`) so the app works offline.
5. **No build step**, no `package.json`, no frameworks, no bundlers,
   no CDN JS. The repo root is the deploy output.

---

## 1. The standalone-page shape

This is the pattern every hidden route and every public route
follows. The shape is identical across the suite; only the
contents change.

### 1.1 The five-folder skeleton

Every app exposes the same five folders:

```
<app>/
  index.html              # Public entry point (the activity)
  app.js                  # Logic
  data.js                 # Locale-neutral layouts + per-locale content
  strings.es.js           # Spanish UI text (source of truth)
  strings.en.js           # English UI text
  styles.css              # App-specific styles
  assets/
    css/{tokens,base,components}.css
    fonts/                # Self-hosted Atkinson Hyperlegible + Nunito
    img/                  # App icon + decorative imagery
    js/{utils,i18n,tts,storage,feedback}.js
  about/                  # Hidden route: presentation
    index.html
    styles.css
    strings.es.js
    strings.en.js
  team/                   # Hidden route: who builds it
    index.html
    styles.css
    strings.es.js
    strings.en.js
  legal/                  # Data-protection page (linked from the footer)
    index.html
    styles.css
    strings.es.js
    strings.en.js
  config/                 # Settings (only on apps that need it)
    index.html
    app.js
    styles.css
    strings.es.js
    strings.en.js
  manifest.json
  sw.js
  _headers
  404.html
  robots.txt
  sitemap.xml
```

Single-activity apps (Teclatlon, Okeymoney) put `index.html` at
the repo root. Multi-activity apps (Apptonomia, Calculia) put
`tools/<slug>/index.html` per activity and a `site/index.html`
landing page; the four hidden folders live at the repo root.

### 1.2 The HTML shell of a standalone page

Every standalone page opens with the same boilerplate. Below,
the **template**; deviations are called out where they apply.

```html
<!DOCTYPE html>
<html lang="es" data-i18n-title="pageTitle">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teclatlon — Sobre este proyecto</title>
  <!-- Hidden route: not linked from the main menu and should not be
       indexed. Aimed at anyone who wants to know what Teclatlon is:
       families, professionals, journalists, funders, contributors. -->
  <meta name="robots" content="noindex, nofollow">
  <meta name="description" content="…">
  <meta name="theme-color" content="#FAF7F2">
  <link rel="stylesheet" href="../assets/css/tokens.css">
  <link rel="stylesheet" href="../assets/css/base.css">
  <link rel="stylesheet" href="../assets/css/components.css">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container {legal|about}">
    <header class="cabecera-{legal|about}">
      <div class="idioma-selector" role="group" aria-label="Elegir idioma">
        <button type="button" class="btn-idioma" id="btnIdiomaEs"
                data-locale="es" aria-pressed="false">🇪🇸 Español</button>
        <button type="button" class="btn-idioma" id="btnIdiomaEn"
                data-locale="en" aria-pressed="false">🇬🇧 English</button>
      </div>
      <img src="../assets/img/icono.svg" alt="" width="80" height="80"
           class="logo-{legal|about}">
      <h1>…</h1>
      <p class="lema" data-i18n="tagline">…</p>
      <p class="entradilla" data-i18n="lead">…</p>
      <nav class="indice">…optional, only on long pages…</nav>
    </header>

    <main class="pila">
      <section class="card">…</section>
    </main>

    <footer class="pie-{legal|about}">
      <a class="btn btn-secundario" href="../"
         data-i18n="footerActivities">Ir a la aplicación</a>
      <a class="btn btn-secundario" href="../legal/"
         data-i18n="footerDataProtection">Protección de datos</a>
      <a class="btn btn-secundario" href="../about/"
         data-i18n="footerAbout">Sobre este proyecto</a>
      <a class="btn btn-secundario" href="../team/"
         data-i18n="footerTeamGuide">Quiénes la hacen</a>
      <a class="btn btn-secundario" href="../config/"
         data-i18n="footerSettings">Ajustes</a>
    </footer>
  </div>

  <script src="../assets/js/utils.js"></script>
  <script src="../assets/js/i18n.js"></script>
  <script src="strings.es.js"></script>
  <script src="strings.en.js"></script>
  <script>
    (function () {
      'use strict';
      function paintLanguageSelector() {
        var active = App.i18n.locale();
        document.getElementById('btnIdiomaEs')
          .setAttribute('aria-pressed', String(active === 'es'));
        document.getElementById('btnIdiomaEn')
          .setAttribute('aria-pressed', String(active === 'en'));
      }
      document.getElementById('btnIdiomaEs')
        .addEventListener('click', function () { App.i18n.setLocale('es'); });
      document.getElementById('btnIdiomaEn')
        .addEventListener('click', function () { App.i18n.setLocale('en'); });
      paintLanguageSelector();
    })();
  </script>
  <script>
    /* Register the SW from this entry point so it is active for any
       later navigation, matching what the main index.html and the
       other standalone pages already do. */
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('../sw.js').catch(function () {});
    }
  </script>
</body>
</html>
```

**Notes:**

- `data-i18n-title="pageTitle"` on `<html>` lets `assets/js/i18n.js`
  fill `document.title` during `init()`. The hardcoded `<title>` is
  the fallback the browser tab would show before i18n.js executes
  (and the SW cache fallback).
- The page's own class on the `<div class="container …">` wrapper is
  what the page-specific `styles.css` scopes its rules under
  (`legal-page`, `about-page`, `team-page`). No more
  `.sp-*` ancestor prefixes (those were a SPA-merge leftover,
  retired in 2026-09; see `git log`).
- The footer is **always** the same five links (in the same order)
  on `about/`, `team/` and `legal/`. `config/` gets a stripped
  footer that only returns to the SPA. The app root (`index.html`)
  does **not** render this footer (it has its own footer with the
  reset button and the data-protection link — see
  `technical.md` §2).

### 1.3 The strings pair

Each standalone folder ships its own `strings.es.js` /
`strings.en.js`. They follow the **flat-key, IIFE-register**
pattern; `scripts/check.js` extracts the dictionary via
`vm.createContext` with a stub `App.i18n.register` and enforces
key parity between locales.

```javascript
/* legal/strings.es.js — page text (ES). */
(function () {
  'use strict';
  App.i18n.register({
    pageTitle: 'Protección de datos',
    pageDescription: 'Teclatlon: qué datos guarda, dónde y por qué. …',
    routeNotice: 'Esta página no se enlaza desde la aplicación. …',
    tagline: 'Sin registro. Sin cookies. Sin analítica.',
    lead: 'Teclatlon no pide tus datos personales. …',
    navResponsible: 'Quién trata tus datos',
    navData: 'Qué guardamos',
    /* …more keys… */
    footerActivities: 'Ir a la aplicación',
    footerAbout: 'Sobre este proyecto',
    footerTeamGuide: 'Quiénes la hacen',
    footerSettings: 'Ajustes'
  }, 'es');
})();
```

Keys are flat (no `legal.pageTitle` style namespacing); the page
**is** the namespace, because the file lives in its own folder.
Common keys (`core.back`, `core.listen`, `core.dataProtection`)
already ship in `assets/js/i18n.js` and are not redefined here.

### 1.4 The standalone stylesheet

Each standalone folder ships its own `styles.css`. It is **the
old `assets/css/subpages.css` split per page**, with the
`.sp-legal` / `.sp-about` ancestor prefixes dropped (they were
a SPA-merge leftover). The page wrapper class
(`<div class="legal-page">`, `<div class="about-page">`, etc.)
is what the CSS scopes under:

```css
.legal-page { max-width: 880px; }
.legal-page .cabecera-legal { … }
.legal-page .indice a { … }
.legal-page section { … }
```

Do **not** introduce per-page classnames that collide with the
shared components (`base.css` already defines `.cabecera`,
`.lema`, `.indice`, `.btn`, `.card`, `.pila`, …). When the
standalone page needs a different look, scope the rule under
the page class — never under a generic `.cabecera` or `.indice`.

---

## 2. The shared core

Every app of the suite ships the same six files under
`assets/js/`, in the same load order, with the same exported
shape. Trimming is allowed; **adding** functionality back is
forbidden unless it serves a concrete need (the trimming notes
in `technical.md` §2.1 are the canonical rationale).

| Module | Surface | Required by |
|---|---|---|
| `utils.js` | `App.utils.shuffle / $ / $$ / reducedMotion / wakeLock` | every page |
| `i18n.js` | `App.i18n.{locale, setLocale, lang, register, t, pick, apply, SUPPORTED, DEFAULT_LOCALE, LABEL, FLAG}` | every page |
| `tts.js` | `App.tts.speak` | only pages that read aloud (most do) |
| `storage.js` | `App.storage.{get, set, remove}` | only pages that read or write `localStorage` (`index.html`, `config/`) |
| `feedback.js` | `App.feedback.{success, encourage, celebrate}` | only the activity's `app.js` |

The load order is `utils.js → i18n.js → tts.js → storage.js →
feedback.js → strings.<locale>.js → data.js → app.js`. `i18n.js`
must load **before** `tts.js` and `feedback.js`, which read the
active language.

Both `strings.es.js` and `strings.en.js` always load (they're not
gated by `locale`); `App.i18n.locale()` decides which one is
active. The locale picks itself from
`localStorage['teclatlon:locale']` first, then
`navigator.language` (`'es'` fallback).

---

## 3. The PWA contract

The service worker is **network-first, cache-fallback**, declared
in `sw.js` and committed next to `manifest.json`. The contract:

```javascript
var VERSION = 'teclatlon-vN';
var FILES = [
  './index.html',
  './404.html',
  './manifest.json',
  './app.js',
  './data.js',
  './strings.es.js',
  './strings.en.js',
  './styles.css',
  /* one entry per file in the app shell, including every standalone
     page's index.html, styles.css and strings.<locale>.js pair */
  './legal/index.html',
  './legal/styles.css',
  './legal/strings.es.js',
  './legal/strings.en.js',
  /* …about/, team/, config/ likewise… */
  './assets/css/tokens.css',
  './assets/css/base.css',
  './assets/css/components.css',
  './assets/fonts/…woff2',
  './assets/js/utils.js',
  './assets/js/i18n.js',
  './assets/js/tts.js',
  './assets/js/storage.js',
  './assets/js/feedback.js',
  './assets/img/icono.svg'
];
```

Two rules govern changes to `FILES`:

1. **New file → add it to `FILES`.** The `install` handler puts
   each file individually (never `cache.addAll`, which aborts on
   the first failure and bricks the cache for everyone).
2. **Any change to a cached file → bump `VERSION`**
   (`'teclatlon-vN'` → `'teclatlon-vN+1'`). Without the bump, an
   offline user is stuck on the old version forever, because the
   `activate` handler only purges caches with a different name.

`scripts/check-version-bump.js` enforces (2): it `git show HEAD:sw.js`
to see what `VERSION` was at the last commit, compares against
the current `VERSION`, and checks that `FILES` and the diff
against HEAD agree. If they don't, the script fails and the
`cache-bump` CI job fails too.

Every standalone page also runs
`navigator.serviceWorker.register('../sw.js')` from its inline
script, so a direct visit to `/legal/`, `/about/` or `/team/`
primes the SW for the SPA root the same way `index.html` does.

---

## 4. i18n invariants

These are non-negotiable across the suite. A locale change is
incomplete until **every** file in this list is updated:

1. `assets/js/i18n.js#SUPPORTED` and `#DEFAULT_LOCALE`.
2. `assets/js/i18n.js#BCP47` mapping (for `speechSynthesis` voice
   selection).
3. The pre-paint detector in `index.html` (the inline `<script>`
   that picks the locale before first paint — see `technical.md`
   §2.5 of each repo).
4. `strings.<locale>.js` and every per-folder `strings.<locale>.js`
   pair (`legal/`, `about/`, `team/`, `config/`).
5. `data.js`: every locale-split array
   (`DATA.lessons.<locale>`, `DATA.words.<locale>`,
   `DATA.templates.<locale>`, `DATA.numpadSteps.<locale>`).
6. `sw.js`: add the new `strings.<locale>.js` files to `FILES`
   and bump `VERSION`.
7. `scripts/check.js`: the parity check works in N locales with
   no code change (it picks up every `strings.<locale>.js` pair
   via `fs.readdirSync`); confirm the script still passes after
   the locale is added.

The full step-by-step recipe (with example code) is in
[`I18N.md`](I18N.md).

---

## 5. What is **forbidden** (across the suite)

These are anti-patterns observed at some point and explicitly
retired; the commit history is the source of truth for each
retirement. The rule is "if you find yourself reaching for one of
these, stop and re-read this section".

- **No SPA / no `pushState` / no `view-*` sections.** Every page
  is its own URL. Do not merge `legal/`, `about/`, `team/` into
  `index.html` as hidden sections, even with a redirect shim.
  This was tried in 2026-09 (`spa: merge`) and reverted in the
  same release; see `git log` for the lessons learned. Navigation
  between pages must always be a real `<a>` click, and every
  hidden route must be one click away from any other via the
  shared footer.
- **No `App.goLegal` / `App.goAbout` / `view-legal` / `view-about`
  / `sp-legal` / `sp-about` / `sp-idioma` / `subpages.css`.**
  These all belong to the retired SPA-merge model.
- **No `_redirects` SPA catch-all.** Cloudflare rejects it as a
  loop; documented in `CLOUDFLARE.md` and in the deploy recipe.
- **No `data-app-blocked="mobile"` flash.** The pre-paint script
  is a single inline `<script>` in `<head>`; do not split it
  into a separate `.js` (CSP `script-src 'self'` would still
  allow it, but the synchronous timing guarantee only holds for
  inline scripts in the head).
- **No `package.json`, no `node_modules`.** The repo is the build
  output. A package manifest would force Cloudflare to run
  `npm install` on every build, overshooting the 25 MiB asset
  limit.
- **No JS CDNs.** All fonts, icons and JS ship in `assets/`.
- **No ES module imports** (`<script type="module">`). The app
  must work from `file://` for offline use; ES modules break that.
- **No real-time database, no login, no cookies, no analytics.**
  Persistence is `localStorage` only.
- **No tappable on-screen keyboard** in apps that target the
  physical computer keyboard (Teclatlon, Okeymoney's typed
  amounts, Sinonimia's typed words). The on-screen keyboard is
  decorative only.

---

## 6. Validation checklist

Run this on every PR that touches any of the surface files
(`*.html`, `*.js`, `*.css`, `sw.js`, `manifest.json`, `data.js`):

```bash
node scripts/check.js           # must report OK (N checks, no failures)
node scripts/check-version-bump.js   # must pass
```

Then open the affected pages in a browser at
`http://localhost:<port>/<route>` and walk through the manual
smoke:

- `index.html` boots into the name screen or the menu depending
  on saved state; `localStorage` roundtrip works; the "🗑️ Borrar
  mi progreso" button resets both the data and the UI.
- `/legal/` loads with the localized h1, tagline and footer; the
  language switcher toggles `lang`, `document.title` and every
  `data-i18n` text without a stale flash.
- `/about/` and `/team/` likewise; their footer links navigate to
  each other and to `/legal/` and `/config/` without reloads
  before the SW primes.
- `/config/` lists the saved state and its two reset buttons
  work (two-step confirm).
- Refresh once after first load and verify `navigator.serviceWorker`
  reports `controller` non-null.

If any of the above fails, the change does not match the suite
pattern and must be revised before landing.

---

## 7. Cross-repo differences (what this doc does **not** cover)

Every app is a single-activity variant of the pattern above. The
per-app differences — what is shared with the suite, what is
trimmed, and what is intentionally different — are documented in
each repo's `technical.md` § "Other apps of the suite: real
differences" (the project-specific delta). Use that section to
decide whether a deviation in one repo is intentional before
copying it to another.

The canonical source for this pattern lives **in this file**, in
every repo of the suite, kept in sync. If you change it in one
repo, mirror it across the others in the same PR.

---

## See also

- [`technical.md`](technical.md) — Teclatlon-specific recipes and
  contracts that build on this pattern.
- [`I18N.md`](I18N.md) — how to add a new language while keeping
  the i18n invariants intact.
- [`CLOUDFLARE.md`](../../CLOUDFLARE.md) — deploy and SW/header
  contracts at the Cloudflare Workers level.
- [`SPEC.md`](SPEC.md) §"Mandatory rule" — the accessibility and
  no-clinical-mention invariants every page must respect.
