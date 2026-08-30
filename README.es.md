# Teclatlon ⌨️

> 🌐 **Otros idiomas:** [English](README.md)
>
> 🚀 **Pruébalo en vivo:** <https://teclatlon.miralante.workers.dev>

[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
[![Sin dependencias](https://img.shields.io/badge/dependencias-ninguna-success.svg)](#-caracter%C3%ADsticas)
[![Sitio estático](https://img.shields.io/badge/build-ninguno-informational.svg)](#-arranque-r%C3%A1pido)
[![PWA](https://img.shields.io/badge/PWA-instalable-5A0FC8.svg)](manifest.json)
[![i18n](https://img.shields.io/badge/i18n-es%20%7C%20en-yellow.svg)](#-documentaci%C3%B3n)
[![CI](https://img.shields.io/badge/CI-node%20scripts%2Fcheck.js-blue.svg)](.github/workflows/validate.yml)

Una aplicación web gratuita, estática y sin dependencias para aprender a
escribir con el **teclado del ordenador**. Enseña a colocar los dedos,
lecciones letra a letra, práctica de palabras, teclado numérico y
escritura libre — con un teclado en pantalla decorativo que refleja el
teclado físico. Sin cuentas, sin cookies, sin analítica: todo se ejecuta
en el navegador y el progreso solo se guarda en `localStorage`, en tu
propio dispositivo.

---

## 🚀 Pruébalo en vivo

La app está desplegada como sitio estático en **Cloudflare Workers
(static assets)** en **<https://teclatlon.miralante.workers.dev>** (o
el dominio personalizado, si lo hay). Es una Progressive Web App: en
la primera visita, el navegador puede instalarla en la pantalla de
inicio / dock y usarla sin conexión.

---

## 👥 Roles del proyecto

| Rol | Quién es | Cómo participa | Dónde mira primero |
|---|---|---|---|
| 👤 **Persona usuaria** (usuario/a tipo) | Practica mecanografía con el teclado físico | Abre la app en un navegador y escribe con el teclado **físico**; el teclado en pantalla es decorativo | La aplicación |
| ❤️ **Apoyo / familia / docente** | Ayuda a la persona usuaria a configurar o avanzar en las lecciones | Define el nombre de quien aprende en el juego de palabras; supervisa el progreso por las estrellas ⭐ | [`CONTRIBUTING.es.md`](CONTRIBUTING.es.md) (la sección "Apoyo") |
| 💻 **Construcción / desarrollador/a** | Mantiene los layouts de teclado, las lecciones y el SW | Edita `data.js`, `app.js`, `sw.js`, `strings.<locale>.js`; ejecuta `node scripts/check.js` | [`CLAUDE.md`](CLAUDE.md) |

Para la descripción completa de los roles en contexto (con el resto de
la suite), ver [`CLAUDE.md`](CLAUDE.md).

---

## 📚 Documentación del proyecto (bilingüe)

| Idioma | Punto de entrada |
|---|---|
| 🇪🇸 Español (este archivo) | [`README.es.md`](README.es.md) |
| 🇬🇧 English | [`README.md`](README.md) |

| Tema | Documento |
|---|---|
| Producto, audiencia, reglas de accesibilidad | [`doc/es/SPEC.md`](doc/es/SPEC.md) |
| Arquitectura y referencia técnica | [`doc/es/tecnico.md`](doc/es/tecnico.md) |
| Flujo operativo para agentes de IA | [`CLAUDE.md`](CLAUDE.md) |
| Notas de despliegue en Cloudflare Workers | [`CLOUDFLARE.md`](CLOUDFLARE.md) |

El historial del proyecto vive en `git log`; no se mantiene una hoja de
ruta externa.

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

---

## 🧹 Mantenimiento

Este repo no tiene `node_modules` ni artefactos de build. Para limpiar
la caché local de la PWA durante el desarrollo, desregistra el SW
desde DevTools (`Application → Service workers → Unregister`) y borra
los datos del sitio. El SW de Teclatlon es network-first, así que un
hard refresh toma el código nuevo directamente cuando hay buena
conexión — la caché solo importa para uso sin red.

El fichero `data.js` es grande (lleva los tres arrays de práctica
divididos por idioma); no lo partas en ficheros por idioma sin
actualizar la arquitectura i18n — ver [`doc/es/I18N.md`](doc/es/I18N.md)
con la receta.

---

## 🙏 Créditos

Teclatlon salió de un proyecto hermano (Apptonomia, una suite más
amplia de actividades de terapia ocupacional) donde esto era una
actividad entre muchas, con un modo móvil de teclado en pantalla
pulsable que se descartó deliberadamente aquí. **Teclatlon está
pensada para el teclado del ordenador solo** — el teclado en
pantalla es decorativo; la entrada real es siempre el teclado
físico.

El sistema de colores por dedo/mano y las guías de la fila base se
derivan de la pedagogía estándar de mecanografía, simplificada para
una experiencia a una sola pantalla.

## ✨ Características

- 🖐️ **Colocación de los dedos** — guías visuales de la fila base con
  un mapa de colores por dedo / mano, persistido por sesión.
- 📚 **Lecciones letra a letra** — un orden fijo de andamiaje que
  desbloquea la siguiente tecla cuando se domina la anterior.
- 🔤 **Juego de palabras** — palabras aleatorias y un hueco para el
  nombre de quien aprende.
- 🔢 **Juego del teclado numérico** — para el keypad numérico de la
  derecha.
- 🎯 **Reto "todas las teclas"** — prueba mixta con todo el teclado.
- ✍️ **Escritura libre** — texto a voz que lee lo escrito.
- 🔒 **Privado por defecto** — sin cuentas, sin cookies, sin
  analítica: todo el progreso vive en `localStorage` en el dispositivo
  del usuario.
- 🌐 **Bilingüe** — interfaz en español (por defecto) e inglés.
- 📦 **Funciona sin conexión** — PWA instalable con service worker
  que pre-cachea el shell (`sw.js`).
- 🪶 **Sin dependencias en tiempo de ejecución** — HTML/CSS/JS puros,
  sin build.

---

## 🚀 Arranque rápido

### Ejecutar en local

```bash
# cualquiera de estas sirve la carpeta como sitio estático
npx serve .
# o
python -m http.server 8080
# o simplemente abre index.html en el navegador
```

No hace falta `npm install`, no hay paso de build. La experiencia PWA
completa (service worker, cache offline, prompt de instalación)
requiere servir por `http://` o `https://` — abrir `index.html` por
`file://` funciona para la app en sí, pero desactiva el SW y el
prompt de instalación.

---

## ✅ Validar los cambios

```bash
node scripts/check.js
```

La validación no usa dependencias (solo stdlib de Node) y
comprueba:

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

El despliegue lo controla el **conector Git de Cloudflare Workers** —
ver [`CLOUDFLARE.md`](CLOUDFLARE.md) para el detalle completo
(configuración de build, por qué existe `wrangler.toml`, por qué no
hay `_redirects`, por qué no hay `package.json`). El repo incluye un
[`wrangler.toml`](wrangler.toml) mínimo (binding de static assets y
gestión del 404) y ningún otro fichero de configuración de despliegue.

Las pull requests reciben automáticamente una URL de previsualización —
sin necesidad de un workflow extra.

---

## 📚 Documentación

| Tema | Documento |
|---|---|
| Producto, audiencia, reglas de accesibilidad | [`doc/es/SPEC.md`](doc/es/SPEC.md) |
| Arquitectura y referencia técnica | [`doc/es/tecnico.md`](doc/es/tecnico.md) |
| Flujo operativo para agentes de IA | [`CLAUDE.md`](CLAUDE.md) |
| Notas de despliegue en Cloudflare Workers | [`CLOUDFLARE.md`](CLOUDFLARE.md) |

El historial del proyecto vive en `git log`; no se mantiene una hoja de
ruta externa.

---

## 🤝 Contribuir

Issues y pull requests son bienvenidos. El repo es pequeño y el
[workflow de validación](.github/workflows/validate.yml) es la
puerta de entrada: cada PR debe pasar `node scripts/check.js`.

Cuando cambies contenido de producto (cadenas de UI, lecciones,
palabras) actualiza **ambos** `strings.es.js` y `strings.en.js` —
`es` es el idioma por defecto y la fuente de verdad. El script de
validación impone paridad de claves, pero no de calidad de
traducción: revisa los dos idiomas.

Ver [`CONTRIBUTING.es.md`](CONTRIBUTING.es.md) (o
[`CONTRIBUTING.md`](CONTRIBUTING.md) para la versión en inglés)
para el flujo completo de contribución, y las
[plantillas de issue](.github/ISSUE_TEMPLATE/) y
[plantilla de PR](.github/PULL_REQUEST_TEMPLATE.md) para el día
a día.

---

## 🛡️ Seguridad

Teclatlon es un sitio estático totalmente del lado del cliente: no
tiene servidor, ni backend, ni base de datos, ni telemetría. El
modelo de amenaza es esencialmente "qué podría hacer una página
maliciosa offline contra el mismo origen", algo que el navegador ya
aísla.

Ver [`SECURITY.es.md`](SECURITY.es.md) (o [`SECURITY.md`](SECURITY.md)
para la versión en inglés) para reportar una sospecha de forma
privada.

---

## 📚 Documentación

| Tema | Documento |
|---|---|
| Producto, audiencia, reglas de accesibilidad | [`doc/es/SPEC.md`](doc/es/SPEC.md) |
| Arquitectura y referencia técnica | [`doc/es/tecnico.md`](doc/es/tecnico.md) |
| Flujo operativo para agentes de IA | [`CLAUDE.md`](CLAUDE.md) |
| Notas de despliegue en Cloudflare Workers | [`CLOUDFLARE.md`](CLOUDFLARE.md) |

El historial del proyecto vive en `git log`; no se mantiene una hoja de
ruta externa.

---

## 🧩 Proyectos hermanos

Este proyecto forma parte de un pequeño grupo de proyectos hermanos
que comparten autor, la misma filosofía de accesibilidad y sin
backend, y la misma historia de despliegue. **Apptonomia es el
proyecto principal**; los demás (Calculia, Okeymoney, Sinonimia,
Teclatlon) salieron de él o se construyeron a su lado sobre el
mismo stack.

| Proyecto | Qué es | Repositorio |
|---|---|---|
| **Apptonomia** *(principal)* | Actividades para rutinas y vida cotidiana (diseñado para nuestros/as usuarios/as tipo) | [github.com/miralante/apptonomia](https://github.com/miralante/apptonomia) |
| Calculia | Cálculo y razonamiento lógico | [github.com/miralante/calculia](https://github.com/miralante/calculia) |
| Memofun | Tarjetas de memoria con aprendizaje significativo | [github.com/miralante/memofun](https://github.com/miralante/memofun) |
| Okeymoney | Finanzas personales y autonomía cotidiana | [github.com/miralante/okeymoney](https://github.com/miralante/okeymoney) |
| Routime | Actividades para rutinas y vida cotidiana | [github.com/miralante/routime](https://github.com/miralante/routime) |
| Sinonimia | Diccionario en lectura fácil | [github.com/miralante/sinonimia](https://github.com/miralante/sinonimia) |
| Teclatlon | Mecanografía con el teclado físico | [github.com/miralante/teclatlon](https://github.com/miralante/teclatlon) |

La guía canónica de Cloudflare / despliegue para el grupo vive en
[`CLOUDFLARE.md` de Apptonomia](https://github.com/miralante/apptonomia/blob/master/CLOUDFLARE.md).
El [`CLOUDFLARE.md`](CLOUDFLARE.md) de este repo es el específico del
proyecto, encima de esa guía.

---

## 📄 Licencia

MIT — ver [`LICENSE`](LICENSE).

Copyright (c) 2026 Teclatlon contributors.

