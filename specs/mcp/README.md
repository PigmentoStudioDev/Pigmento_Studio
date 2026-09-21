# Programa MCP — Pigmento Studio

Spec ejecutable para exponer el CMS de este repo por Model Context Protocol: que Claude
Code (o cualquier cliente MCP) pueda poblar y mantener el CMS entero — CRUD completo
sobre las colecciones y subida de assets a R2 — sin pasar por el panel.

Es el equivalente en Pigmento del conector Knowledge de Atom (`atom-mcp/apps/knowledge`),
pero **no es una copia**: aquel es un servidor aparte, multi-usuario, con OAuth de Clerk,
lecturas por Supabase y escrituras HMAC a endpoints custom. Aquí el CMS vive dentro del
mismo Next, hay una sola persona y Payload ya publica un plugin MCP oficial en la misma
versión pinneada del repo. Lo que se replica de Knowledge es lo que aporta valor encima
del CRUD: descripciones que enseñan a escribir bien, resources con el criterio de
contenido, instrucciones de servidor, tests por el cable y un oráculo contra el servidor
vivo. `01-decisiones.md` §1 argumenta el porqué.

Escrito para que lo ejecuten agentes, con las mismas reglas que `specs/payload/README.md`:
cada sesión es un diff con DoD medible por `./scripts/gates.sh`; lo que no esté escrito
aquí se pregunta a Karen.

## Los archivos

| Archivo | Qué contiene |
| --- | --- |
| `01-decisiones.md` | Arquitectura: plugin oficial vs réplica, superficie expuesta, auth, subida, gates |
| `02-sesiones.md` | M0-M3: objetivo, archivos, API, restricciones y DoD de cada una |
| `handoff/M<n>.md` | Lo que pasó de verdad en cada sesión. Formato en `specs/payload/04-agentes.md` §5 |

## Estado

| Sesión | Qué | Estado |
| --- | --- | --- |
| M0 | Aprobación e instalación | cerrada — 2026-09-20 · handoff/M0.md · plugin 3.88.0 + zod 3.25.76 |
| M1 | Plugin, API keys, migración, deltas de conformance | cerrada — 2026-09-20 · handoff/M1.md · 12 tools por el cable, 401 sin bearer, 3 gates en rojo |
| M2 | Subida de assets, resources, instrucciones, oráculo | cerrada — 2026-09-20 · handoff/M2.md · PNG a R2 y borrado, oráculo verde |
| M3 | Conexión desde Claude Code, docs y handoff | cerrada — 2026-09-20 · handoff/M3.md · sesión interactiva pendiente de Karen |

## Reglas del programa

Las seis de `specs/payload/README.md` aplican tal cual. Dos más, propias de esta pieza:

7. **El MCP no relaja ni una regla de acceso de Payload.** Cada llamada corre como el
   usuario dueño de la API key con `overrideAccess: false`. Si una colección no deja
   hacer algo desde el panel, tampoco lo deja desde el MCP. El gate `mcp-respeta-acceso`
   lo vigila.
8. **Las tools experimentales del plugin quedan fuera.** Escriben archivos de colección
   y editan `payload.config.ts` en disco; en Vercel no tienen sentido y en local son un
   agente reescribiendo el repo por un canal sin diff. El gate `mcp-sin-experimental` lo
   vigila.
