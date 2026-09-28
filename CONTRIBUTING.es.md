# Contribuir a Teclatlon

> 🌐 **Otros idiomas:** [English](CONTRIBUTING.md)
>
> **Parte de la suite [Miralante](https://apptonomia.uk)** —
> Teclatlon es uno de los siete proyectos hermanos (Apptonomia,
> Calculia, Memofun, Okeymoney, Routime, Sinonimia, Teclatlon) que
> comparten el mismo flujo de trabajo, las mismas reglas de
> accesibilidad y el mismo código de conducta. Este repo publica
> **Teclatlon** en sí (entrenador de mecanografía con teclado físico;
> **no** es una app táctil).

Gracias por tu interés en contribuir. Esta guía cubre el flujo de
trabajo en GitHub que seguimos en toda la suite, los roles del
proyecto y el pequeño conjunto de recetas que mantienen a cada
hermano coherente.

---

## 🔀 Flujo de trabajo en GitHub

```text
1. 🔍 Buscar o crear un issue (en español o inglés)
2. 💬 Comentar y consensuar el alcance
3. 🌿 Crear una rama (fork si no tienes acceso de push)
4. ✏️  Hacer los cambios siguiendo las recetas de abajo
5. 📤 Abrir un Pull Request (PR) referenciando el issue
6. 👀 Esperar revisión (al menos 1 de un maintainer)
7. ✅ Merge cuando hay aprobación
```

**Etiquetas de issues** (las usamos para clasificar):

| Etiqueta | Significado |
|---|---|
| `UX` | Mejora de usabilidad o experiencia |
| `contenido` | Lecciones, palabras, pasos del teclado numérico, traducciones |
| `bug` | Error reproducible en el comportamiento |
| `tech` | Implementación técnica, refactor |
| `docs` | Cambios en la documentación |
| `good first issue` | Apto para una primera contribución |

### Convenciones de ramas

- `feat/<slug>` — nuevas funcionalidades
- `fix/<slug>` — corrección de bugs
- `docs/<slug>` — cambios solo en documentación
- `content/<slug>` — cambios solo de contenido (lecciones, palabras, dígitos)
- `i18n/<código>` — traducción a un idioma (ej. `i18n/ca`, `i18n/gl`)

### Commits

- Mensaje en **inglés** (convención del repo), resumen en imperativo.
- Una cosa por commit — commits grandes se pueden pedir trocear.
- Si cierran un issue, incluir `Closes #123` al final.

---

## 👥 Roles del proyecto

| # | Rol | Lee primero |
|---|---|---|
| 1 | 👤 **Persona usuaria** | La app — nunca este fichero. |
| 2 | 🤝 **Apoyo** (familia / docente / terapeuta) | El `doc/es/roles.md` y la `doc/es/guia-rapida.md`. |
| 3 | 💻 **Persona constructora** (contenido o código) | Este fichero, más el `doc/es/SPEC.md`, el `doc/es/tecnico.md` y el `CLAUDE.md`. |

> Las decisiones puramente técnicas viven en el rol de persona
> constructora, **no porque se ignore a la persona usuaria, sino
> porque ese es el dominio de cada rol.** Las decisiones de
> producto, contenido, idioma y diseño de UI **se prueban y validan
> con la persona usuaria siempre que es posible**, y su feedback es
> la fuente principal de mejora.

---

## 📝 Qué puedes aportar

- **Correcciones de copy** — typos, redacción más clara, ajustes de
  accesibilidad en `strings.es.js` / `strings.en.js`.
- **Nuevo idioma** — consulta el `doc/es/I18N.md` para la receta
  completa.
- **Nuevo contenido de lección** — consulta el `doc/es/tecnico.md`
  para la forma de los datos de layout de teclado / lección.
- **Accesibilidad** — contraste, orden de foco, visibilidad de foco,
  `prefers-reduced-motion`, etiquetas ARIA, copy en lectura fácil
  (UNE 153101).
- **Corrección de bugs** — cualquier cosa que se rompa en un
  navegador soportado.
- **Cabeceras de seguridad / CSP** — endurecer la política en
  `_headers`.

---

## 🌐 Recetas

### Corrección de copy

1. Edita el `strings.<locale>.js` fuente de verdad (`es` por defecto).
2. Refleja el cambio en todos los demás ficheros de strings
   (`en` como mínimo).
3. Ejecuta `node scripts/check.js` para verificar la paridad de claves.
4. Abre un PR con una descripción de una línea.

### Nuevo idioma

Consulta el `doc/es/I18N.md` para el paso a paso completo. Añadir un
idioma **no requiere cambios** en el bootstrap ni en el código de la
app; el nuevo contenido de práctica (lecciones, palabras, pasos del
teclado numérico) va en `data.js`.

### Mejora de accesibilidad

Lee primero el `doc/es/SPEC.md` §3 — las restricciones innegociables
viven ahí (botones ≥ 64×64 px, contraste WCAG AA con AAA como
objetivo de diseño, copy en lectura fácil, feedback sin presión).
Teclatlon además **no soporta entrada táctil / tap** — la restricción
al teclado físico es deliberada.

### Añadir o endurecer una cabecera de seguridad

Las cabeceras viven en `_headers`. La CSP es deliberadamente
estricta (`script-src 'self'`, sin scripts inline; JSON-LD es dato y
no necesita `unsafe-inline`). Endurecerla es bienvenido; relajarla
casi nunca lo es — abre un issue antes.

---

## ✅ Checklist antes de abrir PR

- [ ] `node scripts/check.js` pasa en local.
- [ ] Si tocaste `sw.js`, `node scripts/check-version-bump.js` pasa y
      bumpeaste `VERSION` por cualquier cambio en un fichero cacheado.
- [ ] Si añadiste cadenas de UI o contenido, todos los locales
      soportados están en sincronía.
- [ ] Probaste el cambio en un navegador real de escritorio con
      teclado físico.
- [ ] No añadiste ninguna dependencia de runtime nueva — solo HTML /
      CSS / JS vanilla.
- [ ] No aflojaste la CSP en `_headers` sin abrir un issue.

---

## 🚫 Lo que este repositorio NO acepta

- **Relajar la CSP** (`script-src 'self'` se queda estricto).
- **Nuevas dependencias de runtime** — solo HTML / CSS / JS vanilla.
- **Entrada táctil / tap** — Teclatlon es solo teclado físico. Ver
  `doc/es/SPEC.md`.
- **Añadir analítica / telemetría / llamadas a terceros.**
- **Datos personales** de cualquier tipo.
- **Una SPA, un router o un paso de build.**

---

## 📞 Comunicación

- **Issues** → canal principal para propuestas, bugs, preguntas.
- **Revisiones de Pull Request** → para revisar cambios concretos.

---

## 📜 Código de conducta

Este proyecto sigue [`CODE_OF_CONDUCT.es.md`](CODE_OF_CONDUCT.es.md).
Participar implica aceptarlo.

---

## 🙏 Gracias

Gracias por dedicar tiempo a una herramienta que ayuda a las personas
a aprender a escribir en el teclado físico, dedo a dedo.
