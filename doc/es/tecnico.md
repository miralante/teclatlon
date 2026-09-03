# Información técnica

> Documentación para quienes quieran entender, mantener o ampliar Teclatlon.

| Documento | Qué contiene | Cuándo leerlo |
|---|---|---|
| [`doc/es/SPEC.md`](SPEC.md) | Alcance de producto, audiencia y reglas no negociables | Cuando cambie qué hace la app o para quién |
| [`doc/es/tecnico.md`](tecnico.md) (este) | Arquitectura, núcleo compartido, contratos y recetas de desarrollo | Cuando modifiques el código |
| [`doc/es/I18N.md`](I18N.md) | Cómo añadir un idioma soportado | Cuando añadas una traducción |
| [`doc/es/SPEC.md` §2](SPEC.md) | Regla "solo ordenador", gate de móvil | Cuando toques el teclado en pantalla o el gate |
| `CLAUDE.md` en la raíz del repo | Flujo operativo para agentes de IA | Solo cuando un agente de IA haga el cambio |
| `git log` | Historial del proyecto | Cuando se pregunte "¿por qué?" sobre una decisión pasada |

Cada tema tiene una fuente canónica: producto en `SPEC.md`, cuestiones técnicas en este documento, i18n en `I18N.md`. La hoja de ruta cerrada del proyecto vive en `git log`. `CLAUDE.md` solo define el flujo para agentes de IA y no redefine estas reglas.

---

## 1. Restricciones técnicas no negociables

- **HTML5 + CSS3 + JavaScript vanilla.** Sin frameworks, sin bundlers,
  sin paso de build, sin backend, sin dependencias npm. No hay
  `package.json` en el repo, así que Cloudflare no ejecuta
  `npm install` durante el build y no hay nada que empaquetar.
- **Scripts clásicos**, no módulos ES (compatibilidad con `file://` y
  navegadores antiguos). Todo el código compartido se expone en
  `window.App.*`.
- **Sin CDNs de JS.** Las fuentes están autoalojadas en `assets/fonts/`.
- **Persistencia solo en `localStorage`.** Sin login, sin cookies, sin
  datos personales, sin analítica.
