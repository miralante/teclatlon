# Información técnica

> Documentación para desarrolladores que quieran entender, mantener o
> ampliar Teclatlon. El alcance de producto y las reglas de accesibilidad
> viven en [`SPEC.md`](SPEC.md); este documento es solo arquitectura.

---

## 1. Restricciones técnicas no negociables

- **HTML5 + CSS3 + JavaScript vanilla.** Sin frameworks, sin bundlers,
  sin paso de build, sin backend, sin dependencias npm. No hay
  `package.json` en el repo, así que Cloudflare Pages no ejecuta
  `npm install` durante el build y no hay nada que empaquetar.
- **Scripts clásicos**, no módulos ES (compatibilidad con `file://` y
  navegadores antiguos). Todo el código compartido se expone en
  `window.App.*`.
- **Sin CDNs de JS.** Las fuentes están autoalojadas en `assets/fonts/`.
- **Persistencia solo en `localStorage`.** Sin login, sin cookies, sin
  datos personales, sin analítica.
- **PWA offline-first**: `manifest.json` + `sw.js` (caché cache-first de
  la app shell).
- **Estilo de código**: JS estilo ES5 (`var`, funciones clásicas, IIFE
  con `'use strict'`); identificadores, comentarios y mensajes de commit
  siempre en inglés. El texto de interfaz (`strings.es.js` /
  `strings.en.js`, contenido de lecciones/palabras en `data.js`) se
  queda en el idioma que representa.
- **Solo teclado de ordenador.** El teclado en pantalla es siempre
  decorativo (`pointer-events: none` en CSS); no hay modo de entrada
  táctil. No lo reintroduzcas — ver [`SPEC.md` §2](SPEC.md).

### 1.1 Alojamiento y despliegue — Cloudflare Pages

Desplegado en Cloudflare Pages vía el conector de Git, siguiendo el
mismo patrón que los proyectos hermanos Apptonomia y Sinonimia:

- **Sin paso de build.** La raíz del repo *es* la salida del build.
- **Sin `_redirects`, sin `wrangler.toml`, sin `functions/`.** Cloudflare
  Pages sirve cada archivo estático con búsqueda implícita de
  `index.html` por directorio.
- **Las cabeceras de caché viven en `_headers`** en la raíz del repo.
  `index.html`, `legal/*`, `manifest.json` y `sw.js` se fuerzan a
  `must-revalidate`; los assets JS/CSS/fuentes con huella de versión
  reciben caché inmutable de 1 año.
- **`manifest.json` y `sw.js` deben usar rutas relativas** (empezar con
  `./`) para que la app funcione en cualquier host sin cambios.
- Un despliegue de previsualización puntual desde un worktree sucio, sin
  comprometer configuración de Wrangler:
  `npx wrangler pages deploy . --project-name teclatlon`.

### 1.2 Soporte multi-navegador

El teclado en pantalla, la guía de manos y la gestión de `keydown` físico
deben funcionar en Chromium, Firefox y WebKit (Safari) en escritorio —
esta es una app solo de escritorio, así que la emulación táctil/móvil
queda fuera de alcance. Verifica manualmente en un navegador real antes
de publicar un cambio en `app.js`, `index.html` o `styles.css`.

---

## 2. Arquitectura

