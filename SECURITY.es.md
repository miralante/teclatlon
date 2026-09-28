# Política de seguridad

Teclatlon es un sitio estático completamente del lado del cliente:
no tiene servidor propio, ni backend, ni base de datos, ni telemetría,
ni llamadas de runtime a terceros, ni cuentas. La superficie de ataque
es esencialmente la del navegador sobre el mismo origen (las cabeceras
de seguridad HTTP en `_headers` están escritas para que
siga siendo así — CSP bloqueada a `'self'`, sin scripts inline, sin
`connect-src` a terceros).



## Versiones soportadas

Solo la rama `main` recibe parches de seguridad. No
mantenemos versiones antiguas.

La regla del bump de caché (ver `CLAUDE.md` §B.1) es lo que hace que
"soportada" signifique algo: un bump de `VERSION` en `sw.js` es el
único mecanismo que fuerza a las PWAs instaladas a recoger el nuevo
código. Damos soporte **solo a la última `VERSION` desplegada**; las
versiones anteriores no se parchean.

## Cómo reportar una vulnerabilidad

Abre un aviso privado a través de
[GitHub Security Advisories](https://github.com/miralante/teclatlon/security/advisories/new).

Por favor, incluye:

- Descripción breve y pasos para reproducir.
- Impacto observado o esperado.
- SHA de commit o etiqueta afectada.

Si no puedes usar Security Advisories, abre un issue etiquetándolo
claramente como **security** y añade el prefijo `[SEC]` al título.
**No subas pruebas de concepto explotables** a un issue público:
espera a que un maintainer coordine.

Si ninguno de los canales es adecuado, escribe a `hello@apptonomia.uk`.

## Qué esperar

- Acuse de recibo en 5 días laborables.
- Primera evaluación (reproducción, severidad, plan) en 15 días
  laborables.
- Si se confirma, un parche o mitigación en cuanto sea viable.

## Divulgación coordinada

Preferimos coordinar la divulgación si la corrección requiere cambios
visibles en la UI o en el shell de la PWA.

## Fuera de alcance

- Vulnerabilidades en el navegador de la persona usuaria (enviamos
  HTML/CSS/JS plano; reportar al vendor del navegador).
- Vulnerabilidades en el runtime de Workers de Cloudflare (reportar
  a Cloudflare).
- Auto-XSS (una persona pegando código malicioso en su propia
  consola del navegador).

## Ver también

- [`CLOUDFLARE.md`](CLOUDFLARE.md) — el runbook de despliegue.
- [`_headers`](_headers) — las cabeceras HTTP de seguridad en
  vigor.
- `CLAUDE.md` §B — las políticas transversales de la suite (sin
  telemetría, WCAG AAA, lenguaje público).
