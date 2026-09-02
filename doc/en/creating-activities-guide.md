# Guide to creating activities

> **How to design and add new lessons, words and modes to Teclatlon,
> applying the product rules in [`SPEC.md`](SPEC.md) §3, the
> accessibility rules in [`technical.md`](technical.md), the
> technical recipe in §"Lessons", and a set of **didactic**,
> **gamification**, **persuasion** and **neuromarketing** techniques
> adapted for the project's audience.**
>
> This document does **not** duplicate the canonical pedagogical
> guide shared by the suite; it points to it and only lists what's
> specific to Teclatlon. If a rule here clashes with the canonical
> guide or with `technical.md`, `technical.md` wins.

---

## 1. The canonical pedagogical guide

The full didactic, gamification, persuasion and neuromarketing
techniques that all the apps of the Miralante suite share live in the
**Routime** repository under
[`creating-activities-guide.md`](https://github.com/thenkdframe/routime/blob/main/doc/en/creating-activities-guide.md).

Read it before designing anything. It covers (non-exhaustive):

- The 13 mandatory accessibility rules (with the rationale for each).
- The Socratic-method hint ladder (clue → bigger clue → answer).
- The positive-feedback palette (sounds, animations, micro-copy).
- The neuromarketing patterns adapted to the audience.
- The level-design checklist (Easy → Medium → Hard progression).

## 2. What's specific to Teclatlon

### 2.1 The unit of content is the lesson, not the activity

Don't add a new mode for every topic. Extend `LESSON_ORDER` (letters
mode) or the word list (words mode) in `data.js`. The mode
behaviour is fixed and consumes whatever the data file has.

If you genuinely need a new mode (e.g. a "speed drill" or a
"rhythm game"), that's an engineering change, not a content
change — discuss it with the build role before opening a PR, and
be aware that adding a mode means breaking the "six fixed modes"
shape that the home grid documents.

### 2.2 Lesson length and pacing

- **Letters lessons**: 4–8 keys. Short enough to feel doable,
  long enough to build rhythm.
- **Word lessons**: 5–12 words per session. Short enough that the
  learner can finish in 2–3 minutes.
- **Sentence lessons**: 1 short sentence (10–25 words). Never two
  sentences in a row; that turns the lesson into a reading exercise.
- **Number-pad sessions**: 8–12 numbers. The number pad is fast
  to type; longer sessions feel like a chore.

### 2.3 Cross-locale parity

The lesson sequence is **fixed across locales** so progress is
comparable between, say, a Spanish QWERTY learner and an English
QWERTY learner. When you extend `LESSON_ORDER`:

- The slot, length and structure must be the same in every locale.
- The actual keys may differ by locale (Spanish has `ñ`; English
  doesn't), but the **structural slot** does not.
- The word list is **per locale** and may legitimately diverge.

### 2.4 The word list is locale-specific

The word list lives in `data.js` per locale. When you add words:

- **Pick high-frequency words** in the target language. Avoid
  jargon, idioms, or words that need a context the keyboard lesson
  can't provide.
- **Keep the words short** (≤ 8 characters is a soft target; the
  runtime enforces a hard cap).
- **Avoid duplicates** within a locale's word list.

### 2.5 The "all keys" passage is the only mixed-content item

The "all keys" mode uses a **single short passage** that exercises
the **complete** keyboard of the active layout. When you add a new
locale:

- Write one passage of ~30–60 words.
- The passage must use **every letter, every digit, the space bar
  and at least the common punctuation marks** of the layout.
- Keep it easy-read (see the suite rules in
  [`SPEC.md`](SPEC.md) §3.3).
- Validate the coverage with the
  [`technical.md`](technical.md) §"All keys" checklist.

### 2.6 What is **not** a Teclatlon activity

A few things that look like "new activities" are out of scope:

- **No tappable mobile-keyboard mode** — Teclatlon is computer only
  (see [`SPEC.md`](SPEC.md) §2).
- **No leaderboards / scoreboard** — no server, no public ranking.
- **No "speed" or "racing" mode** — typing speed is **not** the
  project's goal. The project optimises for **accuracy and
  comfort**, not for typing fast.
- **No timed challenges** — see [`SPEC.md`](SPEC.md) §3.2.

## 3. The technical recipe

How to extend `LESSON_ORDER`, the word list, the per-locale layout
and the "all keys" passage is described in
[`technical.md`](technical.md) §"Lessons". **Read that section
before writing any code.** Bumping the service worker cache
`VERSION` is part of the recipe; see [`technical.md`](technical.md)
§"Cache contract".

## 4. Compliance checklist before opening a PR

- [ ] `LESSON_ORDER` (letters) or word list (words) extended in
      `data.js`.
- [ ] Same structural slot in every locale for letters-mode
      additions.
- [ ] Words in the word list are high-frequency, short and
      easy-read.
- [ ] No duplicates inside the same locale's word list.
- [ ] "All keys" passage uses the **complete** keyboard of the
      active layout (one passage per locale).
- [ ] Per-key progress remains in `localStorage`; no network call.
- [ ] Service worker cache `VERSION` bumped in `sw.js`.
- [ ] `node scripts/check.js` passes.

## 5. See also

- Canonical pedagogical guide (Routime):
  [creating-activities-guide.md](https://github.com/thenkdframe/routime/blob/main/doc/en/creating-activities-guide.md).
- Modes and lessons catalogue:
  [`activities.md`](activities.md).
- Technical recipe:
  [`technical.md`](technical.md) §"Lessons".
- Product non-negotiables:
  [`SPEC.md`](SPEC.md) §3.
