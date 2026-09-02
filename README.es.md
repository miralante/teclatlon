# Teclatlon ⌨️

> 🌐 **Otros idiomas:** [English](README.md)
>
> 🚀 **Pruébalo en vivo:** [teclatlon.apptonomia.uk](https://teclatlon.apptonomia.uk/)

[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
[![Sin dependencias](https://img.shields.io/badge/dependencias-ninguna-success.svg)](#-caracter%C3%ADsticas)
[![Sitio estático](https://img.shields.io/badge/build-ninguno-informational.svg)](#-caracter%C3%ADsticas)
[![PWA](https://img.shields.io/badge/PWA-instalable-5A0FC8.svg)](manifest.json)
[![i18n](https://img.shields.io/badge/i18n-es%20%7C%20en-yellow.svg)](#-documentaci%C3%B3n-del-proyecto-biling%C3%BCe)
[![CI](https://img.shields.io/badge/CI-node%20scripts%2Fcheck.js-blue.svg)](.github/workflows/validate.yml)

Una aplicación web gratuita, estática y sin dependencias para aprender
a escribir con el **teclado del ordenador**. Enseña a colocar los
dedos, lecciones letra a letra, práctica de palabras, teclado numérico
y escritura libre — con un teclado en pantalla decorativo que refleja
el teclado físico. Sin cuentas, sin cookies, sin analítica: todo se
ejecuta en el navegador y el progreso solo se guarda en `localStorage`,
en tu propio dispositivo.

- 🌐 **Aplicación**: [teclatlon.apptonomia.uk](https://teclatlon.apptonomia.uk/)
- 📦 **Repositorio**: [github.com/miralante/teclatlon](https://github.com/miralante/teclatlon)
- 💻 **Ejecutar en local**: abre `index.html` directamente en un
  navegador, o sirve la carpeta con cualquier servidor estático
  (`npx serve .` / `python -m http.server 8080`) para la experiencia
  PWA completa, con soporte sin conexión.

---

## 🚀 Pruébalo en vivo

Teclatlon está desplegada en **[teclatlon.apptonomia.uk](https://teclatlon.apptonomia.uk/)**
— ábrela en un navegador, instálala en la pantalla de inicio para
usarla sin conexión, y empieza una lección. El teclado en pantalla es
decorativo; la entrada real es siempre el teclado físico.

---

## ✨ Características

- 🖐️ **Colocación de los dedos** — guías visuales de la fila base con
  un mapa de colores por dedo / mano, persistido por sesión.
- 📚 **Lecciones letra a letra** — un orden fijo de andamiaje que
  desbloquea la siguiente tecla cuando se domina la anterior.
- 🔤 **Juego de palabras** — listas de palabras aleatorias por idioma
  y un hueco para el nombre de quien aprende.
- 🔢 **Juego del teclado numérico** — para el keypad numérico de la
  derecha.
- 🎯 **Reto "todas las teclas"** — prueba mixta con todo el teclado.
- ✍️ **Escritura libre** — texto a voz que lee lo escrito.
- 🪶 **Sin dependencias en tiempo de ejecución** — HTML/CSS/JS puros,
  sin paso de build.
- 🌐 **Bilingüe** — interfaz en español (por defecto) e inglés.
- 🔒 **Privacidad por defecto** — sin cuentas, sin cookies, sin
  analítica: todo el progreso vive en `localStorage` en el dispositivo
  del usuario.
- 📦 **PWA instalable** — funciona sin conexión.
- 🖐️ **Accesibilidad** — áreas de pulsación grandes, alto contraste,
  navegación completa por teclado, `prefers-reduced-motion`,
  compatible con lectores de pantalla.

---

## 👥 Roles del proyecto

| Rol | Quién es | Cómo participa | Dónde mira primero |
|---|---|---|---|
| 👤 **Persona usuaria** (persona tipo) | Practica mecanografía con el teclado físico | Abre la app en un navegador y escribe con el teclado **físico**; el teclado en pantalla es decorativo | La aplicación |
| ❤️ **Apoyo / familia / docente** | Ayuda a la persona usuaria a configurar o avanzar en las lecciones | Define el nombre de quien aprende en el juego de palabras; supervisa el progreso por las estrellas ⭐ | [`CONTRIBUTING.es.md`](CONTRIBUTING.es.md) (la sección "Apoyo") |
| 💻 **Construcción / desarrollador/a** | Mantiene los layouts de teclado, las lecciones y el SW | Edita `data.js`, `app.js`, `sw.js`, `strings.<locale>.js`; ejecuta `node scripts/check.js` | [`CLAUDE.md`](CLAUDE.md) |

Ver [`doc/es/roles.md`](doc/es/roles.md) para la descripción completa
de los roles y los patrones trio/par/único del conjunto de la suite.

---

## 📚 Documentación del proyecto (bilingüe)

Toda la documentación del proyecto vive en la carpeta `doc/`:

| Idioma | Punto de entrada |
|---|---|
| 🇪🇸 Español (este archivo) | [`doc/es/indice.md`](doc/es/indice.md) |
| 🇬🇧 English | [`doc/en/index.md`](doc/en/index.md) |

Según tu rol y perfil, te interesa una u otra documentación:

| Soy… | Empieza por… |
|---|---|
| 👤 Persona usuaria o familiar | [`doc/es/README.md`](doc/es/README.md) |
| ❤️ Terapeuta, familiar o profesional de apoyo | [`doc/es/equipo.md`](doc/es/equipo.md) |
| 🤔 Quiero entender qué es Teclatlon y por qué | [`doc/es/SPEC.md`](doc/es/SPEC.md) |
| 💻 Desarrollador/a | [`doc/es/tecnico.md`](doc/es/tecnico.md) |

### 📄 Otros documentos del repo

| Documento | Para quién |
|---|---|
| [`CONTRIBUTING.es.md`](CONTRIBUTING.es.md) | Familias, terapeutas y desarrolladores que quieran contribuir |
| `CLAUDE.md` | Agentes IA: reglas obligatorias y estado del proyecto |
| [`CLOUDFLARE.md`](CLOUDFLARE.md) | Guía canónica de despliegue en Cloudflare Workers para la suite (Teclatlon + Apptonomia + Calculia, Memofun, Okeymoney, Sinonimia) |
| Historial del proyecto | En `git log`; no se mantiene una hoja de ruta externa |
| `doc/es/I18N.md` / `doc/en/I18N.md` | Detalles del sistema multiidioma ES/EN |

---

## 🛠️ Preparar / Ampliar contenido

Teclatlon es una app de una sola actividad, así que "preparar contenido"
significa editar uno de los tres arrays divididos por idioma en
`data.js`:

- **`LESSONS`** — el orden fijo de andamiaje de letras
  (`lesson-01-homerow` hasta `lesson-NN-extra-keys`). Cada lección
  desbloquea la siguiente cuando se domina la anterior.
- **`WORDS`** — listas de palabras aleatorias por idioma, más el slot
  `name` para el nombre de quien aprende.
- **`NUMPAD`** — pasos de práctica del teclado numérico de la derecha.

Para añadir una lección nueva:

1. Edita el array `LESSONS` en `data.js` (español) y el array `LESSONS`
   en la sección del espejo inglés.
2. Actualiza la forma de `progress.json` si la lección introduce un
   nuevo tipo de paso de práctica — ver [`doc/es/tecnico.md`](doc/es/tecnico.md)
   §"Motor del juego de secuencia" para el gancho en tiempo de
   ejecución que añade un paso de repaso al final de cada lección.
3. Actualiza `strings.es.js` y `strings.en.js` si la lección añade
   copy nuevo visible para quien aprende (título de la lección,
   instrucción, feedback).
4. Sube el `VERSION` en `sw.js` (el SW network-first sirve la caché
   solo cuando no hay red — sube liberalmente).

El fichero `data.js` es grande (lleva los tres arrays de práctica
divididos por idioma); no lo partas en ficheros por idioma sin
actualizar la arquitectura i18n — ver [`doc/es/I18N.md`](doc/es/I18N.md)
con la receta.

---

## ✅ Validar los cambios

```bash
node scripts/check.js
```

No hace falta `npm install` — el script solo usa la librería estándar
de Node. Comprueba:

- Sintaxis de JS en toda la app y en el shell PWA.
- Paridad de claves `es` ↔ `en` en `strings.es.js` / `strings.en.js`
  y en `legal/`.
- Que cada ruta en `FILES` de `sw.js` existe en disco.
- Que cada icono de `manifest.json` existe.
- Que las expresiones de origen del CSP en `_headers` llevan las
  comillas correctas (p. ej. `'self'`, no `''self''`).

Es el único paso de "test" y se ejecuta en cada push y PR vía
[`.github/workflows/validate.yml`](.github/workflows/validate.yml).

---

## ☁️ Despliegue

Teclatlon es un sitio totalmente estático (HTML/CSS/JS, sin build), así
que se publica directamente en **[Cloudflare Workers (static assets)](https://developers.cloudflare.com/workers/static-assets/)**
mediante su integración nativa con GitHub. Las cabeceras de seguridad
HTTP viven en [`_headers`](_headers), y la metadata del proyecto en
[`wrangler.toml`](wrangler.toml). Consulta [`CLOUDFLARE.md`](CLOUDFLARE.md)
con la guía completa (rebuild, rollback, dominio personalizado,
rotación de credenciales).

Las pull requests reciben automáticamente una URL de previsualización
en `*.<subdominio-cuenta>.workers.dev` — sin necesidad de un workflow
extra.

---

## 🔐 Seguridad

Teclatlon es un sitio estático totalmente del lado del cliente: no
tiene servidor, ni backend, ni base de datos, ni telemetría. El
modelo de amenaza es esencialmente "qué podría hacer una página
maliciosa offline contra el mismo origen", algo que el navegador ya
aísla.

Ver [`SECURITY.es.md`](SECURITY.es.md) (o [`SECURITY.md`](SECURITY.md)
para la versión en inglés) para reportar una sospecha de forma
privada.

---

## 📄 Licencia

MIT — ver [`LICENSE`](LICENSE).

Copyright (c) 2026 Teclatlon contributors.

---

## 🧹 Mantenimiento

Este repo no tiene `node_modules` ni artefactos de build. Para limpiar
la caché local de la PWA durante el desarrollo, desregistra el SW
desde DevTools (`Application → Service workers → Unregister`) y borra
los datos del sitio. El SW de Teclatlon es network-first, así que un
hard refresh toma el código nuevo directamente cuando hay buena
conexión — la caché solo importa para uso sin red.

---

## 🙏 Créditos

Teclatlon salió de la app Apptonomia de la suite (que fue el origen
del grupo con una suite más amplia de actividades de terapia
ocupacional) donde esto era una actividad entre muchas, con un modo
móvil de teclado en pantalla pulsable que se descartó deliberadamente
aquí. **Teclatlon está pensada para el teclado del ordenador solo** —
el teclado en pantalla es decorativo; la entrada real es siempre el
teclado físico.

El sistema de colores por dedo/mano y las guías de la fila base se
derivan de la pedagogía estándar de mecanografía, simplificada para
una experiencia a una sola pantalla.

---

## 🌐 La suite Miralante — proyectos del grupo

Teclatlon es una de las **seis apps** de la suite **Miralante**, que
comparten autor, la misma filosofía de accesibilidad sin backend y la
misma historia de despliegue en Cloudflare. Apptonomia, además de ser
una app en sí misma, actúa como **portal de la suite** que la presenta
al mundo. Ninguno de los siete repos es el "principal" — son iguales;
este es el producto original del que nació el grupo.

| Proyecto | Qué es | Repositorio |
|---|---|---|
| **Apptonomia** *(portal — landing only, no es app)* | Landing que presenta la suite Miralante (no es una app en tiempo de ejecución) | [github.com/miralante/apptonomia](https://github.com/miralante/apptonomia) |
| [Calculia](https://calculia.apptonomia.uk/) | Cálculo y razonamiento lógico | [github.com/miralante/calculia](https://github.com/miralante/calculia) |
| [Memofun](https://memofun.apptonomia.uk/) | Tarjetas de memoria con aprendizaje significativo | [github.com/miralante/memofun](https://github.com/miralante/memofun) |
| [Okeymoney](https://okeymoney.apptonomia.uk/) | Finanzas personales y autonomía cotidiana | [github.com/miralante/okeymoney](https://github.com/miralante/okeymoney) |
| [Routime](https://routime.apptonomia.uk/) | Actividades para rutinas y vida cotidiana | [github.com/miralante/routime](https://github.com/miralante/routime) |
| [Sinonimia](https://sinonimia.apptonomia.uk/) | Diccionario en lectura fácil | [github.com/miralante/sinonimia](https://github.com/miralante/sinonimia) |
| [Teclatlon](https://teclatlon.apptonomia.uk/) | Mecanografía con el teclado físico | [github.com/miralante/teclatlon](https://github.com/miralante/teclatlon) |

La guía canónica de Cloudflare / despliegue para el grupo vive en
[`CLOUDFLARE.md` de Apptonomia](https://github.com/miralante/apptonomia/blob/master/CLOUDFLARE.md).
Este repo usa el modelo **Workers + static assets** (`wrangler.toml`
+ `[assets]`), que es una forma distinta al modelo Pages clásico de
Apptonomia/Teclatlon — ver [`CLOUDFLARE.md`](CLOUDFLARE.md) para la
guía local.

## More about this project

- [Privacy](https://teclatlon.apptonomia.uk/legal/)
