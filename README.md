# Teclatlon

> 🌐 **Other languages:** [Español](README.es.md)

A free, static, dependency-free touch-typing trainer for the **computer
keyboard**. Learn finger placement, go through letter-by-letter lessons,
practice words, the number pad, and free writing — with a decorative
on-screen keyboard that mirrors your physical one. No accounts, no
cookies, no analytics: everything runs in the browser and progress is
saved only in `localStorage`, on your own device.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![No dependencies](https://img.shields.io/badge/dependencies-none-success.svg)](#-features)
[![Static site](https://img.shields.io/badge/build-none-informational.svg)](#-quick-start)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8.svg)](manifest.json)
[![i18n](https://img.shields.io/badge/i18n-es%20%7C%20en-yellow.svg)](README.es.md)
[![CI](https://img.shields.io/badge/CI-node%20scripts%2Fcheck.js-blue.svg)](.github/workflows/validate.yml)

---

## 🚀 Live demo

The app is deployed as a static site on **Cloudflare Workers (static
assets)**. The `<project-name>.<account-subdomain>.workers.dev`
address is assigned by Cloudflare from the project name declared in
the Cloudflare dashboard — it is not committed to the repo. See
[`CLOUDFLARE.md`](CLOUDFLARE.md) for the rationale.

> Live URL: <https://teclatlon.miralante.workers.dev>
> (or the custom domain, if one is configured).

The site is a Progressive Web App: on first visit, the browser can
install it to the home screen / dock and use it offline.

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

### Validate

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

### Deploy

Deployment is owned by the **Cloudflare Workers** Git connector — see
[`CLOUDFLARE.md`](CLOUDFLARE.md) for the full rationale (build
settings, why `wrangler.toml` exists, why no `_redirects`, why no
`package.json`). The repo ships a minimal [`wrangler.toml`](wrangler.toml)
(static-assets binding and 404 handling) and no other deploy-side
configuration files.

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

---

## 🧩 Sibling projects

This project is one of a small group of sibling projects that share
the same author, the same accessibility-first / no-backend philosophy
and the same deploy story. **Apptonomia is the main project**; the
others (Calculia, Okeymoney, Sinonimia, Teclatlon) were spun out of
it or built next to it on the same stack.

| Project | What it is | Repository |
|---|---|---|
| **Apptonomia** *(main)* | Occupational therapy: 7 modules, 69 activities | [github.com/miralante/apptonomia](https://github.com/miralante/apptonomia) |
| Calculia | Math and logical reasoning: 12 activities | [github.com/miralante/calculia](https://github.com/miralante/calculia) |
| Okeymoney | Personal finance and everyday autonomy | [github.com/miralante/okeymoney](https://github.com/miralante/okeymoney) |
| Sinonimia | Plain-language dictionary (easy-read) | [github.com/miralante/sinonimia](https://github.com/miralante/sinonimia) |
| Teclatlon | Touch-typing with a physical keyboard | [github.com/miralante/teclatlon](https://github.com/miralante/teclatlon) |

The canonical Cloudflare / deploy guide for the group lives in
[Apptonomia's `CLOUDFLARE.md`](https://github.com/miralante/apptonomia/blob/master/CLOUDFLARE.md).
This repo's own [`CLOUDFLARE.md`](CLOUDFLARE.md) is the project-specific
superset of that guide.

---

## 📄 License

MIT — see [`LICENSE`](LICENSE).

Copyright (c) 2026 Teclatlon contributors.
