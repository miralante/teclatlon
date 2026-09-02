# Project roles

Teclatlon has **three differentiated roles**, same as the rest of the
apps of the Miralante suite (Apptonomia, Calculia, Memofun, Okeymoney,
Sinonimia):

| Role | Who they are | How they participate | Where they look first |
|---|---|---|---|
| 👤 **End user** (anyone learning to type on a computer keyboard, and in particular people who benefit from Easy Reading) | Practices the lessons with the physical keyboard | Opens `index.html` in a browser and types on the **physical** keyboard. The on-screen keyboard is decorative only. **Doesn't read code**. | The app — nothing else to read |
| ❤️ **Support**: family, teacher, therapist | Sets the learner up and supervises progress | Sets the learner name in the words game (the `name` slot in `data.js`'s `WORDS`); supervises progress via the stars ⭐ in the embedded progress view. | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) (the "Support" section) |
| 💻 **Build**: developer | Maintains the keyboard layouts, lessons, and the SW | Edits `data.js` (the `LESSONS`, `WORDS`, `NUMPAD` arrays), `app.js`, `sw.js`, and `strings.<locale>.js`; runs [`scripts/check.js`](../../scripts/check.js), bumps `VERSION` in `sw.js`, and deploys. | [`CLAUDE.md`](../../CLAUDE.md) · [`technical.md`](technical.md) |

> 💡 The end user is always someone who benefits from Easy Reading,
> no-pressure pacing, and uncluttered screens — see [`SPEC.md`](SPEC.md)
> §2. Content, language and interface decisions are made with their
> experience in mind. What stays outside their participation is purely
> technical decisions (the lesson sequence, the `progress.json` shape,
> GitHub) — not because they are excluded, but because this is the
> support/build domain.

## Where to start, by profile

| If you are… | Start with… |
|---|---|
| 👤 End user or direct family member | The app — nothing technical to read |
| ❤️ Family/teacher setting up the learner name and supervising progress | [`README.md`](../../README.md) (the "Preparing / Expanding content" section) |
| ❤️ Support person reporting a missing lesson or unclear wording | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) (the "Support" section) |
| 🤔 Just want to understand what Teclatlon is | [`README.md`](../../README.md) |
| 💻 Developer | [`CLAUDE.md`](../../CLAUDE.md) · [`technical.md`](technical.md) |

## 🤝 A small, focused project

Unlike a multi-team product, Teclatlon is intentionally small: one
single-activity app, one lesson sequence in `data.js`, one PWA shell,
no backend. The **support** role is narrow on purpose — Teclatlon is
designed to be used alone, on the physical keyboard, once the learner
name is set; the **support** person helps at setup and supervises
progress, but doesn't sit beside the learner during each lesson. The
three roles are documented separately so that whoever joins the project
knows what the project expects from them, not because they have to be
done by three different people.
