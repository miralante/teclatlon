# Teclatlon

> 🌐 **Otros idiomas:** [English](README.md)

Una aplicación web gratuita, estática y sin dependencias para aprender a
escribir con el **teclado del ordenador**. Enseña a colocar los dedos,
lecciones letra a letra, práctica de palabras, teclado numérico y
escritura libre — con un teclado en pantalla decorativo que refleja el
teclado físico. Sin cuentas, sin cookies, sin analítica: todo se ejecuta
en el navegador y el progreso solo se guarda en `localStorage`, en tu
propio dispositivo.

- 💻 **Ejecutar en local**: abre `index.html` directamente en un
  navegador, o sirve la carpeta con cualquier servidor estático
  (`npx serve .` / `python -m http.server 8080`) para la experiencia PWA
  completa, con soporte sin conexión.

---

## 📚 Documentación

| Tema | Documento |
|---|---|
| Producto, audiencia, reglas de accesibilidad | [`doc/es/SPEC.md`](doc/es/SPEC.md) · [`doc/en/SPEC.md`](doc/en/SPEC.md) |
| Arquitectura y referencia técnica | [`doc/es/tecnico.md`](doc/es/tecnico.md) · [`doc/en/technical.md`](doc/en/technical.md) |
| Flujo operativo para agentes de IA | [`CLAUDE.md`](CLAUDE.md) |

El historial del proyecto vive en `git log`; no se mantiene una hoja de
ruta externa.

---

## ✅ Validar

```bash
node scripts/check.js
```

No hace falta `npm install` — el script solo usa la librería estándar de Node.

---

## 📄 Licencia

MIT — ver [`LICENSE`](LICENSE).
