# Programa Payload — Pigmento Studio

Spec ejecutable para conectar Payload CMS a este repo y modelar dos colecciones:
**portfolio** (publica) y **propuestas comerciales** (privada).

Escrito para que lo ejecuten agentes. Cada sesion es un diff, con criterio de
aceptacion medible por `./scripts/gates.sh`. Quien implementa no decide: decide
este documento, y lo que no este escrito aqui se pregunta a Karen.

## Los cuatro archivos

| Archivo | Que contiene | Para quien |
| --- | --- | --- |
| `01-decisiones.md` | Arquitectura y auditoria contra la doc oficial. Version por version, con la fuente. | Todos, antes de tocar nada |
| `02-sesiones.md` | S0-S7: objetivo, archivos, API, restricciones y DoD de cada una | El agente que implementa |
| `03-conformance.md` | Los gates nuevos y los tests de build. Definidos hasta el assert. | El agente que vigila |
| `04-agentes.md` | Orquestador, agentes, tools y protocolo de handoff | Quien arranca el programa |

## Estado

| Sesion | Que | Estado |
| --- | --- | --- |
| S0 | Auditoria de entorno (sin codigo) | cerrada — 2026-09-09 · handoff/S0.md |
| S1 | Budget de CSS antes que Payload | cerrada — 2026-09-09 · handoff/S1.md · `/ds` excluido, techos 178/17 y 771/227 |
| S2 | Instalacion y arranque de Payload | cerrada — 2026-09-09 · handoff/S2.md · 5 gates, panel en /admin |
| S3 | Users + Media sobre R2 | cerrada — 2026-09-10 · handoff/S3.md · upload real verificado en R2 |
| S4 | Coleccion `projects` (portfolio) | cerrada — 2026-09-10 · handoff/S4.md · frontera cms/ activa |
| S5 | Coleccion `proposals` (privada) | cerrada — 2026-09-10 · handoff/S5.md · 404/403 verificados con curl |
| S6 | Globals de navegacion y pie | pendiente — opcional |
| S7 | Migraciones de produccion y deploy | pendiente — **bloqueada por aprobacion de deploy** |
| S8a | Propuesta comparativa: schema y adaptador | spec escrito 2026-09-10 · sin firmar |
| S8b | Propuesta comparativa: los siete organismos | spec escrito 2026-09-10 · sin firmar |

Un agente que cierra una sesion actualiza esta tabla y escribe
`specs/payload/handoff/S<n>.md`. No hay otro sitio donde viva el estado.

## Reglas del programa

1. **Una sesion, un diff.** Nada de adelantar trabajo de la siguiente porque
   "ya que estoy". El orden existe porque S1 destraba S2 y S2 destraba el resto.
2. **`./scripts/gates.sh` verde antes de cerrar.** Los cuatro gates de siempre mas
   el quinto que trae S1. Un gate rojo no se exime: se arregla o se para.
3. **Un gate nuevo se verifica EN ROJO** reintroduciendo su bug, y en verde al
   quitarlo. Es la regla de la casa (CLAUDE.md > Como se verifica) y aqui no cambia.
4. **Tres cosas necesitan aprobacion explicita de Karen antes de ejecutarse**, por
   su CLAUDE.md global: instalar dependencias (S2), tocar `tsconfig.json` /
   `package.json` (S2) y desplegar (S7). El agente para y pregunta.
5. **Nunca git.** Ni commit, ni push, ni merge, ni reset. El agente deja el arbol
   sucio y lo dice.
6. **Los archivos generados por Payload no se editan.** Llevan una cabecera que lo
   dice; el gate `generated-untouched` lo vigila.
