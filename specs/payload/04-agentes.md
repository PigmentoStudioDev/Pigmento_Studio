# Roles agenticos: orquestador, agentes y tools

Como se ejecuta este programa con agentes sin que se pisen ni se salgan del alcance.

Principio: **el orquestador no escribe codigo y los agentes no deciden alcance.** Un
agente que se encuentra con una decision que no esta escrita en `02-sesiones.md` para y
la devuelve. No la resuelve "con buen criterio": el buen criterio de cuatro agentes
distintos son cuatro arquitecturas distintas.

---

## 1. El orquestador

Es **la sesion principal**, no un subagente. Un orquestador delegado pierde el hilo
entre sesiones y vuelve a leer el repo entero cada vez.

### Lo que hace

1. Lee `README.md` (la tabla de estado) y decide **una** sesion. Una, no dos.
2. Comprueba las precondiciones de esa sesion. Si pide aprobacion (S2, S3, S7), **para
   y pregunta a Karen**. No la pide "por si acaso" mas adelante: la pide antes.
3. Reparte la sesion entre los agentes de §2, en el orden de §3.
4. Recibe los informes, **verifica los gates el mismo** (`./scripts/gates.sh`) y no se
   fia del "verde" que le reporte nadie.
5. Escribe `handoff/S<n>.md`, actualiza la tabla de `README.md` y **para**.

### Lo que no hace

- No escribe ni edita codigo de produccion. Solo `handoff/` y `README.md`.
- No corre git. Ni commit, ni push, ni nada.
- No arranca la sesion siguiente. Cerrar una sesion es el final del turno.
- No lanza mas de tres agentes a la vez sobre los mismos archivos.

### Cuando un gate se pone rojo

En orden, y sin saltarse pasos:

1. **Leer el mensaje.** Los gates de este repo dicen que regla y por que.
2. **Es un bug propio** -> vuelve al agente que lo introdujo, con el mensaje.
3. **Es una regla que ya no describe el sistema** -> se cambia `conformance/*.json`,
   **en su propio diff**, con el motivo escrito. Se ve en la revision.
4. **No es ninguna de las dos** -> para y pregunta a Karen.

**Nunca**: subir un limite de budget, anadir una entrada a `baseline`, ni eximir un
archivo para desbloquearse. El baseline de este repo esta vacio a proposito.

---

## 2. Los agentes

Cuatro nuevos, cuatro que ya existen en `~/.claude/agents/`. Los nuevos van en
`.claude/agents/` **del proyecto**, no en el global: son de este programa.

### 2.1 `payload-auditor` — read-only

```yaml
---
name: payload-auditor
description: Verifica afirmaciones sobre Payload contra la doc oficial y el registro de npm antes de que nadie escriba codigo. Read-only. Usar en S0 y cada vez que una sesion dependa de un comportamiento del framework que no este ya citado en 01-decisiones.md.
tools: Read, Grep, Glob, WebFetch, WebSearch, Bash
model: sonnet
---
```

**Contrato.** Devuelve, por pregunta: la respuesta, **la fuente** (URL de la doc o
salida del comando) y el veredicto contra lo que dice `01-decisiones.md`.

**Regla dura.** Una respuesta sin fuente no es una respuesta. Si la doc no lo dice,
el veredicto es "la doc no lo dice" y se escala — no se rellena con lo que el modelo
recuerde de su entrenamiento, que es exactamente como se cuela una API que ya no existe.

**Se lee el TAG, nunca `main`.** Es la leccion que S0 cobro: la primera version de
`01-decisiones.md` cito el template de `main` — que ya trae trabajo de la v4 — y dio por
bueno un `payload build` que en 3.88.0 no existe. Un repo en `main` no describe la
version que vas a instalar.

```
BIEN   raw.githubusercontent.com/payloadcms/payload/v3.88.0/templates/blank/package.json
MAL    raw.githubusercontent.com/payloadcms/payload/main/templates/blank/package.json
```

Y cuando se pueda, mejor que leer un archivo: **ejecutar el paquete de esa version**
(`pnpm dlx payload@3.88.0 --help`). Un comando que responde "Unknown command" cierra la
pregunta; un README, no.

