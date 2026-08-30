# Catálogo de lecciones y modos

Teclatlon es una app de **mecanografía** con un único propósito. La
unidad de contenido es la **lección** (una secuencia fija de teclas,
palabras o frases) y la unidad de práctica es el **modo** (la
pantalla que la persona abre desde la cuadrícula de inicio). Las
lecciones y los modos se declaran en `data.js`; el runtime es un
núcleo compartido que sabe cómo reproducir cualquier par
lección/modo.

> La descripción canónica del producto (audiencia, regla de "solo
> teclado físico", decisión de "no teclado táctil móvil") está en
> [`SPEC.md`](SPEC.md). La arquitectura del fichero de datos y del
> runtime está en [`tecnico.md`](tecnico.md).

---

## 1. La cuadrícula de inicio (los modos)

La pantalla de inicio muestra los modos de práctica. Cada modo abre
una pantalla y acepta cualquier lección que encaje con su filtro
`accepts`.

| Modo | Qué entrena | Referencia |
|---|---|---|
| **Posición de los dedos** | Las anclas de la fila base y el mapeo dedo-tecla. | [`SPEC.md`](SPEC.md) §4. |
| **Letras** | Lecciones letra a letra en el orden fijo definido en `data.js` (ver [`tecnico.md`](tecnico.md) §"Lecciones"). | [`tecnico.md`](tecnico.md) §"Modo letras". |
| **Palabras** | Mecanografía de palabras, con palabras personalizadas opcionales (incluido el nombre propio de la persona). | [`tecnico.md`](tecnico.md) §"Modo palabras". |
| **Números (juego del teclado numérico)** | Práctica del teclado numérico con la posición base de la mano derecha. | [`tecnico.md`](tecnico.md) §"Modo números". |
| **Todas las teclas** | Práctica mixta que ejercita el **teclado completo** del diseño activo — todas las letras, todos los números cuando el diseño los muestra, la barra espaciadora y todas las teclas de puntuación. | [`SPEC.md`](SPEC.md) §3.7. |
| **Escritura libre** | Texto libre + lectura en voz alta de lo que se ha escrito. | [`tecnico.md`](tecnico.md) §"Modo escritura libre". |

Cada modo es corto y reutilizable a propósito. No hay una
"compuerta de nivel completado" que bloquee el siguiente modo — la
persona puede elegir cualquier modo en cualquier momento.

## 2. La secuencia de lecciones

Las lecciones se declaran en `data.js` como una matriz ordenada de
teclas, palabras o frases. La secuencia de lecciones del **modo
letras** es **fija** (`LESSON_ORDER` en `data.js`) y es
deliberadamente independiente del idioma activo: quien aprende con
un QWERTY español ve las mismas primeras letras en el mismo orden
que quien aprende con un QWERTY inglés, para que el progreso sea
comparable entre idiomas.

La secuencia de lecciones cubre:

1. **Fila base izquierda** (a-s-d-f).
2. **Fila base derecha** (j-k-l-ñ/;).
3. **Fila superior** (q-w-e-r-t-y-u-i-o-p).
4. **Fila inferior** (z-x-c-v-b-n-m).
5. **Números** (dígitos de la fila superior, según el diseño).
6. **Puntuación y teclas especiales** (punto, coma, tilde, etc.,
   según requiera el diseño).
7. **Práctica mixta** (frases sacadas de la lista de palabras y de
   las palabras propias guardadas por la persona).

## 3. La lista de palabras

La lista de palabras vive en `data.js` y es el **contenido** del
**modo palabras**. Contiene:

- **Palabras genéricas de alta frecuencia** en cada idioma.
- **Palabras propias opcionales** (p. ej. el nombre de la persona)
  guardadas en `localStorage` y mezcladas en la rotación cuando
  existen.

Las reglas completas de la lista de palabras (tope de longitud,
gestión por idioma, deduplicación, mezcla del nombre propio) están
en [`tecnico.md`](tecnico.md) §"Lista de palabras".

## 4. El reto "todas las teclas"

Es el único modo que es una sola sesión fija de práctica, no un
flujo de lecciones: coge un fragmento que usa el **teclado
completo** del diseño activo y le pide a quien aprende que lo
escriba entero. El fragmento es corto, el feedback es por tecla y
no hay presión de tiempo.

## 5. Lo que **no** es una actividad aquí

Algunas cosas que parecen "actividades" en otros proyectos no lo
son en Teclatlon:

- **Sin cuestionarios** — la práctica de mecanografía no tiene una
  respuesta correcta/incorrecta que reste nada; solo la siguiente
  tecla a pulsar.
- **Sin clasificaciones** — no hay servidor, ni puntuaciones, ni
  rankings públicos.
- **Sin teclado táctil móvil** — Teclatlon es **solo para
  ordenador** (ver [`SPEC.md`](SPEC.md) §2). En un móvil o tablet
  aparece un aviso a pantalla completa explicando por qué hace
  falta un teclado físico.

## 6. Cómo añadir una lección nueva

Esta es la tarea del rol de apoyo / build. El flujo completo vive
en [`guia-crear-actividades.md`](guia-crear-actividades.md). La
versión corta:

1. **Edita `data.js`** para extender `LESSON_ORDER` (modo letras)
   o la lista de palabras (modo palabras), según corresponda.
2. **Mantén la longitud realista**: 4–8 teclas para letras, 5–12
   palabras para lecciones de palabras, 1 frase corta para
   lecciones de frases.
3. **Verifica la paridad entre idiomas**: si añades una lección al
   diseño en español, el diseño en inglés (u otro) necesita el
   mismo hueco estructural para mantener el progreso comparable.
4. **Valida antes de abrir el PR**: `node scripts/check.js`.

Consulta [`tecnico.md`](tecnico.md) §"Lecciones" para la forma de
los datos y sus restricciones.

---

## Ver también

- Producto: [`SPEC.md`](SPEC.md).
- Arquitectura: [`tecnico.md`](tecnico.md).
- Idiomas: [`I18N.md`](I18N.md).
- Cómo crear lecciones nuevas:
  [`guia-crear-actividades.md`](guia-crear-actividades.md).
