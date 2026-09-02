# Teclatlon ⌨️

> 🌐 **Other languages:** [Español](README.es.md)
>
> 🚀 **Try it live:** [teclatlon.apptonomia.uk](https://teclatlon.apptonomia.uk/)

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![No dependencies](https://img.shields.io/badge/dependencies-none-success.svg)](#-features)
[![Static site](https://img.shields.io/badge/build-none-informational.svg)](#-features)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8.svg)](manifest.json)
[![i18n](https://img.shields.io/badge/i18n-es%20%7C%20en-yellow.svg)](#-project-documentation-bilingual)
[![CI](https://img.shields.io/badge/CI-node%20scripts%2Fcheck.js-blue.svg)](.github/workflows/validate.yml)

A free, static, dependency-free touch-typing trainer for the **computer
keyboard**. Learn finger placement, go through letter-by-letter lessons,
practice words, the number pad, and free writing — with a decorative
on-screen keyboard that mirrors your physical one. No accounts, no
cookies, no analytics: everything runs in the browser and progress is
saved only in `localStorage`, on your own device.

- 🌐 **App**: [teclatlon.apptonomia.uk](https://teclatlon.apptonomia.uk/)
- 📦 **Repository**: [github.com/miralante/teclatlon](https://github.com/miralante/teclatlon)
- 💻 **Run locally**: open `index.html` directly in a browser, or serve
  the folder with any static server (`npx serve .` /
  `python -m http.server 8080`) for the full offline-capable PWA
  experience.

---

## 🚀 Try it live

Teclatlon is deployed at **[teclatlon.apptonomia.uk](https://teclatlon.apptonomia.uk/)**
— open it in a browser, install it to the home screen for offline use,
and start a lesson. The on-screen keyboard is decorative; the real
input is always the physical keyboard.

---

## ✨ Features

- 🖐️ **Finger placement** — visual home-row guides with a coloured
  finger/hand map, persisted per session.
- 📚 **Letter-by-letter lessons** — a fixed, scaffolding order that
  unlocks the next key once the previous one is mastered.
- 🔤 **Words game** — random word lists per locale, plus the `name`
  slot for the learner's own name.
- 🔢 **Number-pad game** — for the right-hand numeric keypad.
- 🎯 **All-keys challenge** — mixed full-keyboard test.
- ✍️ **Free writing** — text-to-speech reads back what was typed.
- 🪶 **Zero runtime dependencies** — pure HTML/CSS/JS, no build step.
- 🌐 **Bilingual** — UI in Spanish (default) and English.
- 🔒 **Privacy by default** — no accounts, no cookies, no analytics:
  all progress lives in `localStorage` on the user's device.
- 📦 **Offline-capable PWA** — installable, works without internet.
- 🖐️ **Accessibility** — large hit areas, high contrast, full keyboard
  navigation, `prefers-reduced-motion`, screen-reader compatible.

---

## 👥 Roles in the project

| Role | Who they are | How they participate | Where they look first |
|---|---|---|---|
| 👤 **End user** (typical user profile) | Practices typing with the physical keyboard | Opens the app in a browser and types on the **physical** keyboard; the on-screen keyboard is decorative only | The app |
| ❤️ **Support / family / teacher** | Helps an end user set up or progress through lessons | Sets the learner name in the words game; supervises progress via stars ⭐ | [`CONTRIBUTING.md`](CONTRIBUTING.md) (the "Support" section) |
| 💻 **Build / developer** | Maintains the keyboard layouts, lessons, and the SW | Edits `data.js`, `app.js`, `sw.js`, `strings.<locale>.js`; runs `node scripts/check.js` | [`CLAUDE.md`](CLAUDE.md) |

See [`doc/en/roles.md`](doc/en/roles.md) for the full role description
and the trio-vs-pair-vs-sole patterns across the apps of the suite.

---

## 📚 Project documentation (bilingual)

All project documentation lives in the `doc/` folder:

| Language | Entry point |
|---|---|
| 🇬🇧 English (this file) | [`doc/en/index.md`](doc/en/index.md) |
| 🇪🇸 Español | [`doc/es/indice.md`](doc/es/indice.md) |

By role and profile, the most relevant docs are:

| I am… | Start here |
|---|---|
| 👤 End user or family member | [`doc/en/README.md`](doc/en/README.md) |
| ❤️ Therapist, family, or support professional | [`doc/en/team.md`](doc/en/team.md) |
| 🤔 I want to understand what Teclatlon is and why | [`doc/en/SPEC.md`](doc/en/SPEC.md) |
| 💻 Developer | [`doc/en/technical.md`](doc/en/technical.md) |

### 📄 Other repo documents

| Document | Audience |
|---|---|
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Anyone who wants to contribute (family, therapists, devs) |
| `CLAUDE.md` | AI agents: operational workflow, coordination and approvals |
| [`CLOUDFLARE.md`](CLOUDFLARE.md) | Canonical Cloudflare Workers deploy guide for the suite (Teclatlon + Apptonomia + Calculia, Memofun, Okeymoney, Sinonimia) |
| Project history | Lives in `git log`; no external roadmap is maintained |
| `doc/en/I18N.md` / `doc/es/I18N.md` | Details of the ES/EN multilanguage system |

---

## 🛠️ Preparing / Expanding content

Teclatlon is a single-activity app, so "preparing content" means
editing one of three locale-split arrays in `data.js`:

- **`LESSONS`** — the fixed, scaffolding order of letters
  (`lesson-01-homerow` through `lesson-NN-extra-keys`). Each
  lesson unlocks the next once the previous is mastered.
- **`WORDS`** — random word lists per locale, plus the `name` slot
  for the learner's own name.
- **`NUMPAD`** — number-pad practice steps for the right-hand
  numeric keypad.

To add a new lesson:

1. Edit the `LESSONS` array in `data.js` (Spanish) and the `LESSONS`
   array in the English mirror section.
2. Update the `progress.json` shape if your lesson introduces a new
   practice step type — see [`doc/en/technical.md`](doc/en/technical.md)
   §"Sequence-game engine" for the runtime hook that appends a
   review step at the end of every lesson.
3. Update `strings.es.js` and `strings.en.js` if your lesson adds
   new user-facing copy (lesson title, instruction, feedback).
4. Bump `VERSION` in `sw.js` (the network-first SW serves the cache
   only when offline — bump liberally).

The `data.js` file is large (it carries all three locale-split
practice arrays); do not split it into per-locale files without
updating the i18n architecture — see [`doc/en/I18N.md`](doc/en/I18N.md)
for the recipe.

---

## ✅ Validating changes

```bash
node scripts/check.js
```

No `npm install` needed — the script only uses Node's standard library.
It checks:

- JS syntax across the app and the PWA shell.
- `es` ↔ `en` key parity in `strings.es.js` / `strings.en.js` and
  in `legal/`.
- That every path in `sw.js` `FILES` exists on disk.
- That every icon in `manifest.json` exists.
- That `_headers`' CSP source expressions are quoted correctly (e.g.
  `'self'`, not `''self''`).

It is the only "test" step and runs on every push and PR via
[`.github/workflows/validate.yml`](.github/workflows/validate.yml).

---

## ☁️ Deploying

Teclatlon is a fully static site (HTML/CSS/JS, no build step), so it
ships directly to **[Cloudflare Workers (static assets)](https://developers.cloudflare.com/workers/static-assets/)**
through its built-in GitHub integration. The HTTP security headers
live in [`_headers`](_headers), and the project metadata in
[`wrangler.toml`](wrangler.toml). See [`CLOUDFLARE.md`](CLOUDFLARE.md)
for the full runbook (rebuild, rollback, custom domain, credential
rotation).

Pull requests automatically get a preview URL on
`*.<account-subdomain>.workers.dev` — no extra workflow is needed.

---

## 🛡️ Security

Teclatlon is a fully client-side static site: it has no server, no
backend, no database and no telemetry. The threat model is essentially
"what a hostile offline page could do to the same origin", which the
browser already sandboxes.

See [`SECURITY.md`](SECURITY.md) (or [`SECURITY.es.md`](SECURITY.es.md))
for how to report a suspected issue privately.

---

## 📄 License

MIT — see [`LICENSE`](LICENSE).

Copyright (c) 2026 Teclatlon contributors.

---

## 🧹 Housekeeping

There is no `node_modules` and no build artifacts in this repo. To
clean the local PWA cache during development, unregister the service
worker from DevTools (`Application → Service workers → Unregister`)
and clear site data. Teclatlon's SW is network-first, so a hard
refresh picks up new code immediately on a good connection — the
cache only matters for offline use.

---

## 🙏 Credits

Teclatlon was split out of another app of the suite (Apptonomia, a broader
occupational-therapy activity suite) where this used to be one
activity among many, including a tappable mobile-keyboard mode that
was deliberately dropped here. **Teclatlon targets the computer
keyboard only** — the on-screen keyboard is decorative; the real
input is always the physical keyboard.

The finger/hand colour system and the home-row guides are derived
from standard touch-typing pedagogy, simplified for a single-screen
experience.

---

## 🌐 The Miralante suite — projects in the suite

Teclatlon is one of **six apps** in the **Miralante** suite, sharing
the same author, the same accessibility-first / no-backend philosophy
and the same deploy story. Apptonomia, on top of being an app itself,
also acts as the **landing portal** that introduces the whole suite.
None of the seven repos is the "main" one — they are peers; this is
just the original product this group grew out of.

| Project | What it is | Repository |
|---|---|---|
| **Apptonomia** *(portal — landing only, no app)* | Landing page that introduces the Miralante suite (not a runtime app) | [github.com/miralante/apptonomia](https://github.com/miralante/apptonomia) |
| [Calculia](https://calculia.apptonomia.uk/) | Math and logical reasoning | [github.com/miralante/calculia](https://github.com/miralante/calculia) |
| [Memofun](https://memofun.apptonomia.uk/) | Flashcards built around meaningful learning | [github.com/miralante/memofun](https://github.com/miralante/memofun) |
| [Okeymoney](https://okeymoney.apptonomia.uk/) | Personal finance and everyday autonomy | [github.com/miralante/okeymoney](https://github.com/miralante/okeymoney) |
| [Routime](https://routime.apptonomia.uk/) | Activities for routines and daily-life skills | [github.com/miralante/routime](https://github.com/miralante/routime) |
| [Sinonimia](https://sinonimia.apptonomia.uk/) | Easy-read dictionary | [github.com/miralante/sinonimia](https://github.com/miralante/sinonimia) |
| [Teclatlon](https://teclatlon.apptonomia.uk/) | Touch-typing with a physical keyboard | [github.com/miralante/teclatlon](https://github.com/miralante/teclatlon) |

The canonical Cloudflare / deploy guide for the group lives in
[Apptonomia's `CLOUDFLARE.md`](https://github.com/miralante/apptonomia/blob/master/CLOUDFLARE.md).
This repo uses the **Workers + static assets** model (`wrangler.toml`
+ `[assets]`), which is a different shape than
Apptonomia/Teclatlon's classic Pages model — see [`CLOUDFLARE.md`](CLOUDFLARE.md)
for the local runbook.

## More about this project

