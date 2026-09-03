# Detailed contents — Teclatlon

> 🌐 **Other language:** [Español](../es/CONTENIDOS.md)

This document is the **detailed didactic index of Teclatlon**. It
expands on [`activities.md`](activities.md) and
[`creating-activities-guide.md`](creating-activities-guide.md) by
listing every lesson, game and pedagogical concept shipped with the
app, and pointing back to the canonical doc for each one.

Teclatlon is a single-activity app: `tools/` contains one folder,
the typing trainer. The "content" of the app is therefore the set
of **lessons, words, number-pad steps and challenges** defined in
`data.js` and grouped by theme.

Use this document as the **workbook for Teclatlon**: when a new
lesson is proposed, when the keyboard layout or hand-color system
is reviewed, or when the practice corpus needs to be rebalanced,
this is the document to read first.

> **Source of truth for product rules**: [`SPEC.md`](SPEC.md).
> **Source of truth for pedagogy**:
> [`creating-activities-guide.md`](creating-activities-guide.md).
> **Source of truth for keyboard layout, finger/hand colors and the
> PWA/service-worker contract**:
> [`technical.md`](technical.md).
> **Source of truth for the cross-repo suite pattern** (how every
> app of Miralante is built, what is forbidden): [`technical.md`
> §8](technical.md#8-suite-pattern-how-every-app-of-miralante-is-built).
> This document does **not** redefine rules; it indexes the content
> that those rules produce.

---

## 0. How this document is organized

1. The single activity (`tools/` slug).
2. Lessons and game modes.
3. Per-locale practice content (`data.js`).
4. Pedagogical concepts (what each mode works on).
5. Restrictions and forbidden content.

> **Note**: Teclatlon targets the **physical computer keyboard only**.
> A tappable on-screen keyboard was deliberately dropped — see
> [`SPEC.md`](SPEC.md) for the rationale and what was rejected. Do
> not reintroduce a tappable mobile-keyboard mode.

---

## 1. The activity

| Activity | Slug (`tools/`) | Didactic objective | Key vocabulary |
|---|---|---|---|
| Teclatlon (touch-typing trainer) | `teclatlon/` | Finger placement, letter-by-letter typing, common words, number pad, free writing. | tecla, dedo, mano, fila, posición, fila base, fila superior. |

---

## 2. Lessons and game modes

This section is the **placeholder for the per-lesson and per-game
inventory**. When you add a lesson or a challenge, document it here
(name, didactic objective, key vocabulary, related `data.js`
arrays) and link back to the section in
[`creating-activities-guide.md`](creating-activities-guide.md) that
governs the addition.

Sections to flesh out as the project grows:

- 2.1 Lessons (per key row, in didactic order).
- 2.2 Words game (per-corpus inventory).
- 2.3 Number-pad game (per-stage inventory).
- 2.4 "All keys" challenge (descriptor + scoring rule).
- 2.5 Free-writing mode (descriptor + storage rule).

---

## 3. Per-locale practice content

Practice content lives in `data.js` as locale-split arrays:

- Spanish (`es`) — lessons, words, number-pad steps.
- English (`en`) — lessons, words, number-pad steps.

See [`technical.md`](technical.md) for the `data.js` schema, and
[`I18N.md`](I18N.md) for the rule that every locale change must be
mirrored across the locales the app ships.

---

## 4. Pedagogical concepts (what each mode works on)

- Finger placement and home row (the "fila base").
- Touch-typing rhythm and accuracy.
- Common Spanish / English word corpus.
- Number-pad layout (Spanish: numpad with `,` decimal separator).
- Free writing without looking at the keyboard.

---

## 5. Restrictions and forbidden content

- **No clinical / disability mention in any user-facing surface**
  (see [`SPEC.md`](SPEC.md) § "Mandatory rule: zero mentions in
  the user-facing product"). `scripts/check.js` enforces this on
  `index.html` and `strings.<locale>.js`.
- **No tappable on-screen keyboard** — see note above.
- **No third-party dependency** — the project is vanilla
  HTML/CSS/JS, see [`technical.md`](technical.md).

---

## See also

- [`index.md`](index.md) — top-level doc index.
- [`quick-guide.md`](quick-guide.md) — one-page orientation.
- [`team.md`](team.md) — coverage and therapeutic guidance.
- [`technical.md` §8](technical.md#8-suite-pattern-how-every-app-of-miralante-is-built) — the cross-repo suite pattern (every app of Miralante, what is forbidden).
