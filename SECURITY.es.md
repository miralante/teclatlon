# Security policy

Teclatlon is a fully client-side static site: no server, no
backend, no database, no telemetry. The attack surface is
essentially the browser sandbox on the same origin.

## Supported versions

Only the `master` branch receives security patches. We do not
maintain old versions.

## Reporting a vulnerability

Open a private advisory via
[GitHub Security Advisories](https://github.com/miralante/teclatlon/security/advisories/new).

Please include:

- Short description and reproduction steps.
- Observed or expected impact.
- Affected commit SHA or tag.

If you cannot use Security Advisories, open an issue clearly
labelled as **security** and prepend `[SEC]` to the title. **Do
not upload runnable proof-of-concept code** to a public issue —
wait for a maintainer to coordinate.

## What to expect

- Acknowledgement within 5 business days.
- First assessment (reproduction, severity, plan) within 15
  business days.
- If confirmed, a patch or mitigation as soon as feasible.

## Coordinated disclosure

We prefer to coordinate disclosure if the fix requires user-visible
changes to the UI or the PWA shell.