**Los peers se comprueban resueltos, no leidos.** `payload` pide `graphql ^16.8.1` y el
`latest` de `graphql` es 17.x: leer el peer no basta, hay que mirar que instala de
verdad el gestor. La salida va al handoff con la version fijada que corresponda.

**Bash solo para lectura**: `npm view`, `curl` a raw.githubusercontent, `--help`.
Nunca instala.

### 2.2 `conformance-smith`

```yaml
---
name: conformance-smith
description: Escribe y verifica los gates de conformance de este repo. Cada gate se verifica EN ROJO reintroduciendo su bug y en verde al quitarlo, y la evidencia va en el informe. Usar para todo lo definido en 03-conformance.md.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---
```

**Contrato.** Por cada gate: la regla en el JSON, el codigo del runner si hace falta, y
**las dos ejecuciones** — la roja con el bug puesto y la verde con el bug quitado —
pegadas en el informe.

**Regla dura.** No cierra un gate cuyo rojo no consiguio reproducir. Lo devuelve
diciendo "no supe hacerlo fallar", que es un hallazgo sobre el gate, no sobre el.

**Ambito.** `conformance/*.json`, `scripts/*.mjs`, `scripts/gates.sh` y los tests de
contrato. **No toca `src/`** salvo para poner y quitar el bug de la verificacion, y lo
deja como estaba.

### 2.3 `payload-builder`

```yaml
---
name: payload-builder
description: Implementa las sesiones de 02-sesiones.md. Escribe payload.config, colecciones, el adaptador de cms/ y las rutas. Trabaja SOLO sobre los archivos que su sesion lista.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---
```

**Contrato.** Un diff que cubre el DoD de su sesion. Informa: archivos tocados, DoD
punto por punto con la evidencia, y lo que dejo sin hacer.

**Reglas duras.**
1. **La lista de archivos de su sesion es cerrada.** Un archivo de mas es una parada y
   una pregunta.
2. **No instala nada.** Ni una dependencia, ni un `pnpm dlx` que escriba en el repo. Las
   deps las aprueba Karen y las instala ella.
3. **No toca los archivos generados** de `app/(payload)/`. Los regenera con el CLI.
4. **Verifica que lo que importa existe antes de usarlo** — un export de Payload que el
   modelo recuerda pero el paquete no exporta compila hasta que no compila.
5. Comentarios de **por que**, nunca de que. Es la regla del repo.

### 2.4 `cms-adapter-reviewer` — read-only

```yaml
---
name: cms-adapter-reviewer
description: Revisa el adaptador de src/cms/ y solo eso. Busca fugas de campos internos, spreads, control de acceso omitido y tipos de Payload que se escapan al design system. Read-only.
tools: Read, Grep, Glob
model: sonnet
---
```

Existe porque `cms/` es donde se juntan las tres cosas que este programa puede romper:
datos privados, la frontera del design system y el control de acceso. Un revisor
generico lo mira como un mapeo mas.

**Lista de comprobacion, en este orden:**
1. `overrideAccess: false` en toda lectura. **Ningun** `...doc` ni `...rest`.
2. Ningun campo interno (`notes`, `accessToken`) en un tipo de vista.
3. Ningun `payload-types` importado fuera de `cms/`.
4. Ningun `any`, ningun `as` que apague el compilador en la frontera.
5. Dinero: enteros de centavos, total calculado y no guardado.
6. El adaptador devuelve **la forma que el organismo ya pide**, no una nueva.

### 2.5 Los que ya existen y se usan tal cual

| Agente | Cuando | No negociable |
| --- | --- | --- |
| `security-reviewer` | **S5, obligatorio.** Y S3 por las credenciales de R2 | S5 no cierra con un hallazgo critico o alto abierto |
| `tdd-guide` | S4 y S5: el test antes que el codigo | todo bug encontrado empieza por un test que falla |
| `code-reviewer` | al final de toda sesion con codigo | |
| `build-error-resolver` | cuando el build rompe y no es de alcance | diff minimo, nada de refactorizar de paso |

---

## 3. Orden por sesion

Secuencial salvo donde diga lo contrario. `->` es dependencia real.

