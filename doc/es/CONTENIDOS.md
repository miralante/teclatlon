# Contenido detallado — Teclatlon

> 🌐 **Otro idioma:** [English](../en/CONTENTS.md)

Este documento es el **índice didáctico detallado de Teclatlon**.
Amplía [`actividades.md`](actividades.md) y
[`guia-crear-actividades.md`](guia-crear-actividades.md) listando
cada lección, juego y concepto pedagógico que incluye la app, y
remitiendo al documento canónico correspondiente.

Teclatlon es una aplicación de una sola actividad: `tools/`
contiene una carpeta, el entrenador de mecanografía. El
"contenido" de la app es, por tanto, el conjunto de **lecciones,
palabras, pasos del teclado numérico y retos** definidos en
`data.js` y agrupados por tema.

Usa este documento como el **cuaderno de Teclatlon**: cuando se
proponga una lección nueva, cuando se revise el layout del
teclado o el sistema de colores por dedo, o cuando haya que
rebalancear el corpus de práctica, este es el documento a leer
primero.

> **Fuente de verdad de las reglas de producto**:
> [`SPEC.md`](SPEC.md).
> **Fuente de verdad de la pedagogía**:
> [`guia-crear-actividades.md`](guia-crear-actividades.md).
> **Fuente de verdad del layout del teclado, colores por
> dedo/mano y del contrato PWA/service-worker**:
> [`tecnico.md`](tecnico.md).
> **Fuente de verdad del patrón transversal de la suite** (cómo
> se construye cada app de Miralante, qué está prohibido):
> [`tecnico.md` §8](tecnico.md#8-patrón-de-la-suite-cómo-se-construye-cada-app-de-miralante).
> Este documento **no** redefine reglas; indexa el contenido que
> esas reglas producen.

---

## 0. Cómo está organizado este documento

1. La actividad (`tools/` slug).
2. Lecciones y modos de juego.
3. Contenido de práctica por idioma (`data.js`).
4. Conceptos pedagógicos (qué trabaja cada modo).
5. Restricciones y contenido prohibido.

> **Nota**: Teclatlon trabaja **solo con el teclado físico de
> ordenador**. Se descartó deliberadamente un teclado en pantalla
> táctil — ver [`SPEC.md`](SPEC.md) para la justificación y qué se
> rechazó. No reintroducir un modo de teclado táctil móvil.

---

## 1. La actividad

| Actividad | Slug (`tools/`) | Objetivo didáctico | Vocabulario clave |
|---|---|---|---|
| Teclatlon (entrenador de mecanografía) | `teclatlon/` | Colocación de dedos, escritura letra a letra, palabras frecuentes, teclado numérico, escritura libre. | tecla, dedo, mano, fila, posición, fila base, fila superior. |

---

## 2. Lecciones y modos de juego

Esta sección es el **hueco para el inventario por lección y por
juego**. Cuando añadas una lección o un reto, documéntalo aquí
(nombre, objetivo didáctico, vocabulario clave, arrays de
`data.js` relacionados) y enlaza la sección correspondiente de
[`guia-crear-actividades.md`](guia-crear-actividades.md) que
gobierna la adición.

Secciones a desarrollar según crezca el proyecto:

- 2.1 Lecciones (por fila de teclas, en orden didáctico).
- 2.2 Juego de palabras (inventario por corpus).
- 2.3 Juego del teclado numérico (inventario por etapa).
- 2.4 Reto "todas las teclas" (descriptor + regla de
  puntuación).
- 2.5 Modo escritura libre (descriptor + regla de
  almacenamiento).

---

## 3. Contenido de práctica por idioma

El contenido de práctica vive en `data.js` como arrays separados
por idioma:

- Español (`es`) — lecciones, palabras, pasos de teclado
  numérico.
- Inglés (`en`) — lecciones, palabras, pasos de teclado
  numérico.

Ver [`tecnico.md`](tecnico.md) para el esquema de `data.js`, y
[`I18N.md`](I18N.md) para la regla de que todo cambio de idioma
debe reflejarse en todos los idiomas en los que se publica la
app.

---

## 4. Conceptos pedagógicos (qué trabaja cada modo)

- Colocación de dedos y fila base.
- Ritmo y precisión al teclear sin mirar.
- Corpus de palabras frecuentes en español / inglés.
- Layout del teclado numérico (español: numpad con `,` como
  separador decimal).
- Escritura libre sin mirar el teclado.

---

## 5. Restricciones y contenido prohibido

- **Ninguna mención clínica o de discapacidad en ninguna
  superficie visible para el usuario** (ver [`SPEC.md`](SPEC.md)
  § "Regla obligatoria: cero menciones en el producto visible").
  `scripts/check.js` lo aplica sobre `index.html` y
  `strings.<locale>.js`.
- **No teclado táctil en pantalla** — ver la nota arriba.
- **Sin dependencias externas** — el proyecto es HTML/CSS/JS
  puro, ver [`tecnico.md`](tecnico.md).

---

## Ver también

- [`indice.md`](indice.md) — índice de documentación de primer
  nivel.
- [`guia-rapida.md`](guia-rapida.md) — orientación de una página.
- [`equipo.md`](equipo.md) — cobertura y guía terapéutica.
- [`tecnico.md` §8](tecnico.md#8-patrón-de-la-suite-cómo-se-construye-cada-app-de-miralante) — el patrón transversal de la suite (cada app de Miralante, qué está prohibido).
