# Cloudflare Pages — Teclatlon

> **Production branch & automatic deploy.** Teclatlon deploys
> **automatically on every push to `master`** via the **Cloudflare
> Git connector** configured in the Cloudflare dashboard. There is no
> GitHub Actions workflow that deploys — the only workflow in
> `.github/workflows/validate.yml` runs `node scripts/check.js` on
> every push and PR to gate content, but it does **not** deploy. The
> Cloudflare dashboard is the source of truth for project settings.

Teclatlon is deployed on **Cloudflare Pages** via its built-in
GitHub integration. There is no custom GitHub Actions workflow and
no `wrangler.toml` in the repo — the Cloudflare dashboard owns the
build and deploy, and project configuration lives entirely there.

## How it works

The repo is connected to a Cloudflare Pages project (e.g.
`teclatlon`). Pushes to `master` trigger a Pages build in
Cloudflare's infrastructure; pull requests get an automatic preview
channel. The build is a no-op: no `build command`, no `output
directory` other than `.`, so the static files are served as-is.
Cache and security headers live in [`_headers`](_headers) at the
repo root. The `validate.yml` GitHub Action still runs on every
push and PR to gate structural and i18n checks, but it does **not**
deploy.

The `<project-name>.pages.dev` subdomain is assigned by Cloudflare
from the project name declared in the Cloudflare dashboard. The
project name is **not** declared in the repo — that mirrors the
working setup of the sibling `apptonomia` and `sinonimia` projects
and avoids the "project type misdetected as Worker" failure mode
that `wrangler.toml` introduces (see "Why no `wrangler.toml`?").

No deploy-side configuration is committed: no `wrangler.toml`, no
`_redirects`, no `functions/`, no `_routes.json`, no Cloudflare
service-account keys. The dashboard is the source of truth for
project settings; the repo holds the static assets and the CI that
gates them.

## Dashboard configuration

When the project is set up in the Cloudflare dashboard:

- **Build command:** *(empty)*
- **Build output directory:** `/` (leave the default — it is the
  repo root)
- **Root directory:** *(empty)*
- **Environment variables:** none required
- **Branch:** `master` (production)

Cloudflare reads `_headers` from the repo root automatically and
caches `/index.html`, `/legal/`, `/manifest.json` and `/sw.js` with
`max-age=0, must-revalidate` (so the PWA shell can refresh) while
keeping the fingerprinted JS/CSS/font assets in long-lived cache.

## Why no `_redirects`?

Cloudflare Pages rejected the deploy with:

> "Invalid _redirects configuration: ... Infinite loop detected in
> this rule. ... [code: 100324]"

when the sibling `apptonomia` project tried the Firebase-era SPA
catch-all `/* /index.html 200`. Cloudflare Pages statically validates that the
destination of a catch-all rule cannot also match the rule itself:
because `/index.html` is a real file in the repo root, `/*` matched
it and the validator correctly flagged the loop.

The fix follows the same pattern as the sibling `apptonomia` and
`sinonimia` projects, which have no `_redirects` at all: Cloudflare
Pages' implicit `index.html` lookup per directory already resolves
every deep link the site actually has. Teclatlon has only two HTML
entry points, both with their own real `index.html`:

- `./index.html` — the app itself (single activity, no router)
- `./legal/index.html` — the privacy / data-protection page

Visiting `/` resolves to `/index.html` and visiting `/legal/`
resolves to `/legal/index.html`, with no rewrite needed. The SPA
catch-all was solving a problem this project does not have.

## Why no `wrangler.toml`?

A `wrangler.toml` containing `name = "teclatlon"` and
`pages_build_output_dir = "."` looks correct, but in practice the
Cloudflare Pages Git connector can mis-detect the project type when
that file is present: it falls back to `wrangler deploy` (the
**Worker** deploy command), which then fails with *"Missing
entry-point to Worker script or to assets directory"* because the
file declares neither a `main` entry-point nor an `[assets]`
binding. Removing `wrangler.toml` and letting the dashboard drive
the deploy with `pages_build_output_dir` implicit (= repo root)
sidesteps the issue entirely. This is the same pattern the sibling
`apptonomia` and `sinonimia` repos use and is what makes those
projects' deploys succeed end-to-end.

If the project ever needs a manual CLI deploy (for example, to
attach preview channels during a local debugging session), Wrangler
can be installed transiently via
`npx wrangler pages deploy . --project-name teclatlon` without
committing a `wrangler.toml` or a `wrangler` devDependency.

## Why no `package.json`?

The sibling `apptonomia` project hit a deploy failure where
Cloudflare Pages ran `npm install` because the repo had a
`package.json`, pulling in a Playwright workerd binary (~122 MiB)
and overshooting the 25 MiB asset limit. Teclatlon therefore ships
**no `package.json`** — the repo is pure static HTML/CSS/JS, the
CI scripts (`scripts/check.js`) run with plain `node` and only use
stdlib modules, and Cloudflare Pages serves the static root
directly without ever invoking npm.

## Service worker note

The service worker (`sw.js`) is registered from every HTML entry
point (`./index.html` registers `./sw.js`; `/legal/index.html`
registers `../sw.js`). Strategy is **network-first, cache
fallback**:

- **Network-first** — every GET request goes to the network first,
  and the response is mirrored into the SW cache for offline use.
  This keeps the latest server version authoritative whenever the
  device is online, so a redeploy is visible on the next page
  load instead of being trapped behind a 1-year cache.
- **Cache fallback** — when the network is unreachable (offline /
  CDN outage), the SW serves the last cached copy.
- **Offline shell** — for navigations that have neither a network
  response nor a cached copy, the SW replies with a tiny inline
  "Sin conexión" HTML with no `Location` header (Safari rejects a
  top-level navigation served by the SW that carries a redirect:
  "Response served by service worker has redirections").
- **Resilient install** — `install` caches each asset individually,
  never `cache.addAll`, so a single missing or failing file does
  not take the whole cache down. Failures are logged with
  `console.warn` and skipped.

Bump `VERSION` in `sw.js` whenever you change `ARCHIVOS` to discard
the old cache. The agent-workflow checklist in [`CLAUDE.md`](CLAUDE.md)
documents which files trigger a required `VERSION` bump.
