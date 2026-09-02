# Guía para crear actividades

> **Cómo diseñar y añadir lecciones, palabras y modos nuevos a
> Teclatlon, aplicando las reglas de producto de [`SPEC.md`](SPEC.md)
> §3, las reglas de accesibilidad de [`tecnico.md`](tecnico.md), la
> receta técnica de §"Lecciones", y un conjunto de técnicas
> **didácticas**, de **gamificación**, de **persuasión** y de
> **neuromarketing** adaptadas a la audiencia del proyecto.**
>
> Este documento **no** duplica la guía pedagógica canónica del
> suite; apunta a ella y solo recoge lo específico de Teclatlon. Si
> una regla aquí entra en conflicto con la guía canónica o con
> `tecnico.md`, `tecnico.md` gana.

---

## 1. La guía pedagógica canónica

Las técnicas didácticas, de gamificación, de persuasión y de
neuromarketing completas que comparten todas las apps de la suite
de Apptonomia viven en el repositorio de **Routime** en
[`guia-crear-actividades.md`](https://github.com/thenkdframe/routime/blob/main/doc/es/guia-crear-actividades.md).

Léela antes de diseñar nada. Cubre (entre otras cosas):

- Las 13 reglas obligatorias de accesibilidad (con su porqué).
- La escalera de pistas del método socrático (pista → pista más
  grande → respuesta).
- La paleta de refuerzo positivo (sonidos, animaciones, micro-copy).
- Los patrones de neuromarketing adaptados a la audiencia.
- La lista de comprobación del diseño de niveles (progresión
  Fácil → Medio → Difícil).

## 2. Lo específico de Teclatlon

### 2.1 La unidad de contenido es la lección, no la actividad

No añadas un modo nuevo para cada tema. Extiende `LESSON_ORDER`
(modo letras) o la lista de palabras (modo palabras) en `data.js`.
El comportamiento del modo es fijo y consume lo que el fichero de
datos tenga.

Si de verdad necesitas un modo nuevo (p. ej. un "drill de
velocidad" o un "juego de ritmo"), eso es un cambio de ingeniería,
no de contenido — consúltalo con el rol de build antes de abrir un
PR, y ten en cuenta que añadir un modo rompe la forma de "seis
modos fijos" que documenta la cuadrícula de inicio.

### 2.2 Longitud y ritmo de las lecciones

- **Lecciones de letras**: 4–8 teclas. Suficientemente cortas para
  que parezcan factibles, suficientemente largas para crear ritmo.
- **Lecciones de palabras**: 5–12 palabras por sesión. Suficientes
  para que la persona termine en 2–3 minutos.
- **Lecciones de frases**: 1 frase corta (10–25 palabras). Nunca
  dos frases seguidas; eso convierte la lección en un ejercicio de
  lectura.
- **Sesiones del teclado numérico**: 8–12 números. El teclado
  numérico se escribe rápido; sesiones largas se sienten como
  tarea.

### 2.3 Paridad entre idiomas

La secuencia de lecciones es **fija entre idiomas** para que el
progreso sea comparable entre, p. ej., quien aprende con QWERTY
español y quien aprende con QWERTY inglés. Cuando extiendas
`LESSON_ORDER`:

- El hueco, la longitud y la estructura deben ser iguales en
  todos los idiomas.
- Las teclas concretas pueden variar por idioma (el español tiene
  `ñ`; el inglés no), pero el **hueco estructural** no.
- La lista de palabras es **por idioma** y puede diverger
  legítimamente.

### 2.4 La lista de palabras es específica por idioma

La lista de palabras vive en `data.js` por idioma. Cuando añadas
palabras:

- **Elige palabras de alta frecuencia** en el idioma de destino.
  Evita jerga, idiomatismos o palabras que necesiten un contexto
  que la lección de teclado no puede dar.
- **Mantén las palabras cortas** (≤ 8 caracteres como objetivo
  suave; el runtime impone un tope duro).
- **Sin duplicados** dentro de la lista de palabras del mismo
  idioma.

### 2.5 El fragmento "todas las teclas" es el único contenido mixto

El modo "todas las teclas" usa un **único fragmento corto** que
ejercita el **teclado completo** del diseño activo. Cuando añadas
un idioma nuevo:

- Escribe un fragmento de ~30–60 palabras.
- El fragmento debe usar **cada letra, cada dígito, la barra
  espaciadora y al menos los signos de puntuación habituales** del
  diseño.
- Mantenlo en lectura fácil (ver las reglas del suite en
  [`SPEC.md`](SPEC.md) §3.3).
- Valida la cobertura con la lista de comprobación de
  [`tecnico.md`](tecnico.md) §"Todas las teclas".

### 2.6 Lo que **no** es una actividad en Teclatlon

Algunas cosas que parecen "actividades nuevas" están fuera de
alcance:

- **Sin modo de teclado táctil móvil** — Teclatlon es solo para
  ordenador (ver [`SPEC.md`](SPEC.md) §2).
- **Sin clasificaciones / marcador** — sin servidor, sin ranking
  público.
- **Sin modo de "velocidad" o "carrera"** — la velocidad de
  escritura **no** es el objetivo del proyecto. El proyecto
  optimiza para **precisión y comodidad**, no para escribir
  rápido.
- **Sin retos con tiempo** — ver [`SPEC.md`](SPEC.md) §3.2.

## 3. La receta técnica

Cómo extender `LESSON_ORDER`, la lista de palabras, el diseño por
idioma y el fragmento de "todas las teclas" se describe en
[`tecnico.md`](tecnico.md) §"Lecciones". **Lee esa sección antes de
escribir ningún código.** Subir la versión de caché del service
worker forma parte de la receta; ver [`tecnico.md`](tecnico.md)
§"Cache contract".

## 4. Lista de comprobación antes de abrir un PR

- [ ] `LESSON_ORDER` (letras) o lista de palabras (palabras)
      extendida en `data.js`.
- [ ] Mismo hueco estructural en todos los idiomas para los añadidos
      al modo letras.
- [ ] Palabras de la lista de alta frecuencia, cortas y en lectura
      fácil.
- [ ] Sin duplicados dentro de la lista de palabras del mismo
      idioma.
- [ ] Fragmento de "todas las teclas" que usa el **teclado
      completo** del diseño activo (un fragmento por idioma).
- [ ] Progreso por tecla sigue en `localStorage`; sin llamadas de
      red.
- [ ] Caché del service worker: `VERSION` subida en `sw.js`.
- [ ] `node scripts/check.js` pasa.

## 5. Ver también

- Guía pedagógica canónica (Routime):
  [guia-crear-actividades.md](https://github.com/thenkdframe/routime/blob/main/doc/es/guia-crear-actividades.md).
- Catálogo de modos y lecciones:
  [`actividades.md`](actividades.md).
- Receta técnica:
  [`tecnico.md`](tecnico.md) §"Lecciones".
- Reglas innegociables del producto:
  [`SPEC.md`](SPEC.md) §3.
