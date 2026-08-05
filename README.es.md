# Teclatlon

> 🌐 **Otros idiomas:** [English](README.md)

Una aplicación web gratuita, estática y sin dependencias para aprender a
escribir con el **teclado del ordenador**. Enseña a colocar los dedos,
lecciones letra a letra, práctica de palabras, teclado numérico y
escritura libre — con un teclado en pantalla decorativo que refleja el
teclado físico. Sin cuentas, sin cookies, sin analítica: todo se ejecuta
en el navegador y el progreso solo se guarda en `localStorage`, en tu
propio dispositivo.

[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
[![Sin dependencias](https://img.shields.io/badge/dependencias-ninguna-success.svg)](#-caracter%C3%ADsticas)
[![Sitio estático](https://img.shields.io/badge/build-ninguno-informational.svg)](#-arranque-r%C3%A1pido)
[![PWA](https://img.shields.io/badge/PWA-instalable-5A0FC8.svg)](manifest.json)
[![i18n](https://img.shields.io/badge/i18n-es%20%7C%20en-yellow.svg)](README.md)
[![CI](https://img.shields.io/badge/CI-node%20scripts%2Fcheck.js-blue.svg)](.github/workflows/validate.yml)

---

## 🚀 Demo en vivo

La app está desplegada como sitio estático en **Cloudflare Pages**.
El subdominio `<project-name>.pages.dev` lo asigna Cloudflare a
partir del nombre del proyecto declarado en el dashboard — no está
comprometido en el repo. Ver [`CLOUDFLARE.md`](CLOUDFLARE.md) para
el detalle.

> URL por defecto tras el primer deploy: `https://teclatlon.pages.dev`
> (sustituir por el subdominio real cuando el proyecto esté creado
> en Cloudflare, o por el dominio personalizado si lo hay).

Es una Progressive Web App: en la primera visita, el navegador puede
instalarla en la pantalla de inicio / dock y usarla sin conexión.

---

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

### Validar

```bash
node scripts/check.js
```

La validación no usa dependencias (solo stdlib de Node) y
comprueba:

- Sintaxis de JS en toda la app y en el shell PWA.
- Paridad de claves `es` ↔ `en` en `strings.es.js` / `strings.en.js`
  y en `legal/`.
- Que cada ruta en `ARCHIVOS` de `sw.js` existe en disco.
- Que cada icono de `manifest.json` existe.

Es el único paso de "test" y se ejecuta en cada push y PR vía
[`.github/workflows/validate.yml`](.github/workflows/validate.yml).

### Desplegar

El despliegue lo controla el **conector Git de Cloudflare Pages** —
ver [`CLOUDFLARE.md`](CLOUDFLARE.md) para el detalle completo
(configuración de build, por qué no hay `wrangler.toml`, por qué no
hay `_redirects`, por qué no hay `package.json`). El repo no incluye
intencionadamente ficheros de configuración de despliegue.

---

## 📚 Documentación

| Tema | Documento |
|---|---|
| Producto, audiencia, reglas de accesibilidad | [`doc/es/SPEC.md`](doc/es/SPEC.md) |
| Arquitectura y referencia técnica | [`doc/es/tecnico.md`](doc/es/tecnico.md) |
| Flujo operativo para agentes de IA | [`CLAUDE.md`](CLAUDE.md) |
| Notas de despliegue en Cloudflare Pages | [`CLOUDFLARE.md`](CLOUDFLARE.md) |

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
| **Apptonomia** *(principal)* | Terapia ocupacional: 7 módulos, 69 actividades | [github.com/miralante/apptonomia](https://github.com/miralante/apptonomia) |
| Calculia | Cálculo y razonamiento lógico: 12 actividades | [github.com/miralante/calculia](https://github.com/miralante/calculia) |
| Okeymoney | Finanzas personales y autonomía cotidiana | [github.com/miralante/okeymoney](https://github.com/miralante/okeymoney) |
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
