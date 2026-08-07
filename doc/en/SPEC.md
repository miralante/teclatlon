# Product specification

> Canonical source for product scope, audience and non-negotiable rules.
> Technical architecture lives in [`technical.md`](technical.md).

## 1. What Teclatlon is

A free, static, single-purpose web app that teaches touch-typing on the
**physical computer keyboard**: finger placement, letter-by-letter lessons
in a fixed order, a words game (including the person's own name), a
number-pad game, an "all keys" challenge, and a free-writing mode that
reads back what was typed.

Teclatlon is part of Apptonomia, a broader occupational-therapy
activity suite, where this used to be one activity among many. It keeps
Apptonomia's accessibility-first design language (Easy Reading, no
pressure, high contrast, large touch targets) because that design also
serves anyone learning to type for the first time — not only the
audience Apptonomia was built for.

## 2. Audience

Anyone learning to type on a computer keyboard: children, beginners, and
in particular people who benefit from Easy Reading, no-pressure pacing
and predictable, uncluttered screens. Usable **autonomously**, without a
teacher or family member sitting next to the learner.

**Computer only.** There is no touch/tap input mode. The on-screen
keyboard is always decorative (`pointer-events: none`); the only real
input is a physical keyboard. Do not add a tappable mobile-keyboard mode
back — that scope was deliberately dropped when this project was split
out of Apptonomia. If the page is opened on a phone or tablet, the app
shows a full-screen notice explaining that a physical keyboard is
needed and why the on-screen keyboard cannot be tapped (see
[`technical.md` §2.5](technical.md)).

## 3. Non-negotiable principles

1. **Autonomy** — usable without a professional or family member present.
2. **No pressure** — no timers, no negative scoring, no "game over".
   Mistakes get an encouraging message and unlimited retries.
3. **Privacy** — no login, no cookies, no analytics, no server. The only
   persisted data (progress, optional name) lives in this browser's
   `localStorage` and never leaves the device. See [`legal/`](../../legal/index.html).
4. **Easy Reading** — short sentences, one idea per sentence, plain
   language, no clinical or technical jargon in anything the learner reads.
5. **Accessibility** — buttons ≥ 64×64 px, spacing ≥ 16 px, WCAG AA
   contrast, full keyboard navigation, ARIA on icon buttons and feedback
   zones, respects `prefers-reduced-motion`.
6. **Sober technology** — HTML5 + CSS3 + vanilla JavaScript, no
   frameworks, no build step, no npm dependencies, offline-first PWA.
