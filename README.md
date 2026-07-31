# Teclatlon

> 🌐 **Other languages:** [Español](README.es.md)

A free, static, dependency-free touch-typing trainer for the **computer
keyboard**. Learn finger placement, go through letter-by-letter lessons,
practice words, the number pad, and free writing — with a decorative
on-screen keyboard that mirrors your physical one. No accounts, no
cookies, no analytics: everything runs in the browser and progress is
saved only in `localStorage`, on your own device.

- 💻 **Run locally**: open `index.html` directly in a browser, or serve
  the folder with any static server (`npx serve .` / `python -m http.server 8080`)
  for the full offline-capable PWA experience.

---

## 📚 Documentation

| Topic | Document |
|---|---|
| Product, audience, accessibility rules | [`doc/en/SPEC.md`](doc/en/SPEC.md) · [`doc/es/SPEC.md`](doc/es/SPEC.md) |
| Architecture and technical reference | [`doc/en/technical.md`](doc/en/technical.md) · [`doc/es/tecnico.md`](doc/es/tecnico.md) |
| AI agent operational workflow | [`CLAUDE.md`](CLAUDE.md) |

Project history lives in `git log`; no external roadmap is maintained.

---

## ✅ Validate

```bash
node scripts/check.js
```

No `npm install` needed — the script only uses Node's standard library.

---

## 📄 License

MIT — see [`LICENSE`](LICENSE).
