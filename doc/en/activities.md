# Lessons and modes catalogue

Teclatlon is a single-purpose **touch-typing trainer**. The unit of
content is the **lesson** (a fixed sequence of keys, words, or
sentences) and the unit of practice is the **mode** (the screen the
learner opens from the home grid). Lessons and modes are declared
in `data.js`; the runtime is one shared core that knows how to play
any lesson/mode pair.

> The canonical product description (audience, "computer keyboard
> only" rule, the "no tappable mobile keyboard" decision) lives in
> [`SPEC.md`](SPEC.md). The architecture of the data file and the
> runtime is in [`technical.md`](technical.md).

---

## 1. The home grid (the modes)

The home screen shows the practice modes. Each mode opens one screen
and accepts any lesson that matches its `accepts` filter.

| Mode | What it trains | Reference |
|---|---|---|
| **Finger placement** | The home-row anchors and the hand-finger mapping. | [`SPEC.md`](SPEC.md) §4. |
| **Letters** | Letter-by-letter lessons in the fixed order defined in `data.js` (see [`technical.md`](technical.md) §"Lessons"). | [`technical.md`](technical.md) §"Letters mode". |
| **Words** | Word typing with optional custom words (including the learner's own name). | [`technical.md`](technical.md) §"Words mode". |
| **Numbers (number-pad game)** | Number-pad practice with the right-hand home position. | [`technical.md`](technical.md) §"Numbers mode". |
| **All keys** | Mixed practice that exercises the **complete** keyboard of the currently selected layout — every letter, every number when the layout shows them, the space bar, and every punctuation key. | [`SPEC.md`](SPEC.md) §3.7. |
| **Free writing** | Free text + read-aloud of what was typed. | [`technical.md`](technical.md) §"Free writing mode". |

Each mode is intentionally short and replayable. There is no
"level completed" gate that locks the next mode — the learner can
pick any mode at any time.

## 2. The lesson sequence

Lessons are declared in `data.js` as an ordered array of keys, words
or sentences. The lesson sequence for the **letters mode** is **fixed**
(`LESSON_ORDER` in `data.js`) and is intentionally independent of
the active language: a Spanish QWERTY learner sees the same first
letters in the same order as an English QWERTY learner, so progress
is comparable across languages.

The lesson sequence covers:

1. **Home row left** (a-s-d-f).
2. **Home row right** (j-k-l-ñ/;).
3. **Top row** (q-w-e-r-t-y-u-i-o-p).
4. **Bottom row** (z-x-c-v-b-n-m).
5. **Numbers** (top-row digits, layout-dependent).
6. **Punctuation and special keys** (period, comma, accent, etc., as
   the layout requires).
7. **Mixed practice** (sentences drawn from the word list and from
   the learner's own saved words).

## 3. The word list

The word list lives in `data.js` and is the **content** of the
**words** mode. It contains:

- **Generic high-frequency words** in each locale.
- **Optional user words** (e.g. the learner's own name) saved in
  `localStorage` and merged into the rotation when present.

The full rules for the word list (length cap, locale handling,
deduplication, custom-name merging) are in
[`technical.md`](technical.md) §"Word list".

## 4. The "all keys" challenge

This is the only mode that is a single, fixed practice session, not
a flow of lessons: it picks a passage that uses the **complete**
keyboard of the currently selected layout and asks the learner to
type it through. The passage is short, the feedback is per-key, and
there is no time pressure.

## 5. What is **not** an activity here

A few things that look like "activities" in other projects are not
in Teclatlon:

- **No quizzes** — typing practice doesn't have a wrong/right
  response that subtracts anything; only the next key to press.
- **No leaderboards** — there is no server, no scores, no public
  ranking.
- **No tappable mobile keyboard** — Teclatlon is **computer only**
  (see [`SPEC.md`](SPEC.md) §2). A phone/tablet sees a full-screen
  notice explaining why a physical keyboard is needed.

## 6. How to add a new lesson

This is the support / build role's task. The full workflow lives in
[`creating-activities-guide.md`](creating-activities-guide.md). The
short version:

1. **Edit `data.js`** to extend `LESSON_ORDER` (letters mode) or
   the word list (words mode), as appropriate.
2. **Keep the lesson length realistic**: 4–8 keys for letters,
   5–12 words for word lessons, 1 short sentence for sentence
   lessons.
3. **Verify cross-locale parity**: if you add a lesson to the
   Spanish layout, the English (or other) layout needs the same
   structural slot to keep progress comparable.
4. **Validate before opening the PR**: `node scripts/check.js`.

See [`technical.md`](technical.md) §"Lessons" for the data shape
and the constraints.

---

## See also

- Product: [`SPEC.md`](SPEC.md).
- Architecture: [`technical.md`](technical.md).
- Languages: [`I18N.md`](I18N.md).
- How to create new lessons:
  [`creating-activities-guide.md`](creating-activities-guide.md).