7. **Full-keyboard proficiency** — every activity practices with the
   *complete* keyboard of the currently selected layout (every letter,
   every number when the layout shows them, the space bar, and the
   numpad when it's visible). The goal is for the learner to reach
   genuine touch-typing skill and improve their neuromotor accuracy
   and speed across the whole keyboard, not just the home row or the
   letters introduced in a single lesson. Per-activity design choices
   (placement, step-by-step lessons, words, numbers, all-keys
   challenge, free writing) must add up to that coverage; a lesson
   that only ever drills the new letters it introduces is incomplete.
   See [`technical.md` §"Sequence-game engine"](../technical.md) for
   the runtime hook (`buildLessonReview` in `app.js`) that appends a
   review step at the end of each lesson so the accumulated coverage
   is enforced at play time.

## 4. Mandatory rule: zero mentions in the user-facing product

**No text the end user sees may mention, directly or indirectly,
intellectual disability, occupational therapy, minors, children, or
equivalent expressions** ("cognitive difficulties", "special needs",
"different abilities", "underage", etc.). This includes everything
visible in the interface: `index.html`, `app.js`, `data.js`,
`strings.<locale>.js`, and `legal/`. The reason is exactly the one
from §1 and §2: that nobody who uses the app feels singled out,
inferior, or discriminated against by what the app itself says about
them.

Where it applies and where it doesn't:

- **It applies** to everything the end user sees: titles, meta
  descriptions, buttons, labels, messages, icon alt text, footers.
- **It doesn't apply** to the project's internal documentation (this
  document, `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`): those files
  are read by whoever maintains or contributes to the project, not by
  the end user, and that's exactly where the product's real objective
  must be explained (see §2 and §3).

This rule is checked automatically: `node scripts/check.js` fails if
any of those terms show up in the files the end user sees.

## 5. Accessibility rules (mandatory for any UI change)

1. Easy Reading: short sentences, one idea per sentence.
2. Buttons ≥ 64×64 px, spacing ≥ 16 px.
3. High contrast (WCAG AA minimum).
4. Audio only where the activity design calls for it (🔊 button +
   `App.tts.speak()`), not a blanket rule for every text.
5. No pressure: no timers, negative scoring, or "game over".
6. Positive reinforcement on success: `App.feedback.success()`.
7. Respect `prefers-reduced-motion`.
8. Complete keyboard navigation.
9. ARIA on icon buttons and feedback zones.
10. Maximum 4–6 options per screen.
11. Socratic pacing on mistakes: encouragement, never punishment
    (`App.feedback.encourage()`), unlimited retries.
12. Gradual progression: each lesson changes only one variable at a time.

## 5.1 Accessibility & game settings panel (mandatory)

Every configuration lives in `state.options` (localStorage) and is
applied at startup (`applyOptions()` in `app.js`). Everything is off
by default: each person decides what helps them.

The panel is a lateral drawer (`#settingsDrawer`), opened from a gear
icon (`#btnOpenSettings`) in the header — reachable from every screen,
not just at first run. It closes via its own close button, a click on
the backdrop, or <kbd>Escape</kbd>, and traps <kbd>Tab</kbd> focus while
open (see [`technical.md` §2.2](technical.md)).

- **Text size**: `small` (18 px), `normal` (20 px), `large` (24 px),
  `huge` (30 px). Adjusts the `--texto-base` variable.
- **Theme**: `light` (default), `auto` (follows `prefers-color-scheme`),
  `dark`, `contrast` (forced high contrast for low vision).
- **Focus mode**: hides the hand guide and the keyboard legend. The
  visual keyboard with the highlighted target key stays: it is the
  primary cue of the exercise.
- **Spatial sound**: pans the success tone by the column of the key
  (StereoPannerNode). Off by default to avoid noise.
- **Vibration**: removed. `navigator.vibrate()` only fires on touch
  devices, and Teclatlon is computer-only (see §2).
- **Dyslexia-friendly font**: removed. No font was bundled and the
  toggle fell back silently (Atkinson Hyperlegible is already the
  legible default).
- **Metrics**: live accuracy (%) and PPM during the game. Off by
  default. The product has not finalised the exact definition yet;
  the toggle stays visible and off.

See `legal/index.html` for the exact data items saved.

## 5. Gamification (no pressure)

- **Stars**: one per lesson or mode completed for the first time.
- **Badges**: 7 unlockables (first lesson, position, words, numbers,
  all the keys, free writing, accuracy ≥ 90 %). Shown as cards in
  the menu. A short banner appears when a new one is unlocked.
- **Avatars**: removed. The avatar picker was not implemented (the
  grid rendered empty) and is not part of the product.

## 6. Language policy

The UI is **multilingual**: by default the app ships in Spanish and
English (`es`/`en`), which form the **base pair** and between which key
parity and translation are maintained on every product change. `es` is
the default and the **source of truth** when a key is missing in another
language. The **i18n architecture (`App.i18n`) is designed to support N
languages** — how to register a new language, the binary `es`/`en`
spots that must be generalized first, and the step-by-step recipe live
in [`I18N.md`](I18N.md), which should be read alongside this `SPEC.md`
and [`technical.md`](technical.md).

Rules that apply in **every** supported language, not only in `es`/`en`:

- **Multilingual UI**: every user-visible text exists in each supported
  language. Product content changes (lessons, words, UI copy) must ship
  in the base pair `es`/`en` and, if a third language is being
  translated, in that language too — a key is never left without its
  translated equivalent in every activated locale.
- **Technical code is always English**: identifiers, comments, commit
  messages and — **crucially** — the keys of `strings.<locale>.js` are
  in English. Only the values are translatable UI text. This separation
  keeps `App.i18n.t('lessonName')` readable in source code regardless
  of the active language.
- **The Easy Reading and accessibility rules (SPEC §3–§4) apply in every
  language**: each translation is written for the learner, not as a
  literal translation of the Spanish version.
