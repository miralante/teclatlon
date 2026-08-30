# Quick guide

> 🌐 **Other language:** [Español](../es/guia-rapida.md)

This guide explains step by step how to use Teclatlon: from opening
it to practising on the home grid, switching language or installing
it on your computer. It also includes **four ways to open the app**,
ordered from easiest to hardest.

> 📦 The detailed step-by-step version (with the full PWA install
> walkthrough and a complete troubleshooting section) lives in the
> canonical cross-suite guide:
> [`routime/doc/en/quick-guide.md`](https://github.com/thenkdframe/routime/blob/main/doc/en/quick-guide.md).
> The **opening flow, PWA install, language switcher and
> troubleshooting are identical** across the Apptonomia-sibling
> projects. This document only lists what's specific to Teclatlon
> (mostly: computer keyboard only, no mobile).

---

## 1. How to open Teclatlon

There are **four ways**, ordered from easiest to hardest. The full
walkthrough is in the canonical guide linked above. The short
version:

| # | Method | What you need | Offline? | PWA installable? |
|---|---|---|---|---|
| **A** | From the internet ([teclatlon.apptonomia.uk](https://teclatlon.apptonomia.uk)) | A computer + physical keyboard | ❌ | ✅ |
| **B** | Downloading the ZIP from GitHub | A computer + physical keyboard | ❌ | ❌ |
| **C** | Local server with Python | Python 3 + physical keyboard | ❌ | ✅ |
| **D** | Local server with Node.js | Node.js + physical keyboard | ✅ | ✅ |

> ⚠️ **Teclatlon does not work on a phone or tablet.** If you open
> it on a mobile device, you'll see a full-screen notice explaining
> why. This is deliberate — see [`SPEC.md`](SPEC.md) §2.
>
> 💡 If you just want to **try the app**, use method **A** or **B**.
> For the **full experience** (PWA, offline mode, "Install"), use
> **C** or **D**.

---

## 2. The main screen

The home screen shows the **modes grid** — six practice modes
(finger placement, letters, words, numbers, all keys, free
writing). Tap any mode to open it. See [`activities.md`](activities.md)
§1 for the full list and what each mode trains.

## 3. Inside a mode

- **Finger placement** shows the keyboard with the home-row anchors
  highlighted and a hand guide. Press each anchor on the physical
  keyboard; the highlight follows.
- **Letters** opens a fixed sequence of lessons. Each lesson is 4–8
  keys. The next key is highlighted on the on-screen keyboard.
- **Words** picks words from the word list (and your own name, if
  set) and asks you to type them.
- **Numbers** is the number-pad game; the home position is the right
  hand on `4-5-6` / `7-8-9`.
- **All keys** is a single short passage that uses the **complete**
  keyboard of the active layout.
- **Free writing** lets you type anything; the app can read it
  aloud.

## 4. The on-screen keyboard is decorative

The on-screen keyboard is **always** `pointer-events: none`. It
shows you which key to press next, but **the only real input is the
physical keyboard**. There is no tappable mobile-keyboard mode (see
[`SPEC.md`](SPEC.md) §2). Don't try to click the on-screen keys —
they are there for visual guidance.

## 5. Response messages

Correct key → key marks as typed; wrong key → a brief shake of the
on-screen key, a friendly encouraging message, and you keep going.
There is **no timer, no score, no game over** (see
[`SPEC.md`](SPEC.md) §3.2). Mistakes never deduct progress.

## 6. Adding your own name

From the home screen (or in the **words** mode), open the settings
panel and type your name. Your name is merged into the **words**
mode rotation, in **localStorage** only. Removing it is one click
in the same panel.

## 7. Progress

Per-key progress is shown as a calm chart in **settings**. There
are no stars, no levels, no leaderboards. Resetting progress is
destructive and requires confirmation.

## 8. Changing language

Open the language menu from the header (globe icon 🌐). Available:
**Spanish (default)** and **English**. Each language has its own
keyboard layout and its own word list. See
[`I18N.md`](I18N.md) for how to add a new locale.

## 9. Personal settings

Open `/settings`. From there:

- Add or remove your **own name** (used by the **words** mode).
- View the **per-key progress** chart.
- Reset progress (with a confirmation prompt, since it's
  destructive).
- Manage the audio and reduced-motion preferences.

## 10. Install the app on your computer

The full steps (Chromium / Firefox / WebKit) are in the canonical
guide. Short version: open Teclatlon in the browser, choose
"Install" / "Add to home screen", confirm.

## 11. Troubleshooting

See **§11 Troubleshooting** in the canonical guide — those items
apply identically to Teclatlon. Two Teclatlon-specific items:

- **"Nothing happens when I tap a key on the screen"** — the
  on-screen keyboard is decorative. Use the **physical** keyboard.
- **"I see the full-screen mobile notice on my desktop"** — your
  browser window is too narrow. Resize to ≥ 720 px wide; the gate
  was designed to catch phones, but a tiny desktop window can also
  trigger it.

## 12. More help

- Product: [`SPEC.md`](SPEC.md).
- Architecture: [`technical.md`](technical.md).
- Modes and lessons catalogue: [`activities.md`](activities.md).
- For families and teachers: [`team.md`](team.md).

## 13. Quick summary

1. Open Teclatlon on a **computer with a physical keyboard** (4
   methods; easiest is **A**).
2. Pick a mode on the home grid (start with **finger placement**
   if you're new).
3. Type the highlighted key on the **physical** keyboard.
4. Earn per-key progress; no failure, no punishment.
5. Switch language with 🌐; install as PWA for offline use.