- **PWA offline-first**: `manifest.json` + `sw.js` (network-first con
  caché de respaldo para la app shell). El contrato completo de
  caché — qué cachea cada capa, cuándo bumpear `VERSION`, cómo
  verificar — vive en [`CLOUDFLARE.md` §"Contrato de caché"](../../CLOUDFLARE.md#contrato-de-caché).
- **En línea el usuario ve la versión nueva automáticamente al recargar.
  No necesitas bumpear `VERSION` para que la actualización llegue.**
  Solo importa bumpearlo para que el usuario offline vea la versión
  actualizada cuando no tenga red.
- **Sube `VERSION` en cada commit que toque un archivo cacheado.**
  Misma regla que Calculia y Apptonomia, por homogeneidad, aunque
  en Teclatlon (network-first) el impacto es solo offline. Mantenemos
  la regla uniforme en los tres proyectos para que la directriz sea
  de una línea y el agente nunca tenga que razonar caso por caso
  sobre la estrategia del SW. Coste de subir: un entero. Coste de no
  subirlo: el usuario offline queda atrapado en la versión vieja para
  siempre, porque el handler `activate` solo purga cachés con nombre
  distinto de `VERSION`. Sube liberalmente.
- **Estilo de código**: JS estilo ES5 (`var`, funciones clásicas, IIFE
  con `'use strict'`); identificadores, comentarios y mensajes de commit
  siempre en inglés. El texto de interfaz (`strings.es.js` /
  `strings.en.js`, contenido de lecciones/palabras en `data.js`) se
  queda en el idioma que representa.
- **Solo teclado de ordenador.** El teclado en pantalla es siempre
  decorativo (`pointer-events: none` en CSS); no hay modo de entrada
  táctil. No lo reintroduzcas — ver [`SPEC.md` §2](SPEC.md).

### 1.1 Alojamiento y despliegue

La app se sirve como sitio estático en **Cloudflare Workers (static
assets)** vía el conector de Git — accesible en
`https://teclatlon.miralante.workers.dev`, no en Cloudflare Pages
clásico — sin paso de build (la raíz del repo *es* la salida del
build). El detalle de operación — por qué existe `wrangler.toml`
(binding de static assets + gestión del 404) y sigue sin haber
`_redirects`, `functions/` ni `package.json`; la configuración del
dashboard; la nota sobre `sw.js` y la redirección del SW — vive en
[`CLOUDFLARE.md`](../../CLOUDFLARE.md). Aquí basta con saber tres
cosas:

- `_headers` en la raíz del repo controla la caché y los headers de
  seguridad (HTML/SW/manifest con `must-revalidate`; `*.js`/`*.css`
  con caché corta `max-age=300`; imágenes/fuentes con caché
  inmutable de 1 año).
- `manifest.json` y `sw.js` deben usar rutas relativas (empezar con
  `./`) para que la app funcione en cualquier host sin cambios.
- `404.html`, `robots.txt` y `sitemap.xml` siguen el mismo patrón que
  las otras apps de la suite (Calculia / Sinonimia) (se añaden a la
  lista `FILES` del `sw.js` para que sigan funcionando offline).
- Un despliegue — incluso a un canal de previsualización — es una
  operación de red: pide confirmación antes de ejecutarlo (ver
  `CLAUDE.md` §"Agent workflow").

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
├── 404.html                  # Fallback amigable para rutas obsoletas (mismo patrón que calculia/sinonimia)
├── robots.txt                # Permite todo, apunta a sitemap.xml
├── sitemap.xml               # Páginas indexables (app, legal, doc/{en,es}/SPEC.md)
├── CONTRIBUTING.es.md         # Cómo contribuir (español, fuente de verdad)
├── CONTRIBUTING.md            # Traducción al inglés
├── SECURITY.es.md             # Política de seguridad (español, fuente de verdad)
├── SECURITY.md                # Traducción al inglés
└── _headers                 # Cabeceras de caché y seguridad de Cloudflare
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

Contiene toda la app cliente: cambio de pantallas (`SCREENS`), el motor
de secuencias (`startSequence`/`gameKey`/`stepCompleted`) usado
por "coloca los dedos", lecciones, palabras y el numérico, el reto de
"todas las teclas" (`playChallenge`/`challengeKey`), el SVG de guía de manos, el
renderizador del teclado visual, y los listeners de `keydown`/`keyup`
físicos que impulsan cada modo de juego. No hay ruta de pulsar-para-
escribir: el teclado en pantalla solo *refleja* pulsaciones
(`flashKey`), nunca las origina.

El panel de ajustes (`#settingsDrawer`, un desplegable lateral que se
abre con el icono de engranaje `#btnOpenSettings` de la cabecera — ver
SPEC.md §4.1) se lee de `state.options` y se aplica con
`applyOptions()`, llamada al arrancar y tras cada cambio.
`openSettings()`/`closeSettings()` gestionan la animación de
apertura/cierre, el clic en el fondo oscurecido y el foco (al abrir el
foco pasa al botón de cerrar del desplegable; al cerrar, vuelve a
quien lo abrió); el manejo de `Tab`/`Escape` del desplegable vive al
principio del listener `keydown` físico (ver más abajo), antes de la
lógica de juego, porque el desplegable se puede abrir en mitad de una
partida. Interacciones con el motor:

- `state.metrics` (keys / hits / misses / startMs) se
  reinicia en cada partida, lo actualizan `gameKey` / `challengeKey`,
  y se muestra como precisión (%) y teclas por minuto en vivo cuando
  `state.options.metrics` vale `true`.
- `award(key)` marca un modo como completado (id que pasa a `true`
  en `state.completed`); es lo que enciende la ⭐ de ese modo en el
  menú.
- `feedback.success(zone, pan)` acepta un paneo estéreo opcional. Lo
  calcula el llamador desde la columna de la tecla
  (`App.utils.columnOf` + `App.utils.panOfColumn`, o `panOf` en
  `app.js`); el audio solo pasa por `StereoPannerNode` cuando
  `state.options.spatialSound` vale `true`.

### 2.3 `data.js` — distribuciones de teclado y contenido de práctica

- `DATA.rows` / `DATA.numberRow`: la distribución física del teclado
  español (`{ ch, finger, wide?, bump?, label?, decor? }` por tecla).
  `finger` es mano (`l`/`r`) + dedo (`p` meñique, `r` anular, `m` medio,
  `i` índice), o `th` para los pulgares (espacio).
  `bump`: marca táctil (F, J, el 5 del numérico). `decor`: tecla
  decorativa sin `ch` (Tab, Mayús, Intro, Borrar) — da forma al teclado
  pero nunca es objetivo de un ejercicio.
- `DATA.layouts`: los teclados visuales seleccionables —
  `simple` (letras y las dos teclas Mayús — necesarias para que
  la lección de mayúsculas tenga una tecla Mayús que señalar incluso en
  esta vista reducida), `normal` (distribución física completa con
  teclas decorativas), `extended` (igual que `normal`, con el numérico
  mostrado aparte). Los tres son distribuciones físicas/decorativas; no
  hay ninguna distribución tocable.
  Los tres botones de la UI se etiquetan, en lenguaje claro para
  principiantes, como "Solo letras" / "Letras y números" /
  "Con números al lado" (ver `btnSimple`/`btnNormal`/`btnExtended` en
  `strings.<locale>.js`); bajo el botón seleccionado se muestra una
  frase de una línea (p. ej. "Solo se ven las letras. Es lo más
  sencillo.") mediante `.keyboard-detail`, de modo que cada opción se
  explica con palabras cotidianas.
- `DATA.placement` / `DATA.lessons` / `DATA.words` / `DATA.numpadSteps` /
  `DATA.templates`: contenido de práctica por idioma
  (`{ es: [...], en: [...] }`), leído con `DATA.<campo>[App.i18n.locale()]`.
- Los nombres de los dedos viven en `strings.<locale>.js` bajo
  `finger.<id>.hand` / `.name`, no en `data.js`.

Para ampliar: añade una lección o palabra a los arrays de **ambos**
idiomas (`es` y `en`).

**Mayúsculas (Shift):** el `seq` de un paso de lección puede contener
una letra en mayúscula (p. ej. `'A'`) para exigir Mayús en esa tecla —
ver la lección `l16`/"Capitals". No existe una tecla
física distinta para la mayúscula; `gameKey(ch, shiftHeld)` compara la
tecla pulsada normalizada (en minúscula) contra `seq[pos].toLowerCase()`
y además exige `shiftHeld` (el `e.shiftKey` del keydown) solo cuando
`seq[pos]` es en sí mayúscula — un paso en minúscula nunca comprueba
el estado de Mayús, así que mantenerla pulsada por accidente no cuenta
como fallo. `oppositeShiftSide(finger)` en `app.js` codifica la
convención estándar de mecanografía (pulsar Mayús con el meñique del
lado *contrario* al de la mano de la letra); `handsSVG`/`renderHands`
resaltan ese segundo dedo con menor opacidad (`.finger.active-shift`)
junto al dedo principal, y `#guideText` añade una frase que lo nombra.

**Teclas especiales (Inicio/Fin/Re Pág/Av Pág/Supr):** un paso de
lección puede ser `{ specialKey: 'home' }` en vez de `{ seq: '...' }`
— ver la lección `l17`/"Special keys" y
`isSpecialStep(p)` en `app.js`. Estas teclas no escriben un carácter,
así que el paso se completa de una vez con el keydown correcto en
lugar de recorrer un índice de `seq` — y, como no existe una
convención de dedo consistente para ellas, el resaltado de dedo de la
guía se omite por completo (`renderHands(null, null)`); solo la tecla
correspondiente en pantalla recibe el resaltado `.target`. Solo
`DATA.layouts.extended` dibuja estas teclas (una fila `specialKeyDef(id)`
añadida al principio en `data.js`); llevan un `ch` real (a diferencia
de otras teclas decorativas) para que `markTarget`/`flashKey`
puedan apuntarlas, pero `special: true` las mantiene fuera del reto de
"todas las teclas" (`typeableKeys`/`updateChallenge` omiten
`k.special`). La tabla `SPECIAL_KEY_DOM` de `normalizeKey` es el
único lugar que traduce los valores en bruto de `KeyboardEvent.key`
(`'Home'`, `'PageUp'`, …) a los ids internos usados en todo lo demás
(`data-ch`, `specialKey`, `keyLabel.*`).

**Plantillas extensibles (modo "Textos reales"):**
`DATA.templates.<locale>` es un array de `{ id, title, lines }` — una
tarea de escritura real y completa (un correo, una carta…) en vez de
una sola palabra o frase de práctica. A diferencia de `DATA.lessons`,
estas **no** están encadenadas en un desbloqueo lineal (ver
`renderTemplates()` en `app.js`): cada entrada está siempre abierta,
porque son textos de práctica independientes, no un currículo
graduado. `lines` es el texto dividido en líneas cortas;
`playTemplate(p)` convierte cada línea en un paso del motor de
secuencias (`{ seq: line }`), el mismo mecanismo que ya usa el paso
de texto plano de una lección — no hizo falta código nuevo en el
motor, solo una tarjeta de menú nueva, una pantalla nueva
(`#screenTemplates`, calcada de `#screenLessons`) y esta tabla
de datos. **Para añadir una plantilla nueva:** añade
`{ id, title, lines }` a los arrays de **ambos** idiomas (`es` y `en`)
en `data.js`; mantén `lines` a caracteres que el teclado modela
(letras minúsculas, `ñ`, la puntuación de `DATA.rows`: `,` `.` `-`,
mayúsculas con Shift — ver la lección "Mayúsculas" — y vocales
acentuadas del español á/é/í/ó/ú, que son ortografía correcta y se
esperan en un texto real en español). `expectedBaseChar()` en
`app.js` quita el acento antes de buscar el dedo/tecla en pantalla,
ya que no hay una tecla `é` aparte — es la `e` compuesta con la tecla
muerta del acento, la misma idea que una mayúscula resolviendo a su
letra base. Evita igualmente `¡`, `¿`, `!` y `?`: a diferencia de los
acentos, esas no tienen ninguna tecla física en `DATA.rows` y se
tragarían la pulsación sin avisar. `id` debe ser único y estable — se
reutiliza como clave de finalización/progreso (`'template_' + id`).

### 2.4 Ancla de aprendizaje significativo: `transferMessage`

Cada finalización (una lección, el juego de palabras, el numérico o el
reto de "todas las teclas") añade `App.i18n.t('transferMessage')` al
mensaje de celebración de cierre (`celebrateWithTransfer()` en
`app.js`) — una frase corta que conecta el ejercicio con escribir
mensajes reales en un ordenador real. Esta actividad no tiene una
pantalla separada de "ronda completada", así que la frase vive en el
propio texto de la superposición de celebración, no en un elemento del
DOM dedicado.

### 2.5 Gate "solo ordenador" y bootstrap pre-paint de i18n

El `<head>` de `index.html` incluye un `<script>` inline, sin
dependencias y síncrono, que se ejecuta **antes del primer paint** y
hace dos cosas:

1. **Elige el idioma de la interfaz** desde `navigator.languages`
   (primer prefijo de 2 letras que esté en `SUPPORTED = ['es', 'en']`,
   con `es` como fallback) y lo aplica a `document.documentElement.lang`
   para que coincida con el `<title>` que rellenará `App.i18n.apply()`.
   La misma lógica vive en `assets/js/i18n.js#detect()` — si añades un
   idioma soportado, actualiza ambos sitios.
2. **Detecta móvil/tablet** combinando UA (`mobile|tablet|android|…`),
   `pointer: coarse`, `maxTouchPoints` y `matchMedia('(max-width: 900px)')`.
   Si dispara, pone `data-app-blocked="mobile"` en `<html>` y cambia el
   `<title>` a "Solo en el ordenador — Teclatlon" (o "Computer only —
   Teclatlon" en inglés) para que la pestaña del navegador también avise.
   Las UA de escritorio (`windows nt|macintosh|x11|cros `) pasan
   aunque tengan pantalla táctil — un Surface, MacBook con Touch Bar o
   Chromebook convertible con teclado físico siguen siendo "ordenador".

Este mismo script también lee `localStorage['teclatlon:keyboard']`
directamente (la misma clave que escribe `assets/js/storage.js`,
envuelta en el mismo patrón try/catch por si el modo privado falla) y
aplica `options.theme`/`.textSize`/`.focusMode` a `<html>` antes
del primer paint — si no, la página parpadearía con el tema/tamaño de
texto/tipografía por defecto un instante antes de que
`app.js#applyOptions()` se ejecute en `DOMContentLoaded`. El modo
foco usa el selector `html.focus-mode` (no `body.focus-mode`)
precisamente para que este script pre-paint pueda activarlo antes de
que exista el `<body>`.

El HTML lleva al inicio del `<body>` un overlay estático
(`#mobileBlock`) con `hidden`, los textos `data-i18n` (`computerOnly`,
`computerOnlyReason`, `computerOnlySuggestion`) y `role="alertdialog"`.
La regla CSS
`html[data-app-blocked="mobile"] .container { display: none }`
oculta la app shell al instante; `app.js` quita el `hidden` del overlay
en el bloque "Boot" y, si está bloqueado, hace `return` antes de
inicializar listeners, contextos de audio o el motor de juego (no
queremos reservar recursos en un dispositivo que no va a usar la app).
Los estilos del overlay (`mobile-block*`) viven al final de `styles.css`
y tienen colores de fallback por si `tokens.css` aún no ha cargado.

---

## 3. Internacionalización

Arquitectura multilingüe que sale al mercado con el **par base**
`es`/`en` (español, por defecto y fuente de la verdad, e inglés). El
núcleo i18n (`App.i18n`) está diseñado para soportar **N idiomas** —
los puntos que cambian (`SUPPORTED`, el detector pre-paint, `lang()`,
`scripts/check.js`, `sw.js#FILES`, los botones del selector de idioma)
y la receta paso a paso viven en [`I18N.md`](I18N.md), la referencia
canónica para extender la app a idiomas adicionales. Léase junto a
`SPEC.md` §6 (política de idioma) y esta sección.

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

El idioma activo sigue eligiéndose por defecto según el navegador
(`i18n.js#detect`, reflejado antes del primer pintado en `index.html`
— ver §2.5), pero se puede cambiar a mano: la fila "Idioma" del panel
de ajustes (`#settingsDrawer`, botones `.btn-language`, cableados en
`app.js`) y el selector explícito de `legal/index.html`
(`#btnLangEs`/`#btnLangEn`) llaman a `App.i18n.setLocale('es' | 'en')`.
`setLocale` guarda la elección en `localStorage` (`teclatlon:locale`,
que `i18n.js#locale()` lee antes de detectar) y recarga la página — no
hay re-render en caliente.

Para añadir un idioma nuevo: ver la receta completa en
[`I18N.md` §5](I18N.md). En resumen, hay que actualizar los dos arrays
`SUPPORTED` (`i18n.js` y el script de `index.html`) más el mapa
interno de `lang()`, `sw.js#FILES` y su `VERSION`, crear
`strings.<locale>.js` y `legal/strings.<locale>.js`, añadir los arrays
por idioma en `data.js`, y añadir un botón `.btn-language` en
`index.html`.

---

## 4. PWA y service worker

- `sw.js` es **network-first con caché de respaldo** (no cache-first:
  esa frase en documentos antiguos es incorrecta). El handler de
  fetch va a la red primero y replica la respuesta en la caché del
  SW, así la última versión del servidor es autoritativa siempre
  que el dispositivo tenga red; la caché solo entra cuando la red
  no responde.
- Contrato al tocar archivos:
  1. Archivo nuevo → añádelo a la lista `FILES`.
  2. Cualquier cambio a un archivo cacheado → sube `VERSION`
     (`teclatlon-vN`), o quienes tengan la PWA instalada no recibirán el cambio.
     `VERSION` es el único mecanismo que purga la caché SW vieja la
     próxima vez que se abra la app; sin bump, un redespliegue
     permanece invisible para los clientes que ya tienen el SW
     instalado.
- `manifest.json` usa un único icono SVG (`sizes: "any"`) — esta es una
  app solo de escritorio, así que no hace falta el conjunto de PNG
  192/512 que necesitaría un destino de pantalla de inicio de iOS.

---

## 5. Verificación

```bash
# Servidor local (cualquiera de los dos sirve; sin paso de compilación)
python -m http.server 8080     # → http://localhost:8080/index.html
npx serve .

# Comprobación estructural y de i18n (no hace falta npm install — solo stdlib)
node scripts/check.js
```

`scripts/check.js` comprueba: que cada archivo `.js` sea válido, que
`strings.es.js` y `strings.en.js` tengan las mismas claves (app raíz y
`legal/`), que cada ruta de `FILES` en `sw.js` exista en disco, y
que cada icono de `manifest.json` exista. La CI
(`.github/workflows/validate.yml`) ejecuta el mismo comando en cada
push y pull request.

Aún no automatizado (comprobación manual antes de publicar un cambio):
recorrido real por el navegador de la pantalla de nombre, cada modo de
juego (lecciones, palabras, numérico, reto de todas las teclas) y la
escritura libre, en `es` y en `en`, verificando el flujo con teclado
físico (sin pulsar-para-escribir), los botones de audio, y que "🗑️
Borrar mi progreso" reinicia realmente el estado. Ver `SPEC.md`
para la lista completa de comprobación manual y `§1.2` arriba para
la expectativa multi-navegador.

---

## 6. Despliegue

Ver [`CLOUDFLARE.md`](../../CLOUDFLARE.md) para el detalle de
operación (configuración del dashboard, advertencias de deploy, nota
sobre el SW). Recapitulando: la raíz del repo es la salida del build,
un push a `master` dispara el build vía el conector de Git de
Cloudflare, los pull requests obtienen un canal de previsualización
automático. Un despliegue — incluso a un canal de previsualización —
es una operación de red: pide confirmación antes de ejecutarlo.

---

## 7. Otras apps de la suite: diferencias reales

Teclatlon es una de las apps de la suite Miralante (junto a Apptonomia,
Calculia, Okeymoney, Sinonimia y Memofun), todas con la misma filosofía
de accesibilidad y sin backend, y el mismo despliegue en Cloudflare
Workers (static assets). La guía canónica del grupo vive en el
[`technical.md` de Apptonomia](https://github.com/thenkdframe/apptonomia/blob/master/doc/en/technical.md);
esta sección es el delta específico del proyecto: la tabla de abajo
recoge las **diferencias reales** entre este repo y las otras apps de
la suite, para saber qué se comparte, qué se recorta y qué se hace
intencionadamente distinto.

Las otras apps de la suite:

- **Apptonomia** (la referencia, hub-and-spoke, y además portal de la
  suite): `tools/<slug>/` por actividad (~60), landing en `site/`,
  `settings/`, `about/`, `team/`, `content/`, `legal/` compartido.
- **Calculia** (hub-and-spoke, un solo dominio): el más cercano en
  forma a Apptonomia, reducido a 12 actividades de cálculo / lógica
  en dos bloques.
- **Okeymoney** (single-activity, dominio dinero/finanzas personales):
  la app de la suite más cercana a Teclatlon — ambas single-activity,
  ambas con `assets/js/` recortado, ambas comparten la misma forma de
  Cloudflare Workers (static assets) y ambas incluyen un
  `wrangler.toml` con binding `[assets]` (ver la tabla de abajo).
- **Sinonimia** (layout plano antiguo): PWA pre-patrón, usa
  `css/` / `js/` / `img/` planos en raíz en lugar de `assets/`, sin
  `sw.js` ni `manifest.json` (sin contrato PWA), un
  `scripts/validar.js` distinto en lugar de `scripts/check.js`.

### Qué exporta de verdad cada núcleo `assets/js/*`

| Módulo | Teclatlon | Okeymoney | Apptonomia | Calculia | Sinonimia |
|---|---|---|---|---|---|
| `utils.js` (`shuffle, $, $$, reducedMotion`) | ✅ recortado | ✅ completo | ✅ completo | ✅ completo | n/a (plano `js/`) |
| `i18n.js` (`locale, setLocale, lang, register, t, pick, apply`) | ✅ recortado + identificadores en inglés (`SUPPORTED`, `DEFAULT_LOCALE`, `LOCALE_KEY`, `BCP47`, `LABEL`, `FLAG`) | ✅ completo + BCP47/LABEL/FLAG | ✅ completo | ✅ completo | n/a |
| `tts.js` (`App.tts.speak`) | ✅ | ✅ | ✅ | ✅ | n/a |
| `storage.js` (`get/set/remove`) | ✅ recortado (sin agregación multi-herramienta) | ✅ completo + `clearAll` | ✅ completo | ✅ completo | n/a |
| `feedback.js` (`success, encourage, celebrate`) | ✅ recortado (sin `lockUntilAck`) | ✅ completo | ✅ completo | ✅ completo | n/a |
| `dinero.js` / `money.js` (dominio dinero) | ❌ recortado (no se usa aquí) | ✅ `money.js` (fork de `dinero.js`) | ✅ `dinero.js` | ✅ `dinero.js` | n/a |

### Diferencias de layout (Teclatlon vs el resto)

| Archivo / carpeta | Teclatlon | Okeymoney | Apptonomia | Calculia | Sinonimia |
|---|---|---|---|---|---|
| `index.html` en raíz (single-activity) | ✅ | ✅ | ❌ (vive en `site/index.html`) | ❌ (`site/index.html`) | ✅ |
| `tools/<slug>/` por actividad | ❌ recortado | ❌ recortado | ✅ (~60) | ✅ (12) | ❌ |
| Landing en `site/` | ❌ recortado (ninguna) | ❌ recortado | ✅ | ✅ | ❌ |
| `settings/` (ruta oculta) | ❌ recortado (el reset está inline en `index.html`) | ✅ | ✅ | ✅ | ❌ |
| `about/`, `team/`, `content/` | ❌ recortado (ninguno) | ❌ recortado | ✅ | ❌ | ❌ (solo `about/`) |
| `legal/` (página de protección de datos) | ✅ | ✅ | ✅ | ✅ | ❌ |
| `assets/css/{tokens,base,components}.css` | ✅ | ✅ | ✅ | ✅ | ❌ (plano `css/styles.css`) |
| `assets/fonts/` (Atkinson + Nunito) | ✅ | ✅ | ✅ | ✅ | ❌ |
| `assets/img/icono.svg` | ✅ | ✅ | ✅ | ✅ | ✅ (`img/logo.svg`) |
| `scripts/check.js` (sin deps, Node stdlib) | ✅ N-locales | ✅ N-locales | ✅ amplio (`tools/`, `site/`, …) | ✅ con catalog-parity lock | ❌ `scripts/validar.js` |
| Idioma de identificadores en `check.js` | inglés | inglés | español (convención antigua) | inglés | español (archivo distinto) |
| `sw.js` (PWA network-first con caché de respaldo) | ✅ | ✅ | ✅ | ✅ | ❌ |
| `manifest.json` (un único icono SVG) | ✅ | ✅ | ✅ (también tenía PNG) | ✅ (solo SVG) | ❌ |
| `_headers` (CSP + Permissions-Policy + CORP + COOP + Upgrade-Insecure-Requests) | ✅ | ✅ | parcial (sin CSP) | ✅ | ✅ (con CSP) |
| `404.html`, `robots.txt`, `sitemap.xml` | ✅ (servido vía `not_found_handling` en `wrangler.toml`; sin él es un 404 vacío, verificado en producción) | ❌ (Okeymoney depende de `not_found_handling` en `wrangler.toml`) | ❌ (`quick-guide.md`) | ✅ | ❌ |
| `wrangler.toml` | ✅ (`[assets] directory = "."`, `not_found_handling = "404-page"`, Workers + static assets, comprometido — añadido tras detectar el hueco del 404 al arreglar el CSP de `_headers`) | ✅ (`[assets] directory = "."`, Workers + static assets, comprometido) | ❌ | ✅ | ✅ (presente a propósito, fija el nombre) |
| `_redirects` | ❌ ausente (no hay SPA en la suite — cada página es su propia URL; ver [`patron-suite.md`](patron-suite.md) §5) | ❌ | ❌ | ❌ | ❌ |
| `package.json` | ❌ ausente (deliberado: evita que `npm install` se pase del límite de 25 MiB) | ❌ | ❌ | ❌ | ❌ |

### Dónde se documentan las diferencias

| Decisión | Dónde lo explica Teclatlon |
|---|---|
| "Sin landing, sin routing por herramienta, sin `/settings/`" | Este archivo §2 y `CLAUDE.md` "Architecture" |
| "`tools/<slug>/` por actividad se eliminó a propósito" | Este archivo §2 párrafo "Arquitectura" |
| "`assets/js/` recortado a lo que esta única actividad usa" | Este archivo §2.1 "núcleo compartido" y `CLAUDE.md` |
| "Por qué existe `wrangler.toml`, sin `_redirects`" | [`CLOUDFLARE.md`](../../CLOUDFLARE.md) "Why `wrangler.toml`?" y "Why no `_redirects`?" |
| "Bilingüe por defecto (`es` + `en`); cómo añadir un tercer idioma" | [`I18N.md`](I18N.md) |
| "Cero menciones de discapacidad / terapia ocupacional / menores en archivos visibles al usuario" | [`SPEC.md`](SPEC.md) §4 y `scripts/check.js` §5 |
| "Patrón transversal de la suite, qué está prohibido en todas las apps" | [`patron-suite.md`](patron-suite.md) |
| "Cómo migrar un residuo raro de la fusión SPA si aparece" | [`patron-suite.md`](patron-suite.md) §5 |

Si alguno de los elementos "recortado" o "ausente" de arriba te
parece un bug, consulta la fuente citada antes de reintroducirlo: la
mayoría son decisiones documentadas del fork, no descuidos.

---

## 8. Licencia

MIT. Ver [`LICENSE`](../../LICENSE).
