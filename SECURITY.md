# Política de seguridad

Teclatlon es un sitio estático completamente del lado del cliente:
no hay servidor, ni backend, ni base de datos, ni telemetría. La
superficie de ataque es esencialmente la del navegador sobre el
mismo origen.

## Versiones soportadas

Solo la rama `master` recibe parches de seguridad. No mantenemos
versiones antiguas.

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

## Qué esperar

- Acuse de recibo en 5 días laborables.
- Primera evaluación (reproducción, severidad, plan) en 15 días
  laborables.
- Si se confirma, un parche o mitigación en cuanto sea viable.

## Divulgación coordinada

Preferimos coordinar la divulgación si la corrección requiere
cambios visibles en la UI o en el shell de la PWA.
