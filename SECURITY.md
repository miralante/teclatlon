# Security policy

Teclatlon is a fully client-side static site: no server of its own,
no backend, no database, no telemetry, no third-party runtime calls, no
accounts. The attack surface is essentially the browser sandbox on the
same origin (the HTTP security headers in `_headers` are
written to keep it that way — CSP locked to `'self'`, no inline scripts,
no `connect-src` to third parties).



## Supported versions

Only the `main` branch receives security patches. We do not
maintain old versions.

The cache-bump rule (see `CLAUDE.md` §B.1) is what makes "supported"
meaningful: a `VERSION` bump in `sw.js` is the only mechanism that
forces installed PWAs to pick up the new code. We support the
**latest deployed `VERSION` only**; older versions are not patched.

## Reporting a vulnerability

Open a private advisory via
[GitHub Security Advisories](https://github.com/miralante/teclatlon/security/advisories/new).

Please include:

- A short description and reproduction steps.
- Observed or expected impact.
- The affected commit SHA or tag.

If you cannot use Security Advisories, open an issue clearly labelled
as **security** and prepend `[SEC]` to the title. **Do not upload
runnable proof-of-concept code** to a public issue — wait for a
maintainer to coordinate.

If neither channel is appropriate, email `hello@apptonomia.uk` instead.

## What to expect

- Acknowledgement within 5 business days.
- First assessment (reproduction, severity, plan) within 15 business days.
- If confirmed, a patch or mitigation as soon as feasible.

## Coordinated disclosure

We prefer to coordinate disclosure if the fix requires user-visible
changes to the UI or the PWA shell.

## Out of scope

- Vulnerabilities in the user's browser (we ship plain HTML/CSS/JS;
  report to the browser vendor).
- Vulnerabilities in Cloudflare's Workers runtime (report to
  Cloudflare).
- Self-XSS (a user pasting malicious code into their own browser
  console).

## See also

- [`CLOUDFLARE.md`](CLOUDFLARE.md) — the deploy runbook.
- [`_headers`](_headers) — the HTTP security headers in effect.
- `CLAUDE.md` §B — the suite-wide policies (no telemetry, WCAG
  AAA, public-facing wording).
