# Guía para profesionales y familias

Esta guía está pensada para terapeutas ocupacionales, familias,
docentes y otros profesionales que quieran usar Teclatlon como
herramienta de apoyo para enseñar mecanografía.

---

## ¿Para quién es Teclatlon?

Teclatlon está diseñado principalmente para:

- **Niños y principiantes** que están aprendiendo a escribir en un
  teclado físico por primera vez.
- **Personas con discapacidad intelectual** que se benefician de
  lectura fácil, ritmo sin presión y pantallas limpias y
  predecibles.
- **Adultos aprendiendo a escribir** que quieran un entrenador con
  pocas distracciones.

La aplicación **no sustituye** a un profesor de mecanografía, pero
puede servir como:

- Práctica diaria entre clases.
- Herramienta de repaso autónomo una vez que la persona conoce lo
  básico.
- Una forma de que el rol de apoyo vea qué teclas siguen
  costándole.

---

## Solo para ordenador

Teclatlon es **solo para ordenador**. No hay modo de entrada táctil /
tap; el teclado en pantalla es siempre decorativo. Si la página se
abre en un móvil o tablet, la app muestra un aviso a pantalla
completa explicando que hace falta un teclado físico y por qué el
teclado en pantalla no se puede tocar (ver [`SPEC.md`](SPEC.md) §2).

Esta es una decisión deliberada, no una característica que falte.
**No añadas un modo de teclado táctil móvil otra vez** — ese
alcance se descartó cuando Teclatlon se separó de Apptonomia.

---

## Cómo usar Teclatlon en las sesiones de apoyo

### Valoración inicial

Antes de usar la aplicación, observa a la persona con estas
preguntas:

1. ¿Se siente cómoda sentada en un escritorio con un teclado
   físico?
2. ¿Conoce las anclas de la fila base (a-s-d-f / j-k-l-ñ)?
3. ¿Es capaz de llegar a las teclas sin mirar el teclado? (Si no,
   empieza por la pantalla de **posición de los dedos**.)
4. ¿Qué mano tiene más fuerza / coordinación? (Útil para las teclas
   que cargan la mano derecha y para el teclado numérico.)

### Selección de actividades

#### Para personas que empiezan

| Modo | Habilidad trabajada |
|---|---|
| **Posición de los dedos** | Anclas de la fila base, mapeo dedo-tecla. |
| **Letras (primeras 2 lecciones)** | a-s-d-f y j-k-l. |
| **Palabras** con **nombre propio** | Refuerzo + motivación personal. |

#### Para personas con nivel intermedio

| Modo | Habilidad trabajada |
|---|---|
| **Letras** (filas 3–4) | Filas superior e inferior. |
| **Palabras** (lista frecuente) | Palabras comunes. |
| **Números** | Práctica del teclado numérico. |

#### Para personas con nivel avanzado

| Modo | Habilidad trabajada |
|---|---|
| **Todas las teclas** | Práctica mixta con el teclado completo. |
| **Palabras** (mixto) | Práctica mixta de palabras. |
| **Escritura libre** | Texto libre + lectura en voz alta de lo escrito. |

### Adaptaciones

#### Ritmo

La persona marca el ritmo. Teclatlon **no tiene cronómetros ni
feedback negativo** — ver [`SPEC.md`](SPEC.md) §3.2. Una tecla
equivocada produce un mensaje de ánimo y la persona puede volver a
intentarlo.

#### Ajustes visuales

- El teclado en pantalla resalta la **siguiente tecla** a pulsar.
  Si el resaltado distrae mucho, redúcelo con la preferencia del
  sistema operativo "reducir movimiento"; la app la respeta.
- Para personas con visión reducida, aumenta el tamaño de fuente
  del sistema operativo; la maquetación es responsive pero está
  pensada para tamaños de escritorio.

#### Postura

El teclado físico es la única entrada real. Una persona que no
llega a él cómodamente (manos pequeñas, dificultades motoras)
debería usar un **teclado más pequeño, partido o compacto** en vez
de un móvil o tablet-sobre-mesa — Teclatlon no funcionará en ese
montaje.

---

## Seguimiento del progreso

Teclatlon guarda el progreso por tecla en el `localStorage` del
navegador: qué teclas ha pulsado la persona, cuáles sigue
fallando y con qué frecuencia. **No hay estrellas, ni niveles, ni
puntuación**: el progreso se muestra como un gráfico por tecla
tranquilo, pensado para repasar con el rol de apoyo, no como una
métrica competitiva.

Para ver el progreso: abre `/settings` y consulta el gráfico por
tecla. Restablecer el progreso es destructivo y requiere
confirmación.

### Privacidad

- Sin login, sin cuenta, sin analítica, sin llamadas de red.
- El progreso vive en `localStorage` y solo en el navegador donde
  está abierta la app.
- Distintos navegadores en el mismo dispositivo guardan progresos
  independientes.

---

## Más recursos

- Catálogo de modos y lecciones: [`actividades.md`](actividades.md).
- Notas pedagógicas y de diseño para profesionales:
  [`guia-crear-actividades.md`](guia-crear-actividades.md).
- Guía transversal para familias sobre habilidades de vida diaria:
  [`equipo.md` de Routime](https://github.com/thenkdframe/routime/blob/main/doc/es/equipo.md).
