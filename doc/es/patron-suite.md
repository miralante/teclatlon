# Patrón de la suite — cómo se construye cada app de Miralante

> 🌐 **Other language:** [English](../en/suite-pattern.md)

Este documento es la **guía canónica y transversal** de cómo se
construye y mantiene cada app de la [suite Miralante](https://apptonomia.uk).
Es la fuente de verdad que prevalece sobre el `technical.md`
(tecnico.md) de cualquier repo cuando entran en conflicto, porque
el objetivo es mantener las siete apps hermanas (Apptonomia,
Calculia, Memofun, Okeymoney, Sinonimia, Teclatlon, Routime)
consistentes: misma forma, mismas convenciones, mismo deploy,
mismo i18n, mismo comportamiento offline.

Un cambio aquí es un **cambio transversal a la suite** y debe
aplicarse a todos los repos. Un cambio en el `technical.md`
(tecnico.md) de un repo es específico de ese proyecto y se queda
ahí.

> **Fuente de verdad de las reglas de producto** en este repo:
> [`SPEC.md`](SPEC.md).
> **Fuente de verdad de las recetas técnicas** en este repo:
> [`tecnico.md`](tecnico.md).
> **Fuente de verdad del i18n**: [`I18N.md`](I18N.md).
> Este documento **no** redefine esas; codifica el patrón que
> todas comparten.

---

## 0. El patrón en un párrafo

Cada app de la suite Miralante es una **PWA estática, sin
dependencias y offline-first**, construida a partir del mismo
esqueleto mínimo:

1. Un conjunto pequeño de **páginas HTML standalone** en la raíz
   del repo (una sola actividad) o bajo `tools/<slug>/` (hubs
   multi-actividad).
2. Cada página es una **URL real y navegable** — **no hay
   routing SPA**, ni cambio de vista en la misma página, ni
   `pushState`. Cada página se recarga al entrar; la navegación
   entre páginas es un clic normal en un `<a>`.
3. Las rutas ocultas (`about/`, `team/`, `legal/`, `config/`)
   comparten la misma forma: `index.html` + `styles.css` + par
   `strings.<locale>.js`, con **interlinking en el pie** para que
   cualquiera de ellas esté a un clic de cualquier otra.
4. Un **service worker** (`sw.js`, network-first) cachea el
   shell (lista `FILES`, `VERSION` bumped) para que la app
   funcione offline.
5. **Sin paso de build**, sin `package.json`, sin frameworks, sin
   bundlers, sin CDNs de JS. La raíz del repo es el output de
   deploy.

---

## 1. La forma de las páginas standalone

Este es el patrón que siguen todas las rutas ocultas y todas las
rutas públicas. La forma es idéntica en la suite; solo cambian
los contenidos.

### 1.1 El esqueleto de cinco carpetas

Cada app expone las mismas cinco carpetas:

```
<app>/
  index.html              # Entrada pública (la actividad)
  app.js                  # Lógica
  data.js                 # Layouts sin locale + contenido por locale
  strings.es.js           # Textos UI en español (fuente de verdad)
  strings.en.js           # Textos UI en inglés
  styles.css              # Estilos específicos de la app
  assets/
    css/{tokens,base,components}.css
    fonts/                # Atkinson Hyperlegible + Nunito autohospedados
    img/                  # Icono de la app + imágenes decorativas
    js/{utils,i18n,tts,storage,feedback}.js
  about/                  # Ruta oculta: presentación
    index.html
    styles.css
    strings.es.js
    strings.en.js
  team/                   # Ruta oculta: quiénes la hacen
    index.html
    styles.css
    strings.es.js
    strings.en.js
  legal/                  # Página de protección de datos (enlazada desde el pie)
    index.html
    styles.css
    strings.es.js
    strings.en.js
  config/                 # Ajustes (solo en apps que lo necesitan)
    index.html
    app.js
    styles.css
    strings.es.js
    strings.en.js
  manifest.json
  sw.js
  _headers
  404.html
  robots.txt
  sitemap.xml
```

Las apps de una sola actividad (Teclatlon, Okeymoney) ponen el
`index.html` en la raíz del repo. Las apps multi-actividad
(Apptonomia, Calculia) ponen `tools/<slug>/index.html` por
actividad y un landing `site/index.html`; las cuatro carpetas
ocultas viven en la raíz del repo.

### 1.2 La concha HTML de una página standalone

Cada página standalone abre con el mismo boilerplate. Abajo, la
**plantilla**; las desviaciones se indican donde apliquen.

```html
<!DOCTYPE html>
<html lang="es" data-i18n-title="pageTitle">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teclatlon — Sobre este proyecto</title>
  <!-- Hidden route: not linked from the main menu and should not be
       indexed. Aimed at anyone who wants to know what Teclatlon is:
       families, professionals, journalists, funders, contributors. -->
  <meta name="robots" content="noindex, nofollow">
  <meta name="description" content="…">
  <meta name="theme-color" content="#FAF7F2">
  <link rel="stylesheet" href="../assets/css/tokens.css">
  <link rel="stylesheet" href="../assets/css/base.css">
  <link rel="stylesheet" href="../assets/css/components.css">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container {legal|about}">
    <header class="cabecera-{legal|about}">
      <div class="idioma-selector" role="group" aria-label="Elegir idioma">
        <button type="button" class="btn-idioma" id="btnIdiomaEs"
                data-locale="es" aria-pressed="false">🇪🇸 Español</button>
        <button type="button" class="btn-idioma" id="btnIdiomaEn"
                data-locale="en" aria-pressed="false">🇬🇧 English</button>
      </div>
      <img src="../assets/img/icono.svg" alt="" width="80" height="80"
           class="logo-{legal|about}">
      <h1>…</h1>
      <p class="lema" data-i18n="tagline">…</p>
      <p class="entradilla" data-i18n="lead">…</p>
      <nav class="indice">…opcional, solo en páginas largas…</nav>
    </header>

    <main class="pila">
      <section class="card">…</section>
    </main>

    <footer class="pie-{legal|about}">
      <a class="btn btn-secundario" href="../"
         data-i18n="footerActivities">Ir a la aplicación</a>
      <a class="btn btn-secundario" href="../legal/"
         data-i18n="footerDataProtection">Protección de datos</a>
      <a class="btn btn-secundario" href="../about/"
         data-i18n="footerAbout">Sobre este proyecto</a>
      <a class="btn btn-secundario" href="../team/"
         data-i18n="footerTeamGuide">Quiénes la hacen</a>
      <a class="btn btn-secundario" href="../config/"
         data-i18n="footerSettings">Ajustes</a>
    </footer>
  </div>

  <script src="../assets/js/utils.js"></script>
  <script src="../assets/js/i18n.js"></script>
  <script src="strings.es.js"></script>
  <script src="strings.en.js"></script>
  <script>
    (function () {
      'use strict';
      function paintLanguageSelector() {
        var active = App.i18n.locale();
        document.getElementById('btnIdiomaEs')
          .setAttribute('aria-pressed', String(active === 'es'));
        document.getElementById('btnIdiomaEn')
          .setAttribute('aria-pressed', String(active === 'en'));
      }
      document.getElementById('btnIdiomaEs')
        .addEventListener('click', function () { App.i18n.setLocale('es'); });
      document.getElementById('btnIdiomaEn')
        .addEventListener('click', function () { App.i18n.setLocale('en'); });
      paintLanguageSelector();
    })();
  </script>
  <script>
    /* Register the SW from this entry point so it is active for any
       later navigation, matching what the main index.html and the
       other standalone pages already do. */
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('../sw.js').catch(function () {});
    }
  </script>
</body>
</html>
```

**Notas:**

- `data-i18n-title="pageTitle"` en `<html>` permite que
  `assets/js/i18n.js` rellene `document.title` durante `init()`. El
  `<title>` hardcoded es el fallback que la pestaña del navegador
  mostraría antes de que i18n.js se ejecute (y el fallback de la
  cache del SW).
- La clase propia de la página en el wrapper `<div class="container …">`
  es bajo la que `styles.css` de la página scopea sus reglas
  (`legal-page`, `about-page`, `team-page`). Sin prefijos ancestro
  `.sp-*` (eran residuo de la fusión SPA, retirado en 2026-09;
  ver `git log`).
- El pie es **siempre** los mismos cinco enlaces (en el mismo
  orden) en `about/`, `team/` y `legal/`. `config/` tiene un pie
  reducido que solo vuelve a la SPA. La raíz de la app
  (`index.html`) **no** renderiza este pie (tiene su propio pie con
  el botón de reset y el enlace a protección de datos — ver
  `tecnico.md` §2).

### 1.3 El par de strings

Cada carpeta standalone trae su propio par `strings.es.js` /
`strings.en.js`. Siguen el patrón **clave plana, IIFE-register**;
`scripts/check.js` extrae el diccionario vía `vm.createContext`
con un stub `App.i18n.register` y verifica la paridad de claves
entre locales.

```javascript
/* legal/strings.es.js — texto de la página (ES). */
(function () {
  'use strict';
  App.i18n.register({
    pageTitle: 'Protección de datos',
    pageDescription: 'Teclatlon: qué datos guarda, dónde y por qué. …',
    routeNotice: 'Esta página no se enlaza desde la aplicación. …',
    tagline: 'Sin registro. Sin cookies. Sin analítica.',
    lead: 'Teclatlon no pide tus datos personales. …',
    navResponsible: 'Quién trata tus datos',
    navData: 'Qué guardamos',
    /* …más claves… */
    footerActivities: 'Ir a la aplicación',
    footerAbout: 'Sobre este proyecto',
    footerTeamGuide: 'Quiénes la hacen',
    footerSettings: 'Ajustes'
  }, 'es');
})();
```

Las claves son planas (sin namespacing tipo `legal.pageTitle`); la
página **es** el namespace, porque el archivo vive en su propia
carpeta. Las claves comunes (`core.back`, `core.listen`,
`core.dataProtection`) ya vienen en `assets/js/i18n.js` y no se
redefinen aquí.

### 1.4 La hoja de estilos standalone

Cada carpeta standalone trae su propio `styles.css`. Es **el
antiguo `assets/css/subpages.css` dividido por página**, con los
prefijos ancestro `.sp-legal` / `.sp-about` eliminados (eran
residuo de la fusión SPA). La clase wrapper de la página
(`<div class="legal-page">`, `<div class="about-page">`, etc.)
es la que usa el CSS para scope:

```css
.legal-page { max-width: 880px; }
.legal-page .cabecera-legal { … }
.legal-page .indice a { … }
.legal-page section { … }
```

**No** introduzcas nombres de clase por página que colisionen
con los componentes compartidos (`base.css` ya define
`.cabecera`, `.lema`, `.indice`, `.btn`, `.card`, `.pila`, …).
Cuando la página standalone necesite un aspecto distinto, scopea
la regla bajo la clase de la página — nunca bajo un `.cabecera` o
`.indice` genérico.

---

## 2. El núcleo compartido

Cada app de la suite trae los mismos seis ficheros bajo
`assets/js/`, en el mismo orden de carga, con la misma forma
exportada. Adelgazar está permitido; **añadir** funcionalidad de
vuelta está prohibido a menos que sirva a una necesidad concreta
(las notas de adelgazamiento en `tecnico.md` §2.1 son la
justificación canónica).

| Módulo | Superficie | Requerido por |
|---|---|---|
| `utils.js` | `App.utils.shuffle / $ / $$ / reducedMotion / wakeLock` | cada página |
| `i18n.js` | `App.i18n.{locale, setLocale, lang, register, t, pick, apply, SUPPORTED, DEFAULT_LOCALE, LABEL, FLAG}` | cada página |
| `tts.js` | `App.tts.speak` | solo páginas que leen en voz alta (la mayoría) |
| `storage.js` | `App.storage.{get, set, remove}` | solo páginas que leen o escriben `localStorage` (`index.html`, `config/`) |
| `feedback.js` | `App.feedback.{success, encourage, celebrate}` | solo el `app.js` de la actividad |

El orden de carga es `utils.js → i18n.js → tts.js → storage.js →
feedback.js → strings.<locale>.js → data.js → app.js`. `i18n.js`
debe cargar **antes** que `tts.js` y `feedback.js`, que leen el
idioma activo.

Tanto `strings.es.js` como `strings.en.js` cargan siempre (no
están gateados por `locale`); `App.i18n.locale()` decide cuál
está activo. El locale se elige primero de
`localStorage['teclatlon:locale']`, luego de `navigator.language`
(fallback `'es'`).

---

## 3. El contrato de la PWA

El service worker es **network-first, cache-fallback**, declarado
en `sw.js` y commiteado junto a `manifest.json`. El contrato:

```javascript
var VERSION = 'teclatlon-vN';
var FILES = [
  './index.html',
  './404.html',
  './manifest.json',
  './app.js',
  './data.js',
  './strings.es.js',
  './strings.en.js',
  './styles.css',
  /* una entrada por fichero del shell, incluyendo cada
     index.html / styles.css / par strings.<locale>.js de las
     páginas standalone */
  './legal/index.html',
  './legal/styles.css',
  './legal/strings.es.js',
  './legal/strings.en.js',
  /* …about/, team/, config/ igual… */
  './assets/css/tokens.css',
  './assets/css/base.css',
  './assets/css/components.css',
  './assets/fonts/…woff2',
  './assets/js/utils.js',
  './assets/js/i18n.js',
  './assets/js/tts.js',
  './assets/js/storage.js',
  './assets/js/feedback.js',
  './assets/img/icono.svg'
];
```

Dos reglas gobiernan cambios en `FILES`:

1. **Fichero nuevo → añadirlo a `FILES`.** El handler `install`
   mete cada fichero individualmente (nunca `cache.addAll`, que
   aborta en el primer fallo y rompe la cache para todos).
2. **Cualquier cambio en un fichero cacheado → bumpear
   `VERSION`** (`'teclatlon-vN'` → `'teclatlon-vN+1'`). Sin el
   bump, un usuario offline queda atascado en la versión vieja
   para siempre, porque el handler `activate` solo purga caches
   con un nombre distinto.

`scripts/check-version-bump.js` aplica (2): hace `git show HEAD:sw.js`
para ver qué `VERSION` había en el último commit, lo compara
contra el `VERSION` actual, y verifica que `FILES` y el diff
contra HEAD coincidan. Si no coinciden, el script falla y el job
`cache-bump` de CI también falla.

Cada página standalone también ejecuta
`navigator.serviceWorker.register('../sw.js')` desde su script
inline, así una visita directa a `/legal/`, `/about/` o `/team/`
prima el SW para la raíz de la SPA del mismo modo que hace
`index.html`.

---

## 4. Invariantes de i18n

Estas son no negociables en toda la suite. Un cambio de locale
está incompleto hasta que **todos** los ficheros de esta lista
estén actualizados:

1. `assets/js/i18n.js#SUPPORTED` y `#DEFAULT_LOCALE`.
2. `assets/js/i18n.js#BCP47` (para selección de voz en
   `speechSynthesis`).
3. El detector pre-paint en `index.html` (el `<script>` inline
   que elige el locale antes del primer paint — ver `tecnico.md`
   §2.5 de cada repo).
4. `strings.<locale>.js` y cada par `strings.<locale>.js` por
   carpeta (`legal/`, `about/`, `team/`, `config/`).
5. `data.js`: cada array dividido por locale
   (`DATA.lessons.<locale>`, `DATA.words.<locale>`,
   `DATA.templates.<locale>`, `DATA.numpadSteps.<locale>`).
6. `sw.js`: añadir los nuevos `strings.<locale>.js` a `FILES` y
   bumpear `VERSION`.
7. `scripts/check.js`: la verificación de paridad funciona en N
   locales sin cambios de código (los coge todos vía
   `fs.readdirSync`); confirmar que el script sigue pasando tras
   añadir el locale.

La receta paso a paso completa (con código de ejemplo) está en
[`I18N.md`](I18N.md).

---

## 5. Lo que está **prohibido** (en toda la suite)

Estos son antipatrones observados en algún momento y retirados
explícitamente; el historial de commits es la fuente de verdad de
cada retirada. La regla es: "si te ves tentado de usar uno de
estos, para y vuelve a leer esta sección".

- **Sin SPA / sin `pushState` / sin secciones `view-*`.** Cada
  página es su propia URL. No fusionar `legal/`, `about/`,
  `team/` dentro de `index.html` como secciones ocultas, ni
  siquiera con un redirect shim. Se intentó en 2026-09
  (`spa: merge`) y se revirtió en la misma release; ver `git log`
  para las lecciones aprendidas. La navegación entre páginas
  debe ser siempre un clic real en un `<a>`, y cada ruta oculta
  debe estar a un clic de cualquier otra vía el pie compartido.
- **Sin `App.goLegal` / `App.goAbout` / `view-legal` /
  `view-about` / `sp-legal` / `sp-about` / `sp-idioma` /
  `subpages.css`.** Todos pertenecen al modelo de fusión SPA
  retirado.
- **Sin `_redirects` SPA catch-all.** Cloudflare lo rechaza como
  loop; documentado en `CLOUDFLARE.md` y en la receta de deploy.
- **Sin flash de `data-app-blocked="mobile"`.** El script
  pre-paint es un único `<script>` inline en `<head>`; no lo
  dividas en un `.js` aparte (CSP `script-src 'self'` lo
  permitiría, pero la garantía de timing síncrono solo se
  cumple con scripts inline en la cabeza).
- **Sin `package.json`, sin `node_modules`.** El repo es el
  output de build. Un package manifest forzaría a Cloudflare a
  ejecutar `npm install` en cada build, sobrepasando el límite
  de 25 MiB de assets.
- **Sin CDNs de JS.** Todas las fuentes, iconos y JS vienen en
  `assets/`.
- **Sin imports de ES modules** (`<script type="module">`). La
  app debe funcionar desde `file://` para uso offline; los ES
  modules rompen eso.
- **Sin base de datos en tiempo real, sin login, sin cookies,
  sin analítica.** La persistencia es solo `localStorage`.
- **Sin teclado en pantalla táctil** en apps que apuntan al
  teclado físico del ordenador (Teclatlon, importes tipeados de
  Okeymoney, palabras tipeadas de Sinonimia). El teclado en
  pantalla es solo decorativo.

---

## 6. Checklist de validación

Ejecutar esto en cada PR que toque cualquiera de los ficheros de
superficie (`*.html`, `*.js`, `*.css`, `sw.js`, `manifest.json`,
`data.js`):

```bash
node scripts/check.js           # debe reportar OK (N checks, sin fallos)
node scripts/check-version-bump.js   # debe pasar
```

Después abrir las páginas afectadas en un navegador en
`http://localhost:<puerto>/<ruta>` y recorrer el smoke manual:

- `index.html` arranca en la pantalla de nombre o en el menú
  según el estado guardado; el roundtrip de `localStorage`
  funciona; el botón "🗑️ Borrar mi progreso" resetea tanto los
  datos como la UI.
- `/legal/` carga con el h1, lema y pie localizados; el selector
  de idioma cambia `lang`, `document.title` y cada texto
  `data-i18n` sin parpadeo de valores antiguos.
- `/about/` y `/team/` igual; sus enlaces del pie navegan entre
  ellos y a `/legal/` y `/config/` sin recargas antes de que el
  SW se prime.
- `/config/` lista el estado guardado y sus dos botones de
  reset funcionan (confirmación en dos pasos).
- Refrescar una vez tras la primera carga y verificar que
  `navigator.serviceWorker.controller` no es null.

Si algo falla, el cambio no encaja con el patrón de la suite y
debe revisarse antes de aterrizarlo.

---

## 7. Diferencias entre repos (lo que este doc **no** cubre)

Cada app es una variante de una sola actividad del patrón de arriba.
Las diferencias por app — qué se comparte con la suite, qué se
adelgaza, y qué es intencionalmente distinto — se documentan en el
`tecnico.md` § "Other apps of the suite: real differences" (la
"diferencia específica del proyecto") de cada repo. Usa esa
sección para decidir si una desviación en un repo es intencional
antes de copiarla a otro.

La fuente canónica de este patrón vive **en este fichero**, en
todos los repos de la suite, mantenido en sincronía. Si lo cambias
en un repo, espejéalo en los demás en el mismo PR.

---

## Ver también

- [`tecnico.md`](tecnico.md) — Recetas y contratos específicos de
  Teclatlon que se construyen sobre este patrón.
- [`I18N.md`](I18N.md) — Cómo añadir un idioma manteniendo las
  invariantes de i18n intactas.
- [`CLOUDFLARE.md`](../../CLOUDFLARE.md) — Contratos de deploy y
  SW/headers a nivel de Cloudflare Workers.
- [`SPEC.md`](SPEC.md) §"Mandatory rule" — Las invariantes de
  accesibilidad y "ninguna mención clínica" que cada página debe
  respetar.
