# Contribuir a Teclatlon

¡Gracias por tu interés! Antes de abrir un issue o un PR, echa un
vistazo a:

- [`doc/es/SPEC.md`](doc/es/SPEC.md) — reglas de producto y
  accesibilidad no negociables.
- [`doc/es/tecnico.md`](doc/es/tecnico.md) — arquitectura y
  restricciones técnicas.
- [`CLAUDE.md`](CLAUDE.md) — flujo de trabajo que seguimos al
  modificar el repo.

> **Sobre la suite Miralante** — Teclatlon es una de las **seis apps**
> de la [suite Miralante](https://apptonomia.uk) (Calculia, Memofun,
> Okeymoney, Routime, Sinonimia, Teclatlon). El repo
> [Apptonomia](https://github.com/miralante/apptonomia) aloja
> **únicamente el portal de la suite** — no es una app en tiempo de
> ejecución. La tabla completa de la suite vive en la sección
> ["La suite Miralante — proyectos del grupo" del `README.es.md`](README.es.md#-la-suite-miralante--proyectos-del-grupo).

## Cómo contribuir

- **Bugs y peticiones de producto**: usa las
  [plantillas de issue](../../.github/ISSUE_TEMPLATE/).
- **Pull requests**: usa la
  [plantilla de PR](../../.github/PULL_REQUEST_TEMPLATE.md).

## Cambios de producto: ambos idiomas

`es` es el idioma por defecto y la fuente de verdad. Si tocas
cadenas de UI, lecciones, palabras o pasos del numérico, actualiza
simultáneamente `strings.es.js` y `strings.en.js` (raíz y
`legal/`, según el caso). `node scripts/check.js` impone paridad
de claves, pero no calidad de traducción: revisa los dos idiomas.

## Estilo de código

- JavaScript estilo ES5 (`var`, funciones clásicas, IIFE con
  `'use strict'`).
- Identificadores, comentarios y mensajes de commit en inglés.
- Texto de UI en el idioma que representa.
- Sin frameworks, sin bundlers, sin CDNs de JS.

## Entorno de desarrollo

```bash
npx serve .
# o
python -m http.server 8080
```

No hay paso de build. `node scripts/check.js` es el único paso
de validación (lo corre también el CI en cada push y PR).

## Cómo reportar una vulnerabilidad

Ver [`SECURITY.md`](SECURITY.md).
