# CI/CD and deployment — Teclatlon

This is the project-specific CI/CD and Cloudflare deployment runbook. For the suite-wide test matrix, see the [Miralante CI/CD guide](https://github.com/miralante/apptonomia/blob/main/CI-CD.md).

## CI validation

Run the checks required by `.github/workflows/validate.yml` from this repository before merging. Project-specific checks and the suite-wide Playwright, crawler, service-worker, and release checks are listed in the linked CI/CD guide.

## Cloudflare deployment profile — Teclatlon

> **Deploy:** automatic on every push to `main` through the Cloudflare Git connector; Workers Builds deploys the repo and GitHub Actions only validates. The Cloudflare dashboard is the source of truth for project settings. This is a Worker with static assets, not classic Pages. Live at <https://teclatlon.miralante.workers.dev>.

## Configuration

| Setting | Value |
|---|---|
| Worker | `teclatlon` |
| Production branch | `main` |
| Framework preset | None |
| Build command | (empty) |
| Output / root | `.` / repository root |
| GitHub workflow | [`.github/workflows/validate.yml`](.github/workflows/validate.yml) — `node scripts/check.js` on pushes and pull requests; pull requests also receive a Cloudflare preview channel |

`wrangler.toml` is the deploy configuration: it pins the Worker name, serves `[assets] directory = "."` without a `main` script, and sets `not_found_handling = "404-page"`. Keep it; do not convert this project to classic Pages (`pages_build_output_dir` or `wrangler pages deploy`). Workers Builds reads it directly.

`_headers` applies security and cache headers at deploy time; no dashboard rules are needed. The app needs no runtime environment variables. No `_redirects` or `functions/`; `.assetsignore` excludes the test-only package files, dependencies, tests and scripts from published assets.

## Routing and Workers.dev

Cloudflare serves static Worker assets through an active `workers.dev` subdomain or custom domain. A deployment can succeed yet serve nothing without an active route. If a Worker shows **No active routes**, enable its Workers.dev subdomain under **Workers & Pages → `teclatlon` → Settings → Triggers**. If only a route table is available, add `*/*` on the account's `workers.dev` zone for Worker `teclatlon`. Routes are dashboard settings, not `wrangler.toml`; enabling one needs no rebuild. If a deployment is not active afterward, retry or promote the latest successful deployment.

The root app and `legal/` each have an `index.html`; implicit lookup handles deep links. Do not add an SPA catch-all: `/index.html` would match and Cloudflare would report an infinite loop.

## Cache and service worker

`sw.js` uses network-first with cache fallback: online clients receive the server copy; cache is used offline. It declares a `VERSION` and a `FILES` (or `ARCHIVOS`) precache list. Bump `VERSION` in the same commit whenever a listed file changes; `scripts/check-version-bump.js` enforces this in CI. Bump liberally so installed clients receive fixes. See `CLAUDE.md` §B.1.

## Deploy, rollback, and domains

Push to `main` to deploy automatically. Workers Builds handles production deploys, so no local `wrangler login` or GitHub deploy secret is needed. For a manual deployment or preview, run `npx wrangler deploy` (Wrangler reads `wrangler.toml`). To rebuild in the dashboard, open **Workers & Pages → teclatlon → Create deployment**. Roll back in **Deployments** by retrying or rolling back to a prior successful version.

To add a custom domain, use **Workers & Pages → `teclatlon` → Custom domains → Set up a custom domain**. Cloudflare configures DNS for a zone in the account; otherwise follow the wizard's DNS instructions. Current setup: No custom domain; the `workers.dev` URL is the live origin.

There are no API tokens or secrets to rotate. The GitHub integration uses OAuth; revoke access at [github.com/settings/applications](https://github.com/settings/applications).

## Project-specific notes

The root `package.json` contains development-only Playwright checks; the app has no runtime npm dependencies. `.assetsignore` excludes the package manifests, `node_modules/`, tests, scripts and documentation from uploaded assets. No server-side calls or runtime environment variables are needed; fonts, icons, and activity data are bundled. `not_found_handling = "404-page"` serves the repository’s `404.html`; before that file existed, an unmatched path returned an empty response (`Content-Length: 0`).

## References

- [`wrangler.toml`](wrangler.toml) — Worker and asset configuration.
- [`_headers`](_headers) — security and cache policy.
- [`.github/workflows/validate.yml`](.github/workflows/validate.yml) — validation; Cloudflare Git connector handles production deployment.
- [`CLAUDE.md`](CLAUDE.md) — agent workflow and, where applicable, the canonical service-worker cache contract (§B.1).
- [Miralante's shared Cloudflare runbook](https://github.com/miralante/apptonomia/blob/main/CI-CD.md) — common setup and recovery steps.
