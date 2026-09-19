# Pull request

## Resumen

<!-- ¿Qué cambia y por qué? -->

## Comprobaciones

- [ ] `npm run test:ui` pasa con todos los flujos Playwright.
- [ ] `node scripts/check.js` pasa en local.
- [ ] `node scripts/check-version-bump.js` pasa y confirma el bump de
      `VERSION` cuando ha cambiado un archivo cacheado.
- [ ] Si tocas `index.html`, `styles.css`, `app.js`, `data.js`,
      `sw.js` o `manifest.json`, has actualizado la documentación
      canónica correspondiente (`doc/es/`).
- [ ] Si has añadido un archivo al shell, está en `FILES` de
      `sw.js` y has bumpeado `VERSION`.
- [ ] Si has cambiado contenido de producto, `strings.es.js` y
      `strings.en.js` están en sincronía.
- [ ] Has probado el flujo en al menos un navegador real de
      escritorio.

## Caption

<!-- opcional. Capturas o notas para el revisor. -->
