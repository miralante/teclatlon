# Guía rápida

> 🌐 **Otro idioma:** [English](../en/quick-guide.md)

Esta guía explica paso a paso cómo usar Teclatlon: desde cómo
abrirla hasta cómo practicar con la cuadrícula de inicio, cambiar de
idioma o instalarla en tu ordenador. Incluye también **cuatro
formas de abrir la aplicación**, ordenadas de la más fácil a la más
elaborada.

> 📦 La versión detallada paso a paso (con el recorrido completo de
> instalación PWA y una sección completa de resolución de problemas)
> vive en la guía canónica transversal:
> [`routime/doc/es/guia-rapida.md`](https://github.com/thenkdframe/routime/blob/main/doc/es/guia-rapida.md).
> El **flujo de apertura, instalación PWA, cambio de idioma y
> resolución de problemas son idénticos** en todos los proyectos
> hermanos de Apptonomia. Este documento solo recoge lo específico
> de Teclatlon (sobre todo: solo para ordenador, no móvil).

---

## 1. Cómo abrir Teclatlon

Hay **cuatro formas**, ordenadas de la más fácil a la más
elaborada. El recorrido completo está en la guía canónica enlazada
arriba. La versión corta:

| # | Método | Qué necesitas | ¿Sin conexión? | ¿Instalable como PWA? |
|---|---|---|---|---|
| **A** | Desde internet ([teclatlon.apptonomia.uk](https://teclatlon.apptonomia.uk)) | Un ordenador + teclado físico | ❌ | ✅ |
| **B** | Descargando el ZIP de GitHub | Un ordenador + teclado físico | ❌ | ❌ |
| **C** | Servidor local con Python | Python 3 + teclado físico | ❌ | ✅ |
| **D** | Servidor local con Node.js | Node.js + teclado físico | ✅ | ✅ |

> ⚠️ **Teclatlon no funciona en móvil ni tablet.** Si la abres en
> un dispositivo móvil, verás un aviso a pantalla completa
> explicándolo. Esto es deliberado — ver [`SPEC.md`](SPEC.md) §2.
>
> 💡 Si solo quieres **probar la app**, usa el método **A** o **B**.
> Para la **experiencia completa** (PWA, modo sin conexión,
> "Instalar"), usa **C** o **D**.

---

## 2. La pantalla principal

La pantalla de inicio muestra la **cuadrícula de modos**: seis
modos de práctica (posición de los dedos, letras, palabras,
números, todas las teclas, escritura libre). Toca cualquier modo
para abrirlo. Consulta [`actividades.md`](actividades.md) §1 para
la lista completa y qué entrena cada modo.

## 3. Dentro de un modo

- **Posición de los dedos** muestra el teclado con las anclas de la
  fila base resaltadas y una guía de la mano. Pulsa cada ancla en
  el teclado físico; el resaltado va siguiendo.
- **Letras** abre una secuencia fija de lecciones. Cada lección son
  4–8 teclas. La siguiente tecla se resalta en el teclado en
  pantalla.
- **Palabras** escoge palabras de la lista (y tu nombre propio, si
  lo has guardado) y te pide que las escribas.
- **Números** es el juego del teclado numérico; la posición base
  es la mano derecha en `4-5-6` / `7-8-9`.
- **Todas las teclas** es un único fragmento corto que usa el
  **teclado completo** del diseño activo.
- **Escritura libre** deja escribir lo que quieras; la app puede
  leerlo en voz alta.

## 4. El teclado en pantalla es decorativo

El teclado en pantalla es **siempre** `pointer-events: none`. Te
muestra qué tecla pulsar a continuación, pero **la única entrada
real es el teclado físico**. No hay modo de teclado táctil móvil
(ver [`SPEC.md`](SPEC.md) §2). No intentes pulsar las teclas en
pantalla — están como guía visual.

## 5. Mensajes de respuesta

Tecla correcta → la tecla se marca como escrita; tecla
equivocada → un pequeño temblor en la tecla de pantalla, un mensaje
amable de ánimo y se sigue. **No hay cronómetro, ni puntuación, ni
game over** (ver [`SPEC.md`](SPEC.md) §3.2). Los errores nunca
restan progreso.

## 6. Añadir tu nombre

Desde la pantalla de inicio (o dentro del modo **palabras**), abre
el panel de ajustes y escribe tu nombre. Tu nombre se mezcla en la
rotación del modo **palabras**, **solo en `localStorage`**.
Quitarlo es un clic en el mismo panel.

## 7. Progreso

El progreso por tecla se muestra como un gráfico tranquilo en
**ajustes**. No hay estrellas, ni niveles, ni clasificaciones.
Restablecer el progreso es destructivo y requiere confirmación.

## 8. Cambiar idioma

Abre el menú de idioma desde la cabecera (icono del globo 🌐).
Disponibles: **Español (predeterminado)** e **Inglés**. Cada idioma
tiene su propio diseño de teclado y su propia lista de palabras.
Consulta [`I18N.md`](I18N.md) para ver cómo añadir un nuevo idioma.

## 9. Ajustes personales

Abre `/settings`. Desde allí puedes:

- Añadir o quitar tu **nombre propio** (lo usa el modo
  **palabras**).
- Ver el gráfico de **progreso por tecla**.
- Restablecer progreso (con confirmación, porque es destructivo).
- Gestionar las preferencias de audio y de movimiento reducido.

## 10. Instalar la app en tu ordenador

Los pasos completos (Chromium / Firefox / WebKit) están en la guía
canónica. Versión corta: abre Teclatlon en el navegador, elige
"Instalar" / "Añadir a pantalla de inicio", confirma.

## 11. Resolución de problemas

Consulta **§11 Resolución de problemas** de la guía canónica —
esos apartados aplican idénticamente a Teclatlon. Dos apartados
específicos:

- **"No pasa nada cuando pulso una tecla en pantalla"** — el
  teclado en pantalla es decorativo. Usa el teclado **físico**.
- **"Veo el aviso de móvil en mi escritorio"** — la ventana del
  navegador es demasiado estrecha. Amplíala a ≥ 720 px de ancho; la
  compuerta está pensada para móviles, pero una ventana de
  escritorio muy pequeña también la dispara.

## 12. Más ayuda

- Producto: [`SPEC.md`](SPEC.md).
- Arquitectura: [`tecnico.md`](tecnico.md).
- Catálogo de modos y lecciones: [`actividades.md`](actividades.md).
- Para familias y docentes: [`equipo.md`](equipo.md).

## 13. Resumen rápido

1. Abre Teclatlon en un **ordenador con teclado físico** (4
   métodos; el más fácil es **A**).
2. Elige un modo en la cuadrícula de inicio (empieza por
   **posición de los dedos** si eres nuevo).
3. Pulsa la tecla resaltada en el teclado **físico**.
4. Gana progreso por tecla; sin fallos, sin castigo.
5. Cambia idioma con 🌐; instala como PWA para uso sin conexión.
