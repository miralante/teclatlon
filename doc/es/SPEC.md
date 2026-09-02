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

La accesibilidad cognitiva es un principio rector: todo el contenido
sigue las pautas de **lectura fácil** y la norma **UNE 153101:2018 EX**
(estándar español de lectura fácil), alineada con las pautas europeas
de Inclusion Europe. La comprensión prevalece sobre la precisión
técnica expresada con dificultad.

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
7. **Pericia con el teclado completo** — cada actividad practica con
   el **teclado completo** del layout seleccionado (todas las letras,
   los números cuando el layout los muestra, la barra espaciadora y
   el teclado numérico cuando es visible). El objetivo es que quien
   aprende alcance una habilidad real de mecanografía y mejore su
   precisión y velocidad neuromotoras en todo el teclado, no solo en
   la fila central o en las letras que introduce una lección
   concreta. Las decisiones de diseño de cada actividad (posición,
   paso a paso, palabras, números, todas las teclas, escritura libre)
   deben sumar esa cobertura; una lección que solo ejercita las
   letras nuevas que introduce está incompleta. Ver
   [`tecnico.md` §"Motor del juego de secuencia"](tecnico.md) para
   el gancho en tiempo de ejecución (`buildLessonReview` en `app.js`)
   que añade un paso de repaso al final de cada lección para que la
   cobertura acumulada se aplique al jugar.8. **Comunicación persuasiva al servicio del aprendizaje** (lista cerrada
   en §3.7 más abajo) — Teclatlon es una herramienta de práctica, no
   un producto de consumo. La motivación para practicar debe ser
   **intrínseca** (la satisfacción de mejorar la propia mecanografía),
   nunca **extrínseca** ni basada en presión. Los patrones de mercado
   que dependen de escasez, comparación o miedo a perder **no pueden**
   aparecer en ningún punto de la app. Esta regla es suite-wide y se
   comparte con Apptonomia, Calculia, Okeymoney, Sinonimia, Memofun y
   Routime; la lista concreta es la misma en los siete proyectos.
### 3.7 La lista cerrada de patrones prohibidos

Los siguientes patrones forman parte de la "presión" que Teclatlon
destierra y **no pueden** aparecer en ningún punto de la app:

- **Escasez**: "¡Solo te queda 1!", "Última oportunidad", "Date
  prisa", cuentas atrás, lecciones o palabras que desaparecen.
- **Falsa urgencia**: cronómetros, carreras, "termina pronto",
  castigar la lentitud. Conecta con el principio 2 de §3 ("Sin
  presión") y con §5.
- **Prueba social convertida en presión**: rankings, posiciones,
  "otros ya han escrito esto" como presión social, contadores
  globales del estilo "1.234 personas han completado esta lección".
- **Coste irrecuperable / FOMO**: "perderás tu progreso si paras",
  "no pierdas tu racha", mensajes forzados de retención,
  notificaciones de tipo "te echamos de menos".
- **Reciprocidad manipuladora / dark patterns**: registros forzados,
  casillas premarcadas, costes ocultos, alertas falsas,
  confirmaciones tramposas (por ejemplo, un botón de "no" que en
  realidad cierra la sesión o borra el progreso).
- **Aversión a la pérdida explotadora**: "tenías 5 ⭐, has perdido
  2". Las estrellas y el progreso **solo suman**, nunca restan como
  castigo (ver principio 2 de §3 "Sin presión").

El tono por defecto en Teclatlon es **calmo y predecible**: la
persona practica porque la actividad es atractiva, no porque la
estemos empujando. Cuando un patrón de esta lista aparece en una
propuesta de producto o de UI, se rechaza por defecto; cualquier
excepción se discute en una PR con motivo explícito.
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

### 4.1 Eufemismo público: "persona tipo"

Cuando se presenta Teclatlon de cara al **público general** (prensa,
charlas, READMEs públicos que cualquiera pueda leer, el portal
`apptonomia.uk`, notas en redes sociales, marketing), el término
"discapacidad intelectual" **no debe usarse** para describir la
audiencia de la app, ni siquiera cuando el texto que lo rodea sería
público. El eufemismo aceptado en esas superficies para referirse a la
audiencia es **"persona tipo"** (plural "personas tipo"),
entendido como marcador genérico de perfil, no como etiqueta para
ninguna persona real.

Dónde se aplica y dónde no:

- **Se aplica** a cualquier texto que cualquier persona ajena al
  proyecto pueda leer sin autenticarse: `README.es.md`, `README.md`,
  el portal en `apptonomia.uk`, charlas públicas, copy en redes, notas
  de prensa, material de marketing. En estas superficies se habla de
  la audiencia como "la persona tipo" o "las personas tipo"
  de la app.
- **No se aplica** a la documentación interna de este repositorio
  (`CLAUDE.md`, `doc/es/SPEC.md`, `doc/en/SPEC.md`, `tecnico.md`,
  [`roles.md`](roles.md), `CONTRIBUTING.es.md`, `CONTRIBUTING.md`) —
  esos archivos los lee quien mantiene o contribuye al proyecto, y
  "discapacidad intelectual" sigue siendo allí el término canónico,
  porque el proyecto necesita explicar sin ambigüedad su objetivo real
  a quien lo mantiene.
- **No se aplica** al contenido del proyecto que nombra un concepto
  clínico por su nombre real (p. ej. una lección que menciona un
  trámite administrativo real relacionado con discapacidad): eso es
  contenido, no etiquetado de la audiencia.
- **No se aplica** a la UI de la propia app: la regla de §4 sigue
  prohibiendo **cualquier** mención, incluida "persona tipo", en
  `index.html`, `app.js`, `data.js`, `styles.css`,
  `strings.<locale>.js`, `legal/` y cualquier otra superficie
  visible. El eufemismo es para el exterior, no para lo que lee
  quien visita la app.

Razón: presentar el objetivo real del proyecto en documentación interna
es útil y necesario; presentarlo en superficies de marketing o landing
no es necesario ni respetuoso con la audiencia — "persona tipo"
permite describir en público para qué sirve la app (qué perfil tiene
quien la usa) sin nombrar públicamente un grupo clínico.

## 5. Reglas de accesibilidad (obligatorias en cualquier cambio de UI)

1. Lectura fácil: frases cortas, una idea por frase.
2. Botones ≥ 64×64 px, espaciado ≥ 16 px.
3. Alto contraste (WCAG AA mínimo, AAA cuando sea posible) — ver
   `CLAUDE.md` §"WCAG AAA baseline (suite-wide)" para los criterios
   AAA que este proyecto honra y por qué la conformidad AAA completa
   no es viable para una aplicación web.
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

Toda la configuración de la app vive en `state.options` (localStorage)
y se aplica en arranque (`applyOptions()` en `app.js`). Por defecto
todo está apagado: cada persona decide qué le ayuda.

El panel es un desplegable lateral (`#settingsDrawer`), que se abre desde
un icono de engranaje (`#btnOpenSettings`) en la cabecera — accesible
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

## 6. Gamificación (sin presión)

- **Estrellas**: una por lección o modo completado por primera vez.
- **Insignias**: retiradas. Existió una tabla de 7 insignias
  planeadas, pero nunca se conectó a ninguna interfaz: la sección
  "Insignias" del menú principal mostraba siempre el grid vacío y el
  aviso "Aún no hay insignias", contradiciendo las ⭐ que sí
  funcionan. No forma parte del producto.
- **Avatares**: retirados. La selección de avatar no estaba
  implementada (el grid aparecía vacío) y no forma parte del
  producto.

## 7. Política de idioma

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
