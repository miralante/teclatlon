# Teclatlon

**Aplicación web que enseña mecanografía táctil con el teclado físico del ordenador — dedo a dedo, en un orden fijo de lecciones, con un juego de palabras, un juego del teclado numérico, un reto de todas las teclas y un modo de escritura libre.**

---

## ¿Qué es Teclatlon?

Teclatlon es una herramienta digital para practicar mecanografía táctil con el teclado físico del ordenador, en el navegador, sin coste. Es **solo para ordenador** — no funciona con toque ni con pulsación táctil. El teclado en pantalla es decorativo; la entrada real es siempre el teclado físico.

La aplicación es un **entrenador de un solo propósito**: una app, una actividad, varios modos de práctica. La lista completa de modos y el orden de las lecciones están en [`actividades.md`](actividades.md).

---

## Características principales

### ✅ Diseñada para la autonomía

- **Sin presión**: no hay cronómetros, ni notas negativas, ni castigos
- **Orden fijo de lecciones** — las letras se desbloquean conforme las dominas; también puedes elegir cualquier modo cuando quieras
- **Refuerzo positivo**: celebra cada acierto con sonidos y animaciones amables
- **Lectura Fácil**: frases cortas, vocabulario cotidiano, una idea por pantalla

### ✅ Accesible para todos

- **Colores visibles de manos y dedos** — el teclado en pantalla muestra qué dedo debe pulsar cada tecla, con los anclas de la fila central siempre resaltadas
- **Texto grande** en una letra clara y legible (Atkinson Hyperlegible)
- **Alto contraste** y anillos de foco visibles
- **Audio cuando aporta valor**: el modo de escritura libre lee en voz alta lo que has escrito, para que puedas oír tu propio texto

### ✅ Privacidad por defecto

Sin cuentas, sin cookies, sin analítica. Todo tu progreso vive en `localStorage` en tu propio dispositivo. Puedes borrarlo en cualquier momento con el botón **🗑️ Borrar mi progreso** en la pantalla principal.

### ✅ En dos idiomas

- 🇪🇸 **Español** (predeterminado)
- 🇬🇧 **English** (se puede cambiar desde el menú)

---

## Cómo empezar

### 1. Abrir la aplicación en un ordenador

Visita **[teclatlon.apptonomia.uk](https://teclatlon.apptonomia.uk)** desde cualquier navegador moderno en un ordenador con teclado físico. La aplicación no funciona en móviles ni en tablets.

### 2. Coloca los dedos en la fila central

Mira el teclado en pantalla. Los dos pequeños resaltes en las teclas **F** y **J** son tus anclas — el índice izquierdo va en **F**, el índice derecho va en **J**. Los colores del teclado en pantalla coinciden con el color del dedo que debe pulsar cada tecla.

### 3. Elegir un modo

Empieza con **🖐️ Colocación de dedos** para aprender los anclas de la fila central, luego pasa a **🔤 Letras** para seguir el orden fijo de lecciones, después prueba **🔤 Palabras** con listas de palabras aleatorias, el juego **🔢 Números** para el teclado numérico, **🎯 Todas las teclas** para un test completo del teclado, y **✍️ Escritura libre** para escribir lo que quieras.

### 4. Escribe con el teclado físico

Siempre. El teclado en pantalla solo refleja tu teclado físico — nunca se puede pulsar.

### 5. Cambiar el idioma

Toca el botón del idioma (🇪🇸 o 🇬🇧) en la parte superior de la pantalla.

---

## Ejemplo de uso

Imagina que empiezas desde cero. Abres **🖐️ Colocación de dedos** y pones el índice izquierdo en **F** y el índice derecho en **J**. La pantalla te pide pulsar **F** — la pulsas en el teclado físico, la **F** en pantalla se ilumina en verde. Luego **J** — igual. Después **D**, **K**, **S**, **L**, **A**, **Ñ/;** — la fila central. Cuando terminas, abres **🔤 Letras** y empieza la siguiente lección.

---

## Modos de práctica destacados

### 🖐️ Colocación de dedos

Los anclas de la fila central (F y J) y el mapa mano-dedo. Aquí se empieza; todo lo demás se construye sobre la memoria muscular que se forma aquí.

### 🔤 Letras

Lecciones letra a letra en el **orden fijo** definido en `data.js` — fila central izquierda, fila central derecha, fila superior, fila inferior, números. Una lección desbloquea la siguiente cuando se domina la actual. El orden es **el mismo para español e inglés** a propósito, para que el progreso sea comparable entre idiomas.

### 🔤 Palabras

Escritura de palabras con listas aleatorias por idioma. Hay también una ranura `name` — si la persona usuaria quiere escribir su propio nombre, va aquí.

### 🔢 Números (juego del teclado numérico)

Práctica del teclado numérico con la posición base de la mano derecha. Útil si trabajas con hojas de cálculo o con terminales de venta.

### 🎯 Todas las teclas

Práctica mixta que ejercita el **teclado completo** de la distribución seleccionada — cada letra, cada número cuando la distribución los muestra, la barra espaciadora y cada tecla de puntuación.

### ✍️ Escritura libre

Texto libre. Escribe lo que quieras; la aplicación te lo lee en voz alta cuando pulses el botón 🔊. Útil para practicar piezas largas sin la estructura de una lección.

---

## Más información

- [Guía rápida de uso](guia-rapida.md) — Paso a paso (cuatro formas de abrir Teclatlon)
- [Catálogo de modos y lecciones](actividades.md) — Lista completa de modos y la secuencia de lecciones
- [Guía para familias y docentes](equipo.md) — Cómo usar Teclatlon en terapia o en la escuela
- [Información técnica](tecnico.md) — Para desarrolladores

---

## Créditos y licencia

Teclatlon es un proyecto de código abierto, distribuido bajo la licencia MIT.

El teclado en pantalla usa emojis estándar del sistema y las distribuciones **QWERTY** / **QWERTY ES** declaradas en `data.js`. Es una ayuda visual, nunca un dispositivo de entrada — la entrada real es siempre el teclado físico.
