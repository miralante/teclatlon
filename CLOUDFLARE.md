# Cloudflare Workers (static assets) — Teclatlon

> **Production branch & automatic deploy.** Teclatlon deploys
> **automatically on every push to `master`** via the **Cloudflare
> Git connector**. The GitHub Actions workflow
> [`.github/workflows/validate.yml`](.github/workflows/validate.yml)
> runs `node scripts/check.js` on every push and PR but does **not**
> deploy. The Cloudflare dashboard is the source of truth for
> project settings.
>
> **Live URL:** <https://teclatlon.miralante.workers.dev>
>
> **Part of the Miralante suite.** Teclatlon is one of the six
> runtime apps (Calculia, Memofun, Okeymoney, Routime, Sinonimia,
> Teclatlon) that share the same author, the same accessibility-first
> / no-backend philosophy, and the same Cloudflare deploy story.
> The canonical group-wide guide lives in
> [Apptonomia's `CLOUDFLARE.md`](https://github.com/miralante/apptonomia/blob/master/CLOUDFLARE.md);
> this document is the Teclatlon-specific runbook on top of it.

## How it works

1. The repo is connected to a Cloudflare Workers project named
   `teclatlon` (Workers & Pages → Connect to Git).
2. Every push to `master` triggers a build in Cloudflare's
   infrastructure via Workers Builds, which reads [`wrangler.toml`](wrangler.toml)
   to deploy the repo root as a static-assets Worker (no `main`
   script).
3. The build is a no-op: no `build command`, no `output directory`
   other than `.`, so the static files are served as-is. Pull
   requests get an automatic preview channel.
4. The `validate.yml` GitHub Action still runs on every push and PR
   to gate structural and i18n checks, but it does not deploy.

`wrangler.toml` is the actual deploy configuration Workers Builds
reads — not just a convenience for local CLI use. It pins the
project name (`name = "teclatlon"`), declares
`[assets] directory = "."` (no `main` script, just static assets),
and `not_found_handling = "404-page"` so Cloudflare serves this
repo's own `404.html` for an unmatched path instead of a bare empty
404 (verified live: `curl` returned `Content-Length: 0` for a bad
path before the file existed).

> **Do not "fix" by deleting `wrangler.toml`** or by switching to
> the legacy `pages_build_output_dir` Pages shape. Teclatlon's
> Cloudflare dashboard project is already a Worker with "Workers
> Builds", and that's the shape Cloudflare currently recommends for
> static sites. The previous failure mode documented in git history
> (a `wrangler.toml` with `name = "teclatlon"` plus a Pages-style
> `pages_build_output_dir` setting, no `[assets]` binding) is what
> made the Git connector mis-detect the project type — the current
> file avoids it by declaring `[assets]` explicitly.

## Files in this repository

| File | Purpose |
|---|---|
| `_headers` | Cache and security headers |
| `wrangler.toml` | Pins the project name + the `[assets]` binding + `not_found_handling = "404-page"` |
| `.github/workflows/validate.yml` | `node scripts/check.js` and friends on every push/PR (does **not** deploy) |

No `_redirects`, no `functions/`, no `package.json`, no Cloudflare
service-account keys. The repo has only two HTML entry points, both
with their own real `index.html` (`./index.html` is the app,
`./legal/index.html` is the privacy page), so Cloudflare's implicit
per-directory `index.html` lookup handles deep links without any
rewrite rule. A SPA catch-all rewrite would loop: `/index.html`
itself matches `/*` and Cloudflare rejects it with *"Infinite loop
detected in this rule"*.

The reason Teclatlon has **no `package.json`** mirrors the
Apptonomia portal of the suite: Cloudflare runs `npm install` if a
`package.json` is present, and the Playwright workerd binary
(~122 MiB) overshoots the 25 MiB asset limit. Teclatlon ships plain
HTML/CSS/JS and its CI scripts only use Node stdlib, so npm is
never invoked.

## Configuration in Cloudflare

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | *(empty)* |
| Build output directory | `.` |
| Production branch | `master` |
| Root directory | *(empty — repo root)* |

No environment variables are required: the app makes no server-side
calls.

## Required Cloudflare headers

The site uses a [`_headers`](_headers) file at the repo root to set
security headers (CSP, X-Frame-Options, Referrer-Policy,
Permissions-Policy) and a cache policy. Cloudflare reads this file
on every deploy and applies the rules automatically — no dashboard
configuration needed.

## How to redeploy

Nothing to do. Push to `master` and Cloudflare rebuilds.

For a manual rebuild (e.g. after Cloudflare itself had an
incident), go to the Cloudflare dashboard → Workers & Pages →
`teclatlon` → **Create deployment** → choose a branch or upload a
directory.

For a one-off preview outside the Git connector (e.g. to test a
dirty worktree without pushing):

```bash
npx wrangler deploy
```

## How to roll back

Cloudflare dashboard → Workers & Pages → `teclatlon` →
**Deployments**. Each successful build is listed with a timestamp.
Click any of them and select **"Retry deployment"** or **"Rollback
to this deployment"**.

## How to add a custom domain

Cloudflare dashboard → Workers & Pages → `teclatlon` → **Custom
domains** → **Set up a custom domain** → follow the wizard. DNS is
configured automatically if the domain is already on Cloudflare, or
by CNAME if it is on another provider.

## Rotating credentials

There are no API tokens or secrets to rotate. The GitHub
integration is a one-time OAuth authorisation; revoking it is a
matter of removing the app's access on
[github.com/settings/applications](https://github.com/settings/applications).

## Service worker behaviour

Teclatlon's `sw.js` is **network-first, cache fallback** —
different from the cache-first strategy used by the rest of the
suite (Calculia, Routime, Sinonimia, Memofun, Okeymoney). This
matches the operational model: a single typing-activity page where
stale code would silently misbehave, not a multi-route app where a
year of cached HTML is fine.

- **Network-first.** Every GET goes to the network first; on
  success the response is mirrored into the SW cache and the live
  copy is returned. The next browser load sees whatever the server
  is serving today.
- **Cache fallback.** Only when the network is unreachable (offline
  / CDN outage) does the SW serve the last cached copy.
- **Offline shell.** For navigations that have neither a network
  response nor a cached copy, the SW replies with a tiny inline
  "Sin conexión" HTML with **no `Location` header** — Safari
  rejects a top-level navigation served by the SW that carries a
  redirect ("Response served by service worker has redirections").
- **Resilient install.** `install` caches each asset individually,
  never `cache.addAll`, so a single missing or failing file does
  not take the whole cache down. Failures are logged with
  `console.warn` and skipped.

## Cache contract — three layers

There are **three independent cache layers** between the user and
the source code. Each one is correct for what it does; the goal of
this section is to make the contract explicit so a change is not
trapped in any of them.

### 1. Cloudflare edge (CDN)

Honoured automatically by Cloudflare; no config in the repo. The
`_headers` file pins `max-age=0, must-revalidate` on the shell
(`/index.html`, `/legal/*`, `/manifest.json`, `/sw.js`), so the
next browser request always revalidates and picks up the new bytes.
`*.js` and `*.css` use `max-age=300` (deliberately short, not
immutable — these files are **not** content-hashed, and a stale
1-year cache on `app.js`/`styles.css` previously pinned Safari iOS
to an old shell). `*.png`/`*.svg`/`*.woff2` use
`immutable, max-age=31536000`.

Verifying: `curl -sI https://<host>/sw.js` should show the new
`ETag` after a push that touched `sw.js`, and
`CF-Cache-Status: HIT` is expected.

### 2. Browser HTTP cache (per origin)

Driven by `Cache-Control` in [`_headers`](_headers). Shell files
(`index.html`, `legal/*`, `manifest.json`, `sw.js`) →
`public, max-age=0, must-revalidate`. JS/CSS →
`public, max-age=300`. PNG/SVG/WOFF2 →
`public, max-age=31536000, immutable`.

We deliberately do **not** set `no-store`: the SW relies on being
able to cache the response to provide the offline shell, and
`no-store` would break that.

### 3. Service-worker cache (`caches.open(VERSION)`)

Strategy: **network-first, cache fallback** — see comments in
[`sw.js`](sw.js). `install` caches every file in `FILES`
individually (never `cache.addAll`, so one missing asset does not
brick the cache). `fetch` always tries the network first; on
success it mirrors the response into the SW cache and returns the
live response. Only when the network fails does it serve the
cached copy, and only when the cache also misses does it reply with
the inline "Sin conexión" HTML.

Cache key: `teclatlon-vN`. On `activate`, every cache whose name
is not the current `VERSION` is deleted, so **bumping `VERSION` is
the only mechanism that purges stale SW state on the client**.

> **Also bump `VERSION` after any `_headers` change that affects
> `sw.js`'s own response headers (CSP in particular).** A service
> worker's execution context inherits its CSP from the response
> that fetched `sw.js` at install time and does **not** re-read it
> later. A broken CSP once shipped in `_headers` (where
> `content-security-policy` applies to `/*`, including `sw.js`)
> means every already-installed client is running an SW instance
> permanently stuck with that broken policy — its own `fetch()`
> calls inside the `fetch` handler start throwing (blocked by the
> bad CSP), which lands in the `.catch()` branch and serves the
> cached copy or the inline "Sin conexión" page, no matter how
> healthy the server is now. Fixing `_headers` alone does nothing
> for clients that already registered the SW: `sw.js`'s bytes are
> unchanged, so the browser's update check finds no diff and keeps
> the broken instance running. Only a `VERSION` bump changes the
> script bytes, forcing a real reinstall that fetches `sw.js`
> fresh under the corrected headers.

### Troubleshooting a deploy that did not show up

If a push is live on GitHub and on the Cloudflare dashboard but a
client keeps showing the old UI, walk the three layers in order:

1. **Service-worker cache (most common cause).** The client has an
   old SW. Bump `VERSION` in `sw.js` and push. The `activate`
   handler deletes the old cache on the next app open.
2. **Browser HTTP cache.** Rare with `_headers` as it is, but
   possible if the user opened the app inside the `max-age` window
   with an older `_headers` deployed. Force-reload
   (DevTools → Application → Service workers → Update) clears it.
3. **Cloudflare edge cache.** Should auto-revalidate thanks to
   `max-age=0, must-revalidate`. If a stale asset is still served,
   check `curl -sI <url>` for the `ETag` and the
   `CF-Cache-Status` header; the dashboard has a "Purge cache"
   option as a last resort.

```bash
# Effective SW version on the edge
curl -s https://<host>/sw.js | grep "^var VERSION"

# ETag of a shell file (must change when the file changes)
curl -sI https://<host>/index.html | grep -i etag

# Whether the edge is serving a fresh copy
curl -sI https://<host>/sw.js | grep -i cf-cache-status
```

`HIT` with a current `ETag` and a current `VERSION` is the green
state.
