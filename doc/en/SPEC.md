# Product specification

> Canonical source for product scope, audience and non-negotiable rules.
> Technical architecture lives in [`technical.md`](technical.md).

## 1. What Teclatlon is

A free, static, single-purpose web app that teaches touch-typing on the
**physical computer keyboard**: finger placement, letter-by-letter lessons
in a fixed order, a words game (including the person's own name), a
number-pad game, an "all keys" challenge, and a free-writing mode that
reads back what was typed.

Teclatlon was split out of Apptonomia, a broader occupational-therapy
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
out of Apptonomia.

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

## 4. Accessibility rules (mandatory for any UI change)

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

## 5. Language policy

UI is bilingual (`es`/`en`); `es` is the default and the source of truth
when a key is missing. Product content changes (lessons, words, UI copy)
must ship in both languages — see [`I18N` details in `technical.md`](technical.md).
Code (identifiers, comments, commit messages) is always English.
