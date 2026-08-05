# Especificación de producto

> Fuente canónica del alcance de producto, la audiencia y las reglas no
> negociables. La arquitectura técnica vive en [`tecnico.md`](tecnico.md).

## 1. Qué es Teclatlon

Una aplicación web gratuita, estática y de propósito único que enseña
mecanografía en el **teclado físico del ordenador**: colocación de los
dedos, lecciones letra a letra en orden fijo, un juego de palabras
(incluido el nombre de la persona), un juego de teclado numérico, un reto
de "todas las teclas" y un modo de escritura libre que lee en voz alta lo
escrito.

Teclatlon es parte de Apptonomia, una suite más amplia de actividades de
terapia ocupacional, donde esta era una actividad más entre muchas.
Conserva el lenguaje de diseño centrado en accesibilidad de Apptonomia
(lectura fácil, sin presión, alto contraste, objetivos táctiles grandes)
porque ese diseño también sirve a cualquiera que aprenda a escribir por
primera vez, no solo a la audiencia para la que se construyó Apptonomia.

## 2. Audiencia

Cualquier persona que aprenda a escribir en un teclado de ordenador:
niños, principiantes y, en particular, personas que se benefician de la
lectura fácil, un ritmo sin presión y pantallas predecibles y sin
ruido visual. Usable de forma **autónoma**, sin que un profesor o
familiar tenga que estar al lado de quien aprende.

**Solo ordenador.** No hay modo de entrada táctil. El teclado en pantalla
es siempre decorativo (`pointer-events: none`); la única entrada real es
un teclado físico. No vuelvas a añadir un modo de teclado móvil tocable:
ese alcance se eliminó a propósito al separar este proyecto de Apptonomia.
Si la página se abre desde un móvil o tablet, la app muestra un aviso a
pantalla completa explicando que se necesita un teclado físico y por
qué el teclado en pantalla no se puede pulsar (ver
[`tecnico.md` §2.5](tecnico.md)).

## 3. Principios no negociables

1. **Autonomía** — usable sin que un profesional o familiar esté presente.
2. **Sin presión** — sin temporizadores, sin puntuación negativa, sin
   "game over". Los errores reciben un mensaje de ánimo y reintentos
   ilimitados.
3. **Privacidad** — sin login, sin cookies, sin analítica, sin servidor.
   Los únicos datos guardados (progreso, nombre opcional) viven en el
   `localStorage` de este navegador y nunca salen del dispositivo. Ver
   [`legal/`](../../legal/index.html).
4. **Lectura fácil** — frases cortas, una idea por frase, lenguaje llano,
   sin jerga clínica o técnica en nada que lea quien aprende.
5. **Accesibilidad** — botones ≥ 64×64 px, espaciado ≥ 16 px, contraste
   AA de WCAG, navegación completa por teclado, ARIA en botones de icono
   y zonas de feedback, respeta `prefers-reduced-motion`.
6. **Tecnología sobria** — HTML5 + CSS3 + JavaScript vanilla, sin
   frameworks, sin paso de build, sin dependencias npm, PWA offline-first.

## 4. Regla de obligado cumplimiento: cero menciones en el producto

**Ningún texto que vea quien usa la app puede mencionar, directa ni
indirectamente, discapacidad intelectual, terapia ocupacional, menores,
niños, ni expresiones equivalentes** ("dificultades cognitivas",
"necesidades especiales", "capacidades diferentes", "menor de edad",
etc.). Esto incluye todo lo visible en la interfaz: `index.html`,
`app.js`, `data.js`, `strings.<locale>.js` y `legal/`. El motivo es
exactamente el de §1 y §2: que nadie que use la aplicación se sienta
señalado, en inferioridad o discriminado por lo que la propia
aplicación dice sobre su persona.

Dónde se aplica y dónde no:

- **Se aplica** a todo lo que ve quien usa la app: títulos,
  descripciones meta, botones, etiquetas, mensajes, texto alternativo
  de iconos, pies de página.
- **No se aplica** a la documentación interna del proyecto (este
  documento, `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`): esos
  archivos los lee quien mantiene o contribuye al proyecto, no quien
  usa la app, y es exactamente donde debe explicarse el objetivo real
  del producto (ver §2 y §3).

Esta regla se comprueba automáticamente: `node scripts/check.js`
falla si cualquiera de esos términos aparece en los archivos que ve
quien usa la app.

## 5. Reglas de accesibilidad (obligatorias en cualquier cambio de UI)

1. Lectura fácil: frases cortas, una idea por frase.
2. Botones ≥ 64×64 px, espaciado ≥ 16 px.
3. Alto contraste (mínimo AA de WCAG).
4. Audio solo cuando el diseño de la actividad lo requiere (botón 🔊 +
   `App.tts.speak()`), no como regla general para cada texto.