```
teclatlon/
├── index.html          # La app en sí — sin landing page separada
├── app.js               # Solo lógica
├── data.js               # Distribuciones de teclado neutrales al idioma +
│                          # contenido de práctica por idioma (lecciones,
│                          # palabras, pasos del numérico)
├── strings.es.js         # Texto de interfaz en español
├── strings.en.js         # Texto de interfaz en inglés
├── styles.css             # Estilos específicos de la app
├── assets/
│   ├── css/tokens.css     #   variables de diseño (colores, tipografía, táctil)
│   ├── css/base.css       #   reset, fuentes autoalojadas, foco visible,
│   │                       #   prefers-reduced-motion
│   ├── css/components.css #   componentes reutilizables (.btn, .card, …)
│   ├── js/utils.js        #   window.App.utils
│   ├── js/i18n.js         #   window.App.i18n
│   ├── js/tts.js          #   window.App.tts
│   ├── js/storage.js      #   window.App.storage
│   ├── js/feedback.js     #   window.App.feedback
│   ├── fonts/              #   woff2 autoalojadas (Atkinson Hyperlegible, Nunito)
│   └── img/icono.svg       #   icono de la app (también icono PWA)
├── legal/                 # Página de protección de datos (enlazada en el pie)
├── manifest.json           # PWA
├── sw.js                    # Service worker: lista de caché + VERSION
└── _headers                 # Cabeceras de caché y seguridad de Cloudflare Pages
```

A diferencia de Apptonomia (muchas actividades bajo `tools/<slug>/`, una
landing compartida), Teclatlon es **una sola actividad en la raíz del
repo**. Tampoco hay ruta oculta `/settings/`: el reinicio de progreso es
el botón inline "🗑️ Borrar mi progreso" en `index.html`.

### 2.1 `assets/` — núcleo compartido

Se carga en este orden exacto (ver `index.html`): `utils.js` →
`i18n.js` → `tts.js` → `storage.js` → `feedback.js` → `strings.es.js` →
`strings.en.js` → `data.js` → `app.js`. `i18n.js` debe cargar antes que
`tts.js`/`feedback.js`, que leen el idioma activo.

Este núcleo se migró desde Apptonomia y se **recortó a propósito** a lo
que esta única actividad realmente usa:

- `utils.js` conserva `shuffle`, `$`, `$$`, `reducedMotion` y el ayudante
  de Wake Lock. Se eliminó `esTactil()` de Apptonomia (detección de
  dispositivo táctil, usada allí para preseleccionar un teclado móvil
  tocable) — aquí no hay modo móvil.
- `storage.js` conserva solo `get`/`set`/`remove`. La agregación
  entre herramientas de Apptonomia (`estrellasTotales`, `listaToolIds`,
  usada por una landing multi-herramienta y una pantalla de ajustes) no
  aplica a una app de una sola actividad y se eliminó.
- `i18n.js` conserva `locale`/`setLocale`/`lang`/`register`/`t`/`pick`/
  `apply`. Se eliminó el sistema legado de fusión de árboles de datos
  estructurados de Apptonomia (`data()`/`datos()`/`registerStructure()`)
  — no se usa aquí.
- `feedback.js` conserva `success`/`encourage`/`celebrate`. Se eliminó
  `lockUntilAck()` de Apptonomia (pausa de lectura en preguntas de
  opción múltiple) — esta actividad no tiene pantallas de opción múltiple.

No vuelvas a añadir nada de lo anterior sin una necesidad concreta: se
recortó a propósito, no por descuido.

### 2.2 `app.js` — IIFE único

Contiene toda la app cliente: cambio de pantallas (`PANTALLAS`), el motor
de secuencias (`iniciarSecuencia`/`teclaJuego`/`pasoCompletado`) usado
por "coloca los dedos", lecciones, palabras y el numérico, el reto de
"todas las teclas" (`jugarReto`/`teclaReto`), el SVG de guía de manos, el
renderizador del teclado visual, y los listeners de `keydown`/`keyup`
físicos que impulsan cada modo de juego. No hay ruta de pulsar-para-
escribir: el teclado en pantalla solo *refleja* pulsaciones
(`flashTecla`), nunca las origina.

### 2.3 `data.js` — distribuciones de teclado y contenido de práctica

- `DATA.rows` / `DATA.numberRow`: la distribución física del teclado
  español (`{ ch, finger, wide?, bump?, label?, decor? }` por tecla).
  `finger` es mano (`l`/`r`) + dedo (`p` meñique, `r` anular, `m` medio,
  `i` índice), o `th` para los pulgares (espacio).
  `bump`: marca táctil (F, J, el 5 del numérico). `decor`: tecla
  decorativa sin `ch` (Tab, Mayús, Intro, Borrar) — da forma al teclado
  pero nunca es objetivo de un ejercicio.
