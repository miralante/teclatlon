# Pull request

## Summary

<!-- What changes and why? -->

## Checks

- [ ] `npm run test:ui` passes all Playwright UI flows.
- [ ] `node scripts/check.js` passes locally.
- [ ] `node scripts/check-version-bump.js` passes and confirms the
      `VERSION` bump when a cached file changed.
- [ ] If you touched `index.html`, `styles.css`, `app.js`, `data.js`,
      `sw.js` or `manifest.json`, you updated the relevant canonical
      documentation in `doc/en/`.
- [ ] If you added a file to the shell, it is in `FILES` in
      `sw.js` and you bumped `VERSION`.
- [ ] If you changed product content, `strings.es.js` and
      `strings.en.js` are in sync.
- [ ] You tested the flow in at least one real desktop browser.

## Caption

<!-- optional. Screenshots or notes for the reviewer. -->
