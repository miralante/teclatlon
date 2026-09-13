# Teclatlon

**Web application that teaches touch typing on the physical computer keyboard — finger by finger, in a fixed lesson order, with a words game, a number-pad game, an all-keys challenge and a free-writing mode.**

---

## What is Teclatlon?

Teclatlon is a digital tool for practising touch typing on the physical computer keyboard, in the browser, free of charge. It is **computer-only** — there is no touch or tap input. The on-screen keyboard is decorative; the real input is always the physical keyboard.

The app is a **single-purpose trainer**: one app, one activity, several practice modes. The complete mode list and the lesson order live in [`activities.md`](activities.md).

---

## Key features

### ✅ Designed for autonomy

- **No pressure**: no timers, no negative scores, no punishment
- **Fixed lesson order** — letters unlock as you master them; you can also pick any mode at any time
- **Positive reinforcement**: celebrates correct typing with friendly sounds and animations
- **Easy Reading**: short sentences, everyday vocabulary, one idea per screen

### ✅ Accessible to everyone

- **Visible hand and finger colours** — the on-screen keyboard shows which finger should press which key, with the home-row anchors always highlighted
- **Large text** in a clear readable font (Atkinson Hyperlegible)
- **High contrast** and visible focus rings
- **Audio where it adds value**: the free-writing mode reads back what you typed, so you can hear your own text

### ✅ Privacy by default

No accounts, no cookies, no analytics. All your progress lives in `localStorage` on your own device. You can clear it at any time with the **🗑️ Delete my progress** button on the home screen.

### ✅ In two languages

- 🇪🇸 **Español** (default)
- 🇬🇧 **English** (can be changed from the menu)

---

## Getting started

### 1. Open the app on a computer

Visit **[teclatlon.apptonomia.uk](https://teclatlon.apptonomia.uk)** from any modern browser on a computer with a physical keyboard. The app does not work on phones or tablets.

### 2. Place your fingers on the home row

Look at the on-screen keyboard. The two small bumps on the **F** and **J** keys are your anchors — your left index goes on **F**, your right index goes on **J**. The colours on the on-screen keyboard match the colour of the finger that should press each key.

### 3. Pick a mode

Start with **🖐️ Finger placement** to learn the home-row anchors, then move to **🔤 Letters** to follow the fixed lesson order, then try **🔤 Words** with random word lists, the **🔢 Numbers** game for the number pad, **🎯 All keys** for a mixed full-keyboard test, and **✍️ Free writing** to type anything you like.

### 4. Type on the physical keyboard

Always. The on-screen keyboard only mirrors your physical keyboard — it is never tappable.

### 5. Change language

Tap the language button (🇪🇸 or 🇬🇧) at the top of the screen.

---

## Example of use

Imagine you are starting from scratch. You open **🖐️ Finger placement** and place your left index on **F** and your right index on **J**. The screen asks you to press **F** — you press it on the physical keyboard, the on-screen **F** lights up green. Then **J** — same thing. Then **D**, **K**, **S**, **L**, **A**, **Ñ/;** — the home row. After that you open **🔤 Letters** and the next lesson starts.

---

## Featured practice modes

### 🖐️ Finger placement

The home-row anchors (F and J) and the hand-finger map. This is where you start; everything else builds on the muscle memory you build here.

### 🔤 Letters

Letter-by-letter lessons in the **fixed order** defined in `data.js` — home row left, home row right, top row, bottom row, numbers. A lesson unlocks the next one once the current one is mastered. The order is intentionally **the same for Spanish and English**, so progress is comparable across languages.

### 🔤 Words

Word typing with random word lists per locale. There is also a `name` slot — if the learner wants to type their own name, that goes in here.

### 🔢 Numbers (number-pad game)

Number-pad practice with the right-hand home position. Useful if you work with spreadsheets or point-of-sale systems.

### 🎯 All keys

Mixed practice that exercises the **complete** keyboard of the currently selected layout — every letter, every number when the layout shows them, the space bar, and every punctuation key.

### ✍️ Free writing

Free text. Type anything you want; the app reads it back to you out loud when you press the 🔊 button. Useful for practising longer pieces without the structure of a lesson.

---

## More information

- [Quick guide](quick-guide.md) — Step by step (four ways to open Teclatlon)
- [Mode and lesson catalogue](activities.md) — Complete list of modes and the lesson sequence
- [Guide for families and teachers](team.md) — How to use Teclatlon in therapy or at school
- [Technical information](technical.md) — For developers

---

## Credits and licence

Teclatlon is an open source project, distributed under the MIT licence.

The on-screen keyboard uses standard system emojis and the **QWERTY** / **QWERTY ES** layouts declared in `data.js`. It is a visual aid, never an input device — the real input is always the physical keyboard.
