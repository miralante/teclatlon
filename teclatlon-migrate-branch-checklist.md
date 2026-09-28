# teclatlon -- `master` -> `main` operator checklist

The local-side preparation (workflow edits + branch rename) was applied by `rename-branch-to-main.js`.
The steps below must be done in the GitHub web UI and the Cloudflare dashboard,
because the script does not have credentials for either.

## 0. Local state

- Local branch is on `master` still.

## 1. Push the new `main` branch to `origin` (only if --push was not passed)

- From the local clone (the script already committed the workflow edit and renamed the local branch):
    git push -u origin main

- Or, if you prefer to do the steps in order, skip this until after the GitHub-side changes below.

## 2. GitHub

- Open https://github.com/miralante/teclatlon/settings/branches
- If `master` has branch-protection rules, replicate them on `main` FIRST.
- Under "Default branch", switch from `master` to `main`.
  - GitHub will offer to redirect existing refs -- accept.
- (Optional, after 24-48 h of clean production deploys):
  `git push --delete origin master` from a local clone.

## 3. Cloudflare Pages

- Open the Cloudflare dashboard, project `teclatlon`.
- Settings -> Builds -> Production branch: change from `master` to `main`.
- (If using the Cloudflare Git connector) reconnect the integration and select
  the `main` branch as the production source.
- Push a `chore: smoke after rename` commit to `main` and confirm the new
  deploy is the **production** environment, not a preview.

## 4. After both are done

- Update `apptonomia/scripts/one-off/write-security-md.js`: change this repo's
  `branch: 'master'` (or whatever it is today) to `branch: 'main'`, then re-run the script.
- Update `teclatlon/CLOUDFLARE.md` "Production branch" cell.
- Run `node scripts/check.js` (per-sibling validator) -- make sure it still passes.