5. Sin presión: sin temporizadores, puntuación negativa ni "game over".
6. Refuerzo positivo al acertar: `App.feedback.success()`.
7. Respeta `prefers-reduced-motion`.
8. Navegación completa por teclado.
9. ARIA en botones de icono y zonas de feedback.
10. Máximo 4–6 opciones por pantalla.
11. Ritmo socrático ante errores: ánimo, nunca castigo
    (`App.feedback.encourage()`), reintentos ilimitados.
12. Progresión gradual: cada lección cambia solo una variable cada vez.

## 5.1 Panel de accesibilidad y juego (no negociable)

Toda la configuración de la app vive en `state.opciones` (localStorage)
y se aplica en arranque (`aplicarOpciones()` en `app.js`). Por defecto
todo está apagado: cada persona decide qué le ayuda.

El panel es un desplegable lateral (`#drawerAjustes`), que se abre desde
un icono de engranaje (`#btnAbrirAjustes`) en la cabecera — accesible
desde cualquier pantalla, no solo al arrancar por primera vez. Se cierra
con su propio botón de cierre, al pulsar el fondo oscurecido o con
<kbd>Escape</kbd>, y atrapa el foco de <kbd>Tab</kbd> mientras está
abierto (ver [`tecnico.md` §2.2](tecnico.md)).

- **Tamaño del texto**: `chico` (18 px), `normal` (20 px), `grande`
  (24 px), `enorme` (30 px). Ajusta la variable `--texto-base`.
- **Tema**: `claro` (por defecto), `auto` (sigue `prefers-color-scheme`),
  `oscuro`, `contraste` (alto contraste forzado, apto para poca visión).
- **Modo foco**: oculta la guía de manos y la leyenda. El teclado
  visual con la tecla objetivo iluminada se queda: es la pista
  principal del ejercicio.
- **Sonido espacial**: panea la nota de acierto por la columna de la
  tecla (StereoPannerNode). Apagado por defecto para no saturar.
- **Vibración**: retirada. `navigator.vibrate()` solo funciona en
  dispositivos táctiles y Teclatlon es solo para el teclado físico
  del ordenador (ver §2).
- **Tipografía para dislexia**: retirada. No había tipografía
  empaquetada y la opción caía en silencio (la Atkinson Hyperlegible
  por defecto ya es legible).
- **Métricas**: muestra precisión (%) y PPM en vivo durante la
  partida. Apagadas por defecto. La definición fina del producto
  está todavía pendiente; el ajuste se queda visible y apagado.

Ver `legal/index.html` para qué datos se guardan exactamente.

## 5. Gamificación (sin presión)

- **Estrellas**: una por lección o modo completado por primera vez.
- **Rachas**: se incrementan al completar; se reinician tras un error
  (sin penalización, sin "game over"). Se muestra la racha actual y la
  mejor racha en el menú.
- **Insignias**: 9 desbloqueables (primera lección, posición, palabras,
  números, todas las teclas, escritura libre, racha 5, racha 10,
  precisión ≥ 90 %). Se muestran como tarjetas en el menú. Al
  desbloquear una nueva, aparece una bandera breve.
- **Avatares**: retirados. La selección de avatar no estaba
  implementada (el grid aparecía vacío) y no forma parte del
  producto.

## 6. Política de idioma

La interfaz es **multilingüe**: por defecto la app se publica en español
e inglés (`es`/`en`), que forman el **par base** y entre los que se
mantiene paridad de claves y traducción en cada cambio de producto.
`es` es el idioma por defecto y la **fuente de la verdad** cuando falta
una clave en otro idioma. La **arquitectura i18n (`App.i18n`) está
diseñada para soportar N idiomas** — la forma de registrar un idioma
nuevo, los puntos con lógica binaria `es`/`en` que hay que generalizar
primero y la receta paso a paso viven en [`I18N.md`](I18N.md), que debe
leerse junto a este `SPEC.md` y a [`tecnico.md`](tecnico.md).

Reglas que aplican en **todos** los idiomas soportados, no solo en
`es`/`en`:

- **UI multiidioma**: todos los textos visibles para el usuario final
  existen en cada idioma soportado. Los cambios de contenido de producto
  (lecciones, palabras, textos de interfaz) deben publicarse en el par
  base `es`/`en` y, si se traduce a un tercer idioma, también en ese
  idioma — una clave nunca se queda sin su equivalente traducido en
  todos los locales activados.
- **Código técnico siempre en inglés**: identificadores, comentarios,
  mensajes de commit y — **crucialmente** — las claves de los
  `strings.<locale>.js` van en inglés. Los valores son el texto
  traducible. Esta separación permite que `App.i18n.t('lessonName')`
  sea legible en el código fuente, independientemente del idioma
  activo.
- **Las reglas de lectura fácil y accesibilidad (SPEC §3–§4) aplican
  en cada idioma**: cada traducción se redacta pensando en la persona
  que aprende, no como traducción literal de la versión española.
