# Guide for professionals and families

This guide is intended for occupational therapists, families,
teachers and other professionals who want to use Teclatlon as a
support tool to teach touch-typing.

---

## Who is Teclatlon for?

Teclatlon is primarily designed for:

- **Children and beginners** who are learning to type on a physical
  keyboard for the first time.
- **People with intellectual disability** who benefit from Easy
  Reading, no-pressure pacing, and predictable, uncluttered screens.
- **Adults learning to type** who want a low-distraction trainer.

The application **does not replace** a typing teacher, but can serve
as:

- Daily practice between lessons.
- A tool for autonomous review once the learner knows the basics.
- A way for the support role to see what keys still trip the learner
  up.

---

## Computer only

Teclatlon is **computer only**. There is no touch / tap input mode;
the on-screen keyboard is always decorative. If the page is opened
on a phone or tablet, the app shows a full-screen notice explaining
that a physical keyboard is needed and why the on-screen keyboard
cannot be tapped (see [`SPEC.md`](SPEC.md) §2).

This is a deliberate choice and is not a missing feature. **Do not
add a tappable mobile-keyboard mode back** — that scope was dropped
when Teclatlon was split out of Apptonomia.

---

## How to use Teclatlon in support sessions

### Initial assessment

Before using the application, observe the learner with these
questions:

1. Are they comfortable sitting at a desk with a physical keyboard?
2. Do they know the home-row anchors (a-s-d-f / j-k-l-ñ)?
3. Can they reach the keys without looking at the keyboard? (If not,
   start with the **finger-placement** screen.)
4. Which hand has more strength / coordination? (Useful to know for
   the right-hand-heavy keys and the number pad.)

### Activity selection

#### For learners starting out

| Mode | Skill worked |
|---|---|
| **Finger placement** | Home-row anchors, hand-finger mapping. |
| **Letters (first 2 lessons)** | a-s-d-f and j-k-l. |
| **Words** with **own name** | Reinforcement + personal motivation. |

#### For intermediate learners

| Mode | Skill worked |
|---|---|
| **Letters** (rows 3–4) | Top and bottom rows. |
| **Words** (high-frequency list) | Common words. |
| **Numbers** | Number-pad practice. |

#### For advanced learners

| Mode | Skill worked |
|---|---|
| **All keys** | Mixed practice using the full keyboard. |
| **Words** (mixed) | Mixed word practice. |
| **Free writing** | Free text + read-aloud of what was typed. |

### Adaptations

#### Pacing

The learner sets the rhythm. Teclatlon has **no timers and no
negative feedback** — see [`SPEC.md`](SPEC.md) §3.2. A wrong key
produces an encouraging message and the learner can try again.

#### Visual adjustments

- The on-screen keyboard highlights the **next key** to press. If
  the highlight is too distracting, dim it via the OS-level
  "reduce motion" preference; the app respects it.
- For learners with reduced vision, increase the OS-level font size;
  the layout is responsive but is designed for desktop sizes.

#### Posture

The physical keyboard is the only real input. A learner who cannot
reach it comfortably (small hands, motor difficulties) should use a
**smaller split or compact keyboard** rather than a tablet or
phone-on-desk — Teclatlon will not work in that setup.

---

## Progress tracking

Teclatlon stores per-key progress in the browser's `localStorage`:
which keys the learner has hit, which they still miss, and how
often. There are **no stars, no levels, no score**: progress is
shown as a calm per-key chart, designed to be reviewed with the
support role, not as a competitive metric.

To view progress: open `/settings` and check the per-key chart.
Resetting progress is destructive and requires confirmation.

### Privacy

- No login, no account, no analytics, no server calls.
- Progress lives in `localStorage` and only in the browser where the
  app is open.
- Different browsers on the same device store independent progress.

---

## More resources

- Modes and lessons catalogue: [`activities.md`](activities.md).
- Pedagogical and design notes for professionals:
  [`creating-activities-guide.md`](creating-activities-guide.md).
- Cross-suite guide for families on daily living skills:
  [Routime's `team.md`](https://github.com/thenkdframe/routime/blob/main/doc/en/team.md).
