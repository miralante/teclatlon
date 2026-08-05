# Contributing to Teclatlon

Thanks for your interest! Before opening an issue or a PR, please
have a look at:

- [`doc/en/SPEC.md`](doc/en/SPEC.md) — non-negotiable product and
  accessibility rules.
- [`doc/en/technical.md`](doc/en/technical.md) — architecture and
  technical constraints.
- [`CLAUDE.md`](CLAUDE.md) — the workflow we follow when editing
  the repo.

## How to contribute

- **Bugs and feature requests**: use the
  [issue templates](../../.github/ISSUE_TEMPLATE/).
- **Pull requests**: use the
  [PR template](../../.github/PULL_REQUEST_TEMPLATE.md).

## Product changes: both languages

`es` is the default and the source of truth. If you touch UI
strings, lessons, words or number-pad steps, update `strings.es.js`
and `strings.en.js` simultaneously (root and/or `legal/` as
applicable). `node scripts/check.js` enforces key parity, but not
translation quality — proofread both languages.

## Code style

- ES5-style JavaScript (`var`, classic functions, IIFE with
  `'use strict'`).
- Identifiers, comments and commit messages in English.
- UI text in the language it represents.
- No frameworks, no bundlers, no JS CDNs.

## Development environment

```bash
npx serve .
# or
python -m http.server 8080
```

There is no build step. `node scripts/check.js` is the only
validation step (CI also runs it on every push and PR).

## Reporting a vulnerability

See [`SECURITY.md`](SECURITY.md).