```
S0   payload-auditor  ->  orquestador escribe el handoff
S1   conformance-smith  ->  code-reviewer
S2   [aprobacion de Karen]  ->  payload-builder  ->  conformance-smith  ->  code-reviewer
S3   [aprobacion de Karen]  ->  payload-builder  ->  || security-reviewer + conformance-smith ||
S4   tdd-guide  ->  payload-builder  ->  || cms-adapter-reviewer + conformance-smith ||  ->  code-reviewer
S5   tdd-guide  ->  payload-builder  ->  cms-adapter-reviewer  ->  security-reviewer  ->  conformance-smith
S6   payload-builder  ->  code-reviewer
S7   [aprobacion de Karen]  ->  orquestador, a mano
```

`|| ... ||` corre en paralelo: son lecturas independientes del mismo diff.

**En S5 la cadena es secuencial a proposito.** `cms-adapter-reviewer` va **antes** que
`security-reviewer`: el primero encuentra las fugas de forma (un spread, un campo de
mas) y el segundo revisa lo que quede. Al reves, el de seguridad gasta su atencion en
una fuga que un gate de forma habria cazado gratis.

---

## 4. Tools: quien puede que

| Agente | Read/Grep/Glob | Write/Edit | Bash | Web |
| --- | --- | --- | --- | --- |
| orquestador | si | solo `specs/payload/` | gates y lectura | no |
| `payload-auditor` | si | no | **solo lectura** | si |
| `conformance-smith` | si | `conformance/`, `scripts/`, tests | gates y tests | no |
| `payload-builder` | si | solo su lista de sesion | build, tests, CLI de payload | no |
| `cms-adapter-reviewer` | si | **no** | no | no |
| `security-reviewer` | si | **no** | lectura | no |
| `code-reviewer` | si | **no** | lectura | no |

### Bash: prohibido para todos, sin excepcion

```
git commit | git push | git merge | git rebase | git reset      nunca
pnpm add | pnpm remove | pnpm up | npm i                        solo Karen
vercel deploy | vercel --prod                                   solo Karen (S7)
payload migrate:fresh | migrate:reset | migrate:down            nunca sin preguntar
rm -rf                                                          nunca
```

`migrate:fresh` **borra la base**. Que este a un flag de distancia de `migrate` es
justo el motivo de que aparezca en esta lista con su nombre.

### Bash: permitido

`pnpm build` · `pnpm test` · `pnpm lint` · `pnpm conformance [seccion]` ·
`./scripts/gates.sh` · `pnpm payload generate:types` · `generate:importmap` ·
`migrate:create` · `migrate:status` · `npm view` · `curl` de lectura

---

## 5. Handoff

Un archivo por sesion en `specs/payload/handoff/S<n>.md`. Es lo unico que la sesion
siguiente puede dar por cierto: **si no esta escrito, no paso**.

```markdown
# S<n> — <titulo>
Fecha: YYYY-MM-DD · Agentes: <lista>

## DoD
- [x] punto 1 — <la evidencia: salida del comando, no "verificado">
- [ ] punto 2 — <por que no, y que hace falta>

## Archivos tocados
<lista, y por que cada uno estaba en el alcance>

## Gates
./scripts/gates.sh: <verde | rojo, con el mensaje>
Gates nuevos: <nombre — rojo reproducido: si/no — evidencia>

## Decisiones tomadas dentro del alcance
<las que 02-sesiones.md dejaba abiertas, con su motivo>

## Lo que se devuelve a Karen
<preguntas, aprobaciones pendientes, hallazgos fuera de alcance>
```

---

## 6. Las cinco paradas

Un agente **para y devuelve el turno**, sin intentar arreglarlo, cuando:

1. Necesita **instalar, desinstalar o subir** una dependencia.
2. Necesita tocar `package.json`, `tsconfig.json`, `.npmrc`, `pnpm-workspace.yaml` o
   `.env` fuera de lo que su sesion lista literalmente.
3. Un gate esta rojo y la causa **no** es su propio diff.
4. La spec no cubre la decision, o la cubre de dos maneras que se contradicen.
5. Cualquier cosa que salga de este repo: git, deploy, la base de produccion, un correo.

Las cinco tienen la misma forma: **el coste de preguntar es un turno, el de suponer es
una sesion entera desandada** — o, en S5 y S7, algo que ya no se desanda.