- `DATA.layouts`: los teclados visuales seleccionables —
  `simplificado` (solo letras), `normal` (distribución física completa
  con teclas decorativas), `extendido` (igual que `normal`, con el
  numérico mostrado aparte). Los tres son distribuciones
  físicas/decorativas; no hay ninguna distribución tocable.
- `DATA.placement` / `DATA.lessons` / `DATA.words` / `DATA.numpadSteps`:
  contenido de práctica por idioma (`{ es: [...], en: [...] }`), leído
  con `DATA.<campo>[App.i18n.locale()]`.
- Los nombres de los dedos viven en `strings.<locale>.js` bajo
  `dedo.<id>.mano` / `.nombre`, no en `data.js`.

Para ampliar: añade una lección o palabra a los arrays de **ambos**
idiomas (`es` y `en`).

### 2.4 Ancla de aprendizaje significativo: `transferencia`

Cada finalización (una lección, el juego de palabras, el numérico o el
reto de "todas las teclas") añade `App.i18n.t('transferencia')` al
mensaje de celebración de cierre (`celebrarConTransferencia()` en
`app.js`) — una frase corta que conecta el ejercicio con escribir
mensajes reales en un ordenador real. Esta actividad no tiene una
pantalla separada de "ronda completada", así que la frase vive en el
propio texto de la superposición de celebración, no en un elemento del
DOM dedicado.

---

## 3. Internacionalización

Mismo patrón multi-archivo que Apptonomia: `strings.es.js` y
`strings.en.js` registran cada uno un idioma con
`App.i18n.register(dict, 'es' | 'en')`; ambos archivos se cargan siempre
(ver `index.html`), y `App.i18n.locale()` decide cuál está activo.
`scripts/check.js` comprueba la paridad de claves entre ambos archivos
(la app raíz y `legal/`). Los placeholders entre llaves (`'{n} veces'`)
se sustituyen en `app.js` con `.replace('{n}', valor)`.

Claves comunes ya registradas en `core.*` en `assets/js/i18n.js` (no las
redefinas en `strings.<locale>.js`): `back`, `understood`, `listen`,
`listenInstructions`, `listenText`, `rest`, `dataProtection`.

---

## 4. PWA y service worker

- `sw.js` es cache-first para la app shell. Contrato al tocar archivos:
  1. Archivo nuevo → añádelo a la lista `ARCHIVOS`.
  2. Cualquier cambio a un archivo cacheado → sube `VERSION`
     (`teclatlon-vN`), o quienes tengan la PWA instalada no recibirán el cambio.
- `manifest.json` usa un único icono SVG (`sizes: "any"`) — esta es una
  app solo de escritorio, así que no hace falta el conjunto de PNG
  192/512 que necesitaría un destino de pantalla de inicio de iOS.

---

## 5. Verificación

```bash
node scripts/check.js
```

No hace falta `npm install`. Para una pasada manual: abre `index.html` en
un navegador, recorre la pantalla de nombre, cada modo de juego y la
escritura libre, en `es` y en `en`, verificando el flujo con teclado
físico (sin pulsar-para-escribir), los botones de audio, y que
"🗑️ Borrar mi progreso" reinicia realmente el estado.

---

## 6. Despliegue

Cloudflare Pages, mismo patrón que Apptonomia y Sinonimia: la raíz del
repositorio es la salida del build, sin bundler. Un push a `master`
dispara el build a través del conector de Git de Cloudflare; los pull
requests obtienen un canal de previsualización automático. Un despliegue
— incluso a un canal de previsualización — es una operación de red: pide
confirmación antes de ejecutarlo (ver `CLAUDE.md` §"Agent workflow").

---

## 7. Licencia

MIT. Ver [`LICENSE`](../../LICENSE).
