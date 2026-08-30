# Roles del proyecto

Teclatlon tiene **tres roles diferenciados**, igual que el resto de la
familia de proyectos (Apptonomia, Calculia, Memofun, Okeymoney,
Sinonimia):

| Rol | Quién es | Cómo participa | Dónde mira primero |
|---|---|---|---|
| 👤 **Persona usuaria** (cualquiera que aprende a escribir con el teclado del ordenador, y en particular personas que se benefician de la lectura fácil) | Practica las lecciones con el teclado físico | Abre `index.html` en un navegador y escribe con el teclado **físico**. El teclado en pantalla es decorativo. **No lee código**. | La aplicación — no hace falta leer nada más |
| ❤️ **Apoyo**: familia, docente, terapeuta | Prepara a la persona usuaria y supervisa el progreso | Define el nombre de quien aprende en el juego de palabras (el slot `name` en `WORDS` de `data.js`); supervisa el progreso por las estrellas ⭐ en la vista de progreso embebida. | [`CONTRIBUTING.es.md`](../../CONTRIBUTING.es.md) (la sección "Apoyo") |
| 💻 **Construcción**: desarrollador/a | Mantiene los layouts de teclado, las lecciones y el SW | Edita `data.js` (los arrays `LESSONS`, `WORDS`, `NUMPAD`), `app.js`, `sw.js` y `strings.<locale>.js`; ejecuta [`scripts/check.js`](../../scripts/check.js), sube el `VERSION` en `sw.js` y despliega. | [`CLAUDE.md`](../../CLAUDE.md) · [`tecnico.md`](tecnico.md) |

> 💡 La persona usuaria final es siempre alguien que se beneficia de la
> lectura fácil, un ritmo sin presión y pantallas sin ruido — ver
> [`SPEC.md`](SPEC.md) §2. Las decisiones de contenido, lenguaje e
> interfaz se piensan siempre desde su experiencia. Lo que queda fuera
> de su participación son las decisiones puramente técnicas (la
> secuencia de lecciones, la forma de `progress.json`, GitHub) — no
> por exclusión, sino porque es el ámbito de apoyo/construcción.

## Por dónde empezar, según tu perfil

| Si eres… | Empieza por… |
|---|---|
| 👤 Persona usuaria o familiar directo | La aplicación — no hace falta leer nada técnico |
| ❤️ Familia o docente que prepara el nombre de quien aprende y supervisa el progreso | [`README.es.md`](../../README.es.md) (la sección "Preparar / Ampliar contenido") |
| ❤️ Persona de apoyo que reporta una lección que falta o una redacción poco clara | [`CONTRIBUTING.es.md`](../../CONTRIBUTING.es.md) (la sección "Apoyo") |
| 🤔 Solo quiero entender qué es Teclatlon | [`README.es.md`](../../README.es.md) |
| 💻 Desarrollador/a | [`CLAUDE.md`](../../CLAUDE.md) · [`tecnico.md`](tecnico.md) |

## 🤝 Un proyecto pequeño y enfocado

A diferencia de un producto con varios equipos, Teclatlon es
deliberadamente pequeño: una app de una sola actividad, una secuencia
de lecciones en `data.js`, un shell de PWA, sin backend. El rol de
**apoyo** es estrecho a propósito — Teclatlon está pensada para
usarse sola, con el teclado físico, una vez definido el nombre de
quien aprende; la persona de **apoyo** ayuda en la configuración y
supervisa el progreso, pero no se sienta al lado de quien aprende en
cada lección. Los tres roles se documentan por separado para que
quien se incorpore al proyecto sepa qué se espera de cada perfil, no
porque tengan que hacerlo tres personas distintas.
