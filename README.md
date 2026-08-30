# Teclatlon ⌨️

> 🌐 **Other languages:** [Español](README.es.md)
>
> 🚀 **Try it live:** <https://teclatlon.miralante.workers.dev>

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![No dependencies](https://img.shields.io/badge/dependencies-none-success.svg)](#-features)
[![Static site](https://img.shields.io/badge/build-none-informational.svg)](#-quick-start)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8.svg)](manifest.json)
[![i18n](https://img.shields.io/badge/i18n-es%20%7C%20en-yellow.svg)](#-documentation)
[![CI](https://img.shields.io/badge/CI-node%20scripts%2Fcheck.js-blue.svg)](.github/workflows/validate.yml)

A free, static, dependency-free touch-typing trainer for the **computer
keyboard**. Learn finger placement, go through letter-by-letter lessons,
practice words, the number pad, and free writing — with a decorative
on-screen keyboard that mirrors your physical one. No accounts, no
cookies, no analytics: everything runs in the browser and progress is
saved only in `localStorage`, on your own device.

---

## 🚀 Try it live

The app is deployed as a static site on **Cloudflare Workers (static
assets)** at **<https://teclatlon.miralante.workers.dev>** (or the
custom domain, if one is configured). The site is a Progressive Web
App: on first visit, the browser can install it to the home screen /
dock and use it offline.

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

---

## 🧹 Housekeeping

There is no `node_modules` and no build artifacts in this repo. To
clean the local PWA cache during development, unregister the service
worker from DevTools (`Application → Service workers → Unregister`)
and clear site data. Teclatlon's SW is network-first, so a hard
refresh picks up new code immediately on a good connection — the
cache only matters for offline use.

The `data.js` file is large (it carries all three locale-split
practice arrays); do not split it into per-locale files without
updating the i18n architecture — see [`doc/en/I18N.md`](doc/en/I18N.md)
for the recipe.

---

## 🙏 Credits

Teclatlon was split out of a sibling project (Apptonomia, a broader
occupational-therapy activity suite) where this used to be one
activity among many, including a tappable mobile-keyboard mode that
was deliberately dropped here. **Teclatlon targets the computer
keyboard only** — the on-screen keyboard is decorative; the real
input is always the physical keyboard.

The finger/hand colour system and the home-row guides are derived
from standard touch-typing pedagogy, simplified for a single-screen
experience.

---

## 👥 Roles in the project

| Role | Who they are | How they participate | Where they look first |
|---|---|---|---|
| 👤 **End user** (typical user profile) | Practices typing with the physical keyboard | Opens the app in a browser and types on the **physical** keyboard; the on-screen keyboard is decorative only | The app |
| ❤️ **Support / family / teacher** | Helps an end user set up or progress through lessons | Sets the learner name in the words game; supervises progress via stars ⭐ | [`CONTRIBUTING.md`](CONTRIBUTING.md) (the "Support" section) |
| 💻 **Build / developer** | Maintains the keyboard layouts, lessons, and the SW | Edits `data.js`, `app.js`, `sw.js`, `strings.<locale>.js`; runs `node scripts/check.js` | [`CLAUDE.md`](CLAUDE.md) |

For the full role description in context (with the rest of the
sibling suite), see [`CLAUDE.md`](CLAUDE.md).

---

## 📚 Project documentation (bilingual)

| Language | Entry point |
|---|---|
| 🇬🇧 English (this file) | [`README.md`](README.md) |
| 🇪🇸 Español | [`README.es.md`](README.es.md) |

| Topic | Document |
|---|---|
| Product, audience, accessibility rules | [`doc/en/SPEC.md`](doc/en/SPEC.md) |
| Architecture and technical reference | [`doc/en/technical.md`](doc/en/technical.md) |
| AI agent operational workflow | [`CLAUDE.md`](CLAUDE.md) |
| Cloudflare Workers deployment notes | [`CLOUDFLARE.md`](CLOUDFLARE.md) |

Project history lives in `git log`; no external roadmap is maintained.

---

## ✨ Features

- 🖐️ **Finger placement** — visual home-row guides with a coloured
  finger/hand map, persisted per session.
- 📚 **Letter-by-letter lessons** — a fixed, scaffolding order that
  unlocks the next key once the previous one is mastered.
- 🔤 **Words game** — random words plus a slot for the learner's own
  name.
- 🔢 **Number-pad game** — for the right-hand numeric keypad.
- 🎯 **All-keys challenge** — mixed full-keyboard test.
- ✍️ **Free writing** — text-to-speech reads back what was typed.
- 🔒 **Private by default** — no accounts, no cookies, no analytics:
  all progress lives in `localStorage` on the user's device.
- 🌐 **Bilingual** — UI in Spanish (default) and English.
- 📦 **Offline-capable** — installable PWA with a service worker
  pre-caching the shell (`sw.js`).
- 🪶 **Zero runtime dependencies** — pure HTML/CSS/JS, no build step.

---

## 🚀 Quick start

### Run locally

```bash
# any of these serves the folder as a static site
npx serve .
# or
python -m http.server 8080
# or just open index.html in a browser
```

No `npm install`, no build step. The full PWA experience (service
worker, offline cache, install prompt) requires being served over
`http://` or `https://` — opening `index.html` via `file://` works
for the app itself but disables the SW and the install prompt.

---

## ✅ Validating changes

```bash
node scripts/check.js
```

The check is dependency-free (Node stdlib only) and enforces:

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

Deployment is owned by the **Cloudflare Workers** Git connector — see
[`CLOUDFLARE.md`](CLOUDFLARE.md) for the full rationale (build
settings, why `wrangler.toml` exists, why no `_redirects`, why no
`package.json`). The repo ships a minimal [`wrangler.toml`](wrangler.toml)
(static-assets binding and 404 handling) and no other deploy-side
configuration files.

Pull requests automatically get a preview URL — no extra workflow is
needed.

---

## 📚 Documentation

| Topic | Document |
|---|---|
| Product, audience, accessibility rules | [`doc/en/SPEC.md`](doc/en/SPEC.md) |
| Architecture and technical reference | [`doc/en/technical.md`](doc/en/technical.md) |
| AI agent operational workflow | [`CLAUDE.md`](CLAUDE.md) |
| Cloudflare Workers deployment notes | [`CLOUDFLARE.md`](CLOUDFLARE.md) |

Project history lives in `git log`; no external roadmap is maintained.

---

## 🤝 Contributing

Issues and pull requests are welcome. The repo is small and the
[validate workflow](.github/workflows/validate.yml) is the gate: every
PR must pass `node scripts/check.js`.

When changing product content (UI strings, lessons, words)
update **both** `strings.es.js` and `strings.en.js` — `es` is the
default and source of truth. The check script enforces key parity
but not translation quality, so proofread both languages.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) (or
[`CONTRIBUTING.es.md`](CONTRIBUTING.es.md) for the Spanish
version) for the full contribution flow, and the
[issue templates](.github/ISSUE_TEMPLATE/) and
[PR template](.github/PULL_REQUEST_TEMPLATE.md) for the
day-to-day touchpoints.

---

## 🛡️ Security

Teclatlon is a fully client-side static site: it has no server, no
backend, no database and no telemetry. The threat model is
essentially "what a hostile offline page could do to the same
origin", which the browser already sandboxes.

See [`SECURITY.md`](SECURITY.md) (or [`SECURITY.es.md`](SECURITY.es.md)
for the Spanish version) for how to report a suspected issue
privately.

---

## 📚 Documentation

| Topic | Document |
|---|---|
| Product, audience, accessibility rules | [`doc/en/SPEC.md`](doc/en/SPEC.md) |
| Architecture and technical reference | [`doc/en/technical.md`](doc/en/technical.md) |
| AI agent operational workflow | [`CLAUDE.md`](CLAUDE.md) |
| Cloudflare Workers deployment notes | [`CLOUDFLARE.md`](CLOUDFLARE.md) |

Project history lives in `git log`; no external roadmap is maintained.

---

## 🧩 Sibling projects

This project is one of a small group of sibling projects that share
the same author, the same accessibility-first / no-backend philosophy
and the same deploy story. **Apptonomia is the main project**; the
others (Calculia, Okeymoney, Sinonimia, Teclatlon) were spun out of
it or built next to it on the same stack.

| Project | What it is | Repository |
|---|---|---|
| **Apptonomia** *(main)* | Activities for routines and daily-life skills (designed for our typical user profile) | [github.com/miralante/apptonomia](https://github.com/miralante/apptonomia) |
| Calculia | Math and logical reasoning | [github.com/miralante/calculia](https://github.com/miralante/calculia) |
| Memofun | Flashcards built around meaningful learning | [github.com/miralante/memofun](https://github.com/miralante/memofun) |
| Okeymoney | Personal finance and everyday autonomy | [github.com/miralante/okeymoney](https://github.com/miralante/okeymoney) |
| Routime | Activities for routines and daily-life skills | [github.com/miralante/routime](https://github.com/miralante/routime) |
| Sinonimia | Easy-read dictionary | [github.com/miralante/sinonimia](https://github.com/miralante/sinonimia) |
| Teclatlon | Touch-typing with a physical keyboard | [github.com/miralante/teclatlon](https://github.com/miralante/teclatlon) |

The canonical Cloudflare / deploy guide for the group lives in
[Apptonomia's `CLOUDFLARE.md`](https://github.com/miralante/apptonomia/blob/master/CLOUDFLARE.md).
This repo's own [`CLOUDFLARE.md`](CLOUDFLARE.md) is the project-specific
superset of that guide.

---

## 📄 License

MIT — see [`LICENSE`](LICENSE).

Copyright (c) 2026 Teclatlon contributors.
