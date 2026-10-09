# Reference Brief: Home de un estudio de diseño — secciones, texto e imagen

Slug: home-de-estudio-de-diseno | Nivel: standard | Fecha: 2026-10-09 | Estado: ESCALADO
Versiones: next=16.3.5, react=19.2.8, payload=3.88.0
Verificador: research-verifier 2026-10-09 ESCALATE

## 1. Pregunta y decisiones abiertas

Como arma su home un estudio de branding que vive de que le escriban, y que hacer con las secciones 5 a 14 de la home de Pigmento, que hoy suman 9.6 pantallas, 1319 palabras y siete de nueve secciones sin una sola imagen.

Las dos direcciones sobre la mesa:

- **A. Recortar** — quitar secciones y palabras; la pagina baja de 13 pantallas.
- **B. Ilustrar con trabajo** — los proyectos vuelven a aparecer abajo y las secciones que argumentan lo hacen con imagenes de casos en vez de prosa.

Decisiones que el brief tiene que cerrar:

1. Que secciones lleva una home de estudio y en que orden.
2. Cuanto texto soporta antes de leerse como documento, y donde vive el resto.
3. Cada cuanto vuelve el trabajo en el scroll y en que formatos distintos.
4. Con que sustituyen los estudios reconocidos la prosa de proceso, valores, diferenciadores y FAQ.
5. Si hay criterio documentado a favor o en contra de "nuestros valores", "nuestro proceso" y "FAQ" en una home de estudio.
6. Si hay evidencia sobre longitud de pagina y profundidad de scroll aplicable a esto.

**Respuesta corta: la sostiene B, y A no.** El motivo de A —"es muy larga"— no se sostiene: la home de referencia mas reconocida del conjunto medido es mucho mas larga que trece pantallas. Lo que si se sostiene es cortar tres bloques concretos, y no por longitud sino porque ninguno existe en la home de ningun estudio del conjunto y porque hay guia documentada que los manda a su propia pagina. El detalle esta en la seccion 5.

## 2. Estado actual

### La pila de la home

- La home mantiene catorce bloques y el propio proyecto ya registra que llego a trece leyendose como una sola superficie [repo:CLAUDE.md:161]
- El ritmo vertical, el ancho y la zona de tema los pone `layout/Section`, no el organismo, asi que mover o quitar un bloque no cambia el hueco de los vecinos [repo:CLAUDE.md:140]
- La pila alterna por tres capas de superficie y pide una banda cada dos o tres secciones, no una por pagina [repo:CLAUDE.md:160]
- La banda de imagen no lleva nada que leer y eso ES el componente: un titular o una cifra encima la dejan sin trabajo [repo:CLAUDE.md:165]
- Cada seccion de la home tiene su modulo de contenido en `app/`, uno por bloque: valores [repo:src/app/values.ts:13], proceso [repo:src/app/process.ts:17], comparativa [repo:src/app/difference.ts:19], cifras [repo:src/app/figures.ts:15], servicios [repo:src/app/services.ts:15], testimonios [repo:src/app/testimonials.ts:20], equipo [repo:src/app/team.ts:22], FAQ [repo:src/app/faq.ts:17] y llamada final [repo:src/app/cta.ts:10]

### El texto, contado sobre el catalogo

- El catalogo español de la home suma 964 palabras de copy fuente bajo la clave `home` [repo:src/i18n/messages/es.json:65]
- El reparto: FAQ 240, proceso 156, comparativa 116, valores 111, cifras 77, testimonios 70, equipo 69, servicios 41, trabajo 38, manifiesto 27, llamada final 19 [repo:src/i18n/messages/es.json:65]
- Contado sobre esa misma clave, las tres secciones que argumentan en prosa —FAQ 240, proceso 156 y comparativa 116— son 512 de las 964 palabras, el 53% del texto de la home [repo:src/i18n/messages/es.json:65]
- Las 521 palabras que se midieron en valores no son copy: son 111 palabras repetidas cinco veces, porque la corona renderiza `RADIAL_COPIES = 5` copias de cada tarjeta [repo:src/design-system/motion/useRadialSlider.ts:27]
- Cuatro de esas cinco copias estan fuera del arbol de accesibilidad, asi que un lector de pantalla oye cada valor una vez y lo que se quintuplica es el texto EN PANTALLA [repo:src/design-system/components/organisms/ValueCards/ValueCards.test.tsx:62]
- El `h2` de valores es `visually-hidden`, asi que la seccion mas pesada en texto de la pagina no tiene titular visible [repo:src/design-system/components/organisms/ValueCards/ValueCards.module.scss:32]

### Las imagenes que ya existen y no se ven

- Servicios ya recibe una imagen del portafolio por fila, no es una seccion sin material [repo:src/app/services.ts:16]
- Esa imagen vive en un contenedor con `visibility: hidden` [repo:src/design-system/components/organisms/Services/Services.module.scss:94] que solo se enciende con `[data-preview-on]` [repo:src/design-system/components/organisms/Services/Services.module.scss:97]
- El grupo de medias de servicios es `aria-hidden`, es decoracion de hover y no contenido [repo:src/design-system/components/organisms/Services/Services.tsx:83]
- El repo trae catorce PNG de portafolio servidos desde `public/` y referenciados por indice [repo:src/app/work.ts:34]
- El strip de trabajo pinta dos filas de 14 y 10 piezas, 24 en total, repitiendo la coleccion cuando no alcanza [repo:src/app/work.ts:40]
- Ninguno de los organismos que argumentan acepta imagen: `ProcessPhase` es titulo, texto y entregable [repo:src/design-system/components/organisms/Process/Process.tsx:28], `Testimonial` es cita, autor, rol y empresa [repo:src/design-system/components/organisms/Testimonials/Testimonials.tsx:28] y `FaqItem` es pregunta y respuesta [repo:src/design-system/components/organisms/Faq/Faq.tsx:32]

### El contenido real detras de los bloques

- Las piezas destacadas se filtran por `featured: { equals: true }` contra el CMS [repo:src/cms/projects.ts:52]
- El modulo del strip declara que los marcadores son el respaldo de la base de desarrollo y que con un solo proyecto publicado se repite ese, no se inventa otro [repo:src/app/work.ts:11]
- Los clientes de los marcadores son marcadores a proposito, porque un cliente inventado en la pagina de un estudio no se arregla despues [repo:src/app/work.ts:12]
- La pagina de cada caso todavia no existe: todas las piezas apuntan a `/trabajo`, que es un `TODO(rutas)` [repo:src/app/work.ts:57]
- Las cuatro cifras de la seccion de cifras son PLACEHOLDER y las tiene que confirmar Pigmento [repo:src/app/figures.ts:6]
- El copy de los valores tambien es borrador pendiente de Pigmento [repo:src/app/values.ts:6]

### El veredicto que abre este brief

- "el sitio no es llamativo, faltan imagenes, muchisimo texto y carga cognitiva, parece un pdf. hay un descanso visual muy lindo en el trabajo destacado, pero hacia abajo pierde toda mi atencion, parece documento" [KAREN:chat 2026-10-09]

### El estandar propio del vault

- El orden canonico de una landing en el vault es navbar, hero, logos, features, stats, testimonios, pricing y comparacion, FAQ, CTA, footer, con equipo y galeria como variantes de contenido [KAREN:vault Knowledge/Frontend/Estilo/notas/Secciones/composicion-de-paginas.md]
- La alternancia de superficies del vault es por capas —base, secundaria, oscura o imagen con overlay— con una banda secundaria cada dos o tres secciones [KAREN:vault Knowledge/Frontend/Estilo/notas/Secciones/composicion-de-paginas.md]
- El vault lista 32 familias de seccion y ninguna es "valores" ni "proceso" [KAREN:vault Knowledge/Frontend/Estilo/_Mapa/Secciones.md]
- La familia `galeria` del vault dice que la galeria informa por la imagen, no por el texto, y que no vale como relleno visual sin alt ni proposito [KAREN:vault Knowledge/Frontend/Estilo/notas/Secciones/galeria.md]
- La familia `stats` del vault dice que no se inventan numeros y que si no hay cifras verificables se salta la seccion [KAREN:vault Knowledge/Frontend/Estilo/notas/Secciones/stats.md]
- La familia `faq` del vault pide de 5 a 10 preguntas reales ordenadas por frecuencia, y su proposito declarado es quitar dudas finales SIN alargar la pagina [KAREN:vault Knowledge/Frontend/Estilo/notas/Secciones/faq.md]
- La familia `comparacion` del vault es una matriz de planes o productos por columna, no una tabla de "nosotros frente a los demas": esa no existe como familia en el vault [KAREN:vault Knowledge/Frontend/Estilo/notas/Secciones/comparacion.md]
- La familia `testimonios` del vault pide citas reales y autorizadas y prohibe fabricar nombres o logos [KAREN:vault Knowledge/Frontend/Estilo/notas/Secciones/testimonios.md]

Contextos: la app servida por Next (donde el CMS decide cuantas piezas hay), la base sqlite de desarrollo del repo (un solo proyecto, asi que el strip repite esa pieza), el CMS de produccion (donde viven los 18 proyectos segun la peticion, no comprobado aqui), vitest con jsdom (contrato de organismos, con CSS resuelto solo por `classNameStrategy: non-scoped`), la ruta `/ds` del preview del design system (exenta de i18n) y el admin de Payload.

## 3. Fuentes primarias

- El 74% del tiempo de visualizacion se gasta en las dos primeras pantallas y el 81% en las tres primeras; el 57% por encima del pliegue [doc:https://www.nngroup.com/articles/scrolling-and-attention/@2018-04-15]
- La segunda pantalla recibe un 17% del tiempo y el 26% restante se reparte en una cola larga, sin cifra propia por pantalla [doc:https://www.nngroup.com/articles/scrolling-and-attention/@2018-04-15]
- En una visita media la gente lee como mucho el 28% de las palabras de una pagina, y el 20% es mas probable [doc:https://www.nngroup.com/articles/how-little-do-users-read/@2008-05-05]
- Cada 100 palabras adicionales en una pagina compran 4.4 segundos mas de visita, sobre un fijo de unos 25 segundos [doc:https://www.nngroup.com/articles/how-little-do-users-read/@2008-05-05]
- El tercero de los cinco principios de home de NN/g es "Reveal Content Through Examples", y su regla es "Provide specific examples of your site's content" [doc:https://www.nngroup.com/articles/homepage-design-principles/@2024-03-15]
- "Thoughtfully curated content examples are more effective in communicating your value than broad, umbrella terms" [doc:https://www.nngroup.com/articles/homepage-design-principles/@2024-03-15]
- La misma guia pide colocar el contenido mas importante arriba y advierte contra los suelos falsos, "especially with the growing popularity of image-based design" [doc:https://www.nngroup.com/articles/homepage-design-principles/@2024-03-15]
- Un ejemplo marcado como fallo en esa guia es una home de cuatro enlaces con imagen a categorias genericas, que "would work better with sample content from each category" [doc:https://www.nngroup.com/articles/homepage-design-principles/@2024-03-15]
- La guia clasica de home de Nielsen, directriz 3: "Group all corporate information in one distinct area", y añade que una seccion "About" es la mejor manera de enlazar a informacion mas a fondo [doc:https://www.nngroup.com/articles/top-ten-guidelines-for-homepage-usability/@2002-05-11]
- La directriz 1 de la misma guia pide un tagline que resuma que hace el estudio, sobre todo si es nuevo o poco famoso [doc:https://www.nngroup.com/articles/top-ten-guidelines-for-homepage-usability/@2002-05-11]
- Esa guia no tiene ninguna directriz sobre longitud total de la home; su directriz 8 solo pide una lista corta de novedades [doc:https://www.nngroup.com/articles/top-ten-guidelines-for-homepage-usability/@2002-05-11]
- Para bajar la carga cognitiva, NN/g pide quitar elementos innecesarios porque "redundant links, irrelevant images, and meaningless typography flourishes slow users down" [doc:https://www.nngroup.com/articles/minimize-cognitive-load/@2013-12-22]
- La misma pieza pide descargar trabajo del lector: donde el diseño le pide leer, recordar o decidir, enseñar una imagen en su lugar [doc:https://www.nngroup.com/articles/minimize-cognitive-load/@2013-12-22]
- Las visuales que cargan informacion van arriba, y las que solo sostienen la marca sin aportar informacion van por debajo del pliegue [doc:https://www.nngroup.com/articles/picture-superiority-effect/@2024-04-26]
- La misma pieza advierte que el efecto de superioridad de la imagen se usa mal para justificar sustituir texto por imagenes, y que la etiqueta de texto añade redundancia que refuerza la comprension [doc:https://www.nngroup.com/articles/picture-superiority-effect/@2024-04-26]
- En el estudio de Baymard, el 70% de los usuarios recorrio arriba y abajo casi toda la home movil escaneandola al llegar por primera vez al sitio [doc:https://baymard.com/mcommerce-usability/benchmark/mobile-page-types/homepage@2026-10-09]
- La guia de FAQ de NN/g (94 directrices) existe como diseño de una SECCION de FAQ, no como bloque de home [doc:https://www.nngroup.com/reports/strategic-design-faqs/@2015]

## 4. Implementaciones de referencia

### Ocho homes leidas el 2026-10-09, medidas con las mismas preguntas que Pigmento (el trabajo se cuenta por bloques en el scroll, no por piezas)

| Estudio | Bloques | Trabajo: veces y formatos | Valores | Proceso | FAQ | Prosa de argumento | Fuente |
|---|---|---|---|---|---|---|---|
| Pentagram | 23 o mas, truncado | ~15 veces: carrusel heroe, rejillas de 8 por disciplina, sets de enlaces de texto, archivos por año | no | no | no | ensayos editoriales de 55-100 palabras, cada uno atado a 8-28 proyectos | [doc:https://www.pentagram.com/@2026-10-09] |
| COLLINS | 8 | 2 veces: rejilla de 9 casos y 4 historias | no | no | no | ninguna; ningun parrafo pasa de 30 palabras | [doc:https://www.wearecollins.com/@2026-10-09] |
| AREA 17 | 10 visibles | 1 vez: 5 tarjetas de novedades, 3 de ellas casos; mas tira de clientes y muro de ~70 logos | no | no | no | ninguna; el parrafo mas largo es el titular de 17 palabras | [doc:https://area17.com/@2026-10-09] |
| Koto | 9 | 2 veces: cinco resumenes de caso en prosa larga y rejilla de 5 tarjetas de los mismos cinco | no | no | no | ~380 palabras, TODAS dentro de un caso con nombre e imagen | [doc:https://koto.com/@2026-10-09] |
| PORTO ROCHA | 5 bloques, cientos de piezas | 2 veces: indice de 54 filas con miniatura y linea, y rejilla de ~48 miniaturas sin texto | no | no | no | una sola frase de estudio en el panel de "about" | [doc:https://portorocha.com/@2026-10-09] |
| Gretel | 6 (el brief conto 8) | 1 bloque con 5 piezas —un destacado con rotulo y cuatro tarjetas—, no 5 vueltas: el metodo de esta tabla cuenta bloques en el scroll | no | no | no | ninguna; el intro es de 17 palabras | [doc:https://gretelny.com/@2026-10-09] |
| Bielke&Yang | 14 | 3 veces: rejilla de 12 casos, 4 teasers por sector y feed de novedades | no | no | no | ninguna; frases de capacidad de 13-15 palabras | [doc:https://bielkeyang.com/@2026-10-09] |
| Instrument | 15 | 1 vez: carrusel de 6 imagenes sin rotulo, mas lista de 22 clientes y reconocimientos | SI, "Our Purpose", ~75 palabras | no | no | ~130 palabras entre proposito y dos declaraciones de servicios | [doc:https://www.instrument.com/@2026-10-09] |

### Lo que sale de la tabla

- Cero de ocho homes tienen FAQ [doc:https://www.pentagram.com/@2026-10-09]
- Cero de ocho tienen una seccion de proceso o "como trabajamos" [doc:https://koto.com/@2026-10-09]
- Cero de ocho tienen una tabla comparativa de "nosotros frente a los demas" [doc:https://www.wearecollins.com/@2026-10-09]
- Una de ocho tiene seccion de valores, y pesa 75 palabras [doc:https://www.instrument.com/@2026-10-09]
- Ocho de ocho hacen volver el trabajo al menos una vez despues del heroe, y seis de ocho dos veces o mas [doc:https://gretelny.com/@2026-10-09]
- Varias resuelven "servicios" en pocas palabras con enlace a su pagina, y son mas de dos: ademas de las dos de abajo, Bielke&Yang lleva teasers de servicio, AREA 17 "Industries we serve" y Pentagram listas de disciplinas. Las dos medidas al detalle: "Programs" en COLLINS [doc:https://www.wearecollins.com/@2026-10-09] y el intro de ofertas en Instrument [doc:https://www.instrument.com/@2026-10-09]
- La longitud no es el eje: Pentagram tiene mas de veintitres bloques y Gretel ocho, y las dos son referencia [doc:https://www.pentagram.com/@2026-10-09]
- Lo que SI comparten las ocho es que casi todo bloque bajo el pliegue lleva imagen: en Bielke&Yang 8 de 14 secciones traen imagen, y las que no son tagline, filtro o pie [doc:https://bielkeyang.com/@2026-10-09]
- Koto demuestra que el problema no es el numero de palabras: lleva mas prosa que proceso y comparativa de Pigmento juntos, y cada palabra cuelga de un proyecto con su imagen [doc:https://koto.com/@2026-10-09]
- Tres formatos distintos de trabajo conviven en una sola pagina sin leerse como repeticion: destacado con rotulo, tarjeta con titulo y linea, y pieza sin rotulo [doc:https://gretelny.com/@2026-10-09]
- El equipo con cara y contacto directo si aparece en una home de estudio pequeño: tres personas con foto, rol, correo y telefono [doc:https://bielkeyang.com/@2026-10-09]
- Las cifras como prueba aparecen en forma de premios y clientes, no de numeros del estudio: tira de "8x Agency of the Year" [doc:https://www.wearecollins.com/@2026-10-09] y bloque "Recent Recognition" [doc:https://www.instrument.com/@2026-10-09]

## 5. Opciones

| Opcion | Pros | Contras | Complejidad | Recomendacion |
|---|---|---|---|---|
| A. Recortar por longitud | baja el tiempo de lectura; menos copy que Pigmento tiene que confirmar | el conjunto de referencia es MAS largo, no mas corto; recortar sin devolver imagen deja un documento corto en vez de uno largo; no ataca lo que Karen nombro ("faltan imagenes") | baja | no |
| B. Ilustrar con trabajo | es lo que hacen 4 de 4 de las medibles; ataca la causa que Karen nombro; aprovecha material que ya esta en el repo | tres organismos no tienen prop de imagen y habria que tocarlos; las imagenes del portafolio tienen clientes marcadores | media | **si**, con el recorte acotado de la fila siguiente |
| C. B mas recorte de los tres bloques sin precedente | corta 512 de 964 palabras (53%) y sube el trabajo de 1 a 4-5 apariciones; cada corte tiene fuente, no gusto | FAQ, proceso y comparativa necesitan una pagina destino que hoy no existe; se desvia del orden canonico del vault | media | **esta es la recomendacion** |
| D. Dejarlo como esta y solo reescribir copy | cero riesgo tecnico | no cambia el ratio imagen/texto, que es lo medido y lo que Karen nombro; 1319 palabras reescritas siguen siendo 1319 palabras | baja | no |

### Lo que la recomendacion (C) dice en concreto, seccion por seccion

| # | Seccion | Que hacer | Por que |
|---|---|---|---|
| 5 | Cifras | se queda, pero los cuatro numeros se confirman o la seccion se cae | 0.5 pantallas y 77 palabras es la prueba mas barata por pixel; hoy son placeholders y el vault prohibe inventarlos |
| 6 | Servicios | la vista previa deja de ser solo hover: la imagen del caso esta presente en reposo, con alt | la imagen ya existe en el repo; hoy nadie que no pase el puntero ve ninguna |
| 7 | Banda de imagen | se queda donde esta | es la unica de las diez sin nada que procesar, y las de arriba y abajo abren con titular |
| 8 | Proceso | fuera de la home, a su propia pagina | 156 palabras, 0 imagenes; ausente en el HTML servido de las ocho referencias, medible en las cinco que sirven SSR completo |
| 9 | NUEVO bloque de trabajo | rejilla de casos con nombre: imagen, cliente y una linea | 4 de 4 medibles hacen volver el trabajo (Pentagram, COLLINS, AREA 17, Koto); el formato con rotulo es el de Koto, COLLINS, Gretel y Bielke&Yang |
| 10 | Valores | se queda como maximo en el tamaño de Instrument (un bloque, <=75 palabras) y con `h2` visible; o fuera | 1 de 8 lo tiene; sus 521 palabras medidas son 111 por cinco copias, asi que el arreglo es de render, no de copy |
| 11 | Comparativa | fuera de la home | ausente en el HTML servido de las ocho; el vault no tiene familia para "nosotros frente a los demas" |
| 12 | Testimonios | se queda, reducido a una cita grande pegada al caso que la sostiene | 2 de 8 llevan cita; Pentagram las usa como pull quote entre bloques de trabajo |
| 13 | Equipo | se queda | HIPOTESIS: en Bielke&Yang las tres fichas salen en el panel de contacto y en JSON-LD, no se confirmo que sean un bloque de la home; se queda por el formato de estudio pequeño y porque ya trae foto, no por precedente |
| 14 | NUEVO bloque de trabajo sin rotulo | tira o rejilla de piezas sin texto, antes de la llamada final | es el segundo formato de PORTO ROCHA y Gretel; cierra con imagen en vez de con tabla |
| 15 | FAQ | fuera de la home, a la pagina de servicios o a una propia | 240 palabras (la seccion mas pesada de la home) y ausente en el HTML servido de las ocho. NO hay guia que lo mande a otra pagina: la directriz de Nielsen habla de informacion corporativa y de About, no de FAQ, y la nota `faq` del vault dice lo contrario — que el FAQ quita dudas finales sin alargar la pagina. Es criterio, no consecuencia de la evidencia |
| 16 | Llamada final | se queda, ultima | 19 palabras; es el cierre en el conjunto de referencia |

Resultado esperado: de 10 secciones bajas con 2 con imagen a 10 con 6 con imagen, y de 1319 palabras a unas 600. La pagina NO baja mucho de pantallas, y eso es correcto segun el conjunto medido.

## 6. Evidencia en contra

- **El vault dice lo contrario de como se le cita, y eso es una contradiccion abierta.** `composicion-de-paginas` no acota su orden a una landing de producto: dice "usarlo en cualquier sitio de marketing, contenido o documentacion con 5 o mas bloques" [KAREN:vault Knowledge/Frontend/Estilo/notas/Secciones/composicion-de-paginas.md], y una home de estudio cae dentro. Y la nota `faq` declara que el FAQ existe para quitar dudas finales sin alargar la pagina [KAREN:vault Knowledge/Frontend/Estilo/notas/Secciones/faq.md], que es justo lo contrario de sacarlo por longitud. Se ACEPTA como desviacion consciente del estandar de la casa, y por tanto pide un ADR firmado por Karen; no se resuelve con las fuentes de este brief.
- **Las ocho homes son de estudios ya reconocidos, que no necesitan convertir por su home.** Pentagram, COLLINS o Instrument reciben encargos por reputacion [doc:https://www.pentagram.com/@2026-10-09]. Que ninguna lleve FAQ ni proceso no prueba que a un estudio que vive de que le escriban no le sirvan. Se ACEPTA: la parte del recorte es criterio apoyado en precedente, no consecuencia de la evidencia.
- **Un estudio reconocido si argumenta en prosa en su home.** Instrument tiene "Our Purpose" con sus cuatro valores escritos y dos declaraciones de servicios, ~130 palabras [doc:https://www.instrument.com/@2026-10-09]
- Se acepta, y por eso la recomendacion deja valores en la home con un techo: la evidencia dice "una de ocho y 75 palabras", no "cero" [doc:https://www.instrument.com/@2026-10-09]
- **La gente si hace scroll.** El 70% de los usuarios de Baymard recorrio casi toda la home movil al llegar, asi que la longitud no mata por si sola [doc:https://baymard.com/mcommerce-usability/benchmark/mobile-page-types/homepage@2026-10-09]
- Se resuelve: por eso la recomendacion no es A. Recorrer no es leer — el mismo conjunto de datos de NN/g dice que el 81% del TIEMPO se queda en tres pantallas [doc:https://www.nngroup.com/articles/scrolling-and-attention/@2018-04-15]
- **Para un servicio complejo, la cobertura a fondo gana.** NN/g dice que los sitios que venden respuestas muy dirigidas a problemas complicados deben centrarse en cobertura comprensiva, no en contenido corto y escaneable [doc:https://www.nngroup.com/articles/content-strategy-long-vs-short/@2007-11-11]
- Y añade que la mejor estrategia es la que imita la dieta mixta del lector: resumenes cortos enlazados a profundidad [doc:https://www.nngroup.com/articles/content-strategy-long-vs-short/@2007-11-11]
- Se resuelve: eso es exactamente el recorte propuesto. El proceso y el FAQ no se borran, se mudan; la home se queda con el resumen y el enlace [doc:https://www.nngroup.com/articles/top-ten-guidelines-for-homepage-usability/@2002-05-11]
- **Los FAQ si entregan valor.** NN/g defiende que, bien hechos, dan valor al visitante y a la organizacion, y que funcionan 24/7 [doc:https://www.nngroup.com/articles/faqs-deliver-value/@2014-12-21]
- Se resuelve: la defensa es del FAQ como contenido, nunca como bloque de home; el propio NN/g recomienda enlazar en vez de duplicar lo que ya esta mas completo en otro sitio [doc:https://www.nngroup.com/articles/faqs-deliver-value/@2014-12-21]
- **Sustituir texto por imagen es un error conocido.** NN/g advierte que el efecto de superioridad de la imagen se usa mal para justificar quitar texto, y que la etiqueta de texto añade redundancia util [doc:https://www.nngroup.com/articles/picture-superiority-effect/@2024-04-26]
- Se resuelve: el formato recomendado no es imagen sola, es imagen con cliente y una linea, que es el de Koto, COLLINS, Gretel y Bielke&Yang [doc:https://koto.com/@2026-10-09]
- **Hay un contraejemplo de pieza sin rotulo que si funciona.** PORTO ROCHA pone ~48 miniaturas sin texto alguno [doc:https://portorocha.com/@2026-10-09]
- Se acepta con su condicion: ese bloque va DESPUES de un indice de 54 filas donde cada pieza ya tenia titulo y linea, asi que el rotulo ya ocurrio [doc:https://portorocha.com/@2026-10-09]
- **El recorte se desvia del orden canonico del vault**, que incluye stats, testimonios, comparacion, FAQ y CTA en la pila de una landing [KAREN:vault Knowledge/Frontend/Estilo/notas/Secciones/composicion-de-paginas.md]
- NO se resuelve con fuentes, se ACEPTA como desviacion: la nota no se acota a una landing de producto — dice que se usa en cualquier sitio de marketing, contenido o documentacion con 5 o mas bloques, y una home de estudio cae dentro [KAREN:vault Knowledge/Frontend/Estilo/notas/Secciones/composicion-de-paginas.md]. Apartarse del estandar de la casa pide un ADR que firme Karen
- La home de un estudio no vende un plan: ocho de ocho referencias la resuelven como indice de trabajo, y por eso aqui manda el conjunto medido y no el orden de landing [doc:https://area17.com/@2026-10-09]
- Donde el vault y el conjunto medido coinciden, no hay desviacion: la alternancia por capas con banda cada dos o tres secciones es la misma regla que ya tiene el proyecto [repo:CLAUDE.md:160]

## 7. Ejemplares y anti-ejemplos

### Asi se ve bien hecho

- Trabajo que vuelve en tres formatos distintos en ocho bloques: destacado con rotulo, tarjeta con titulo y linea, y pieza sin rotulo [doc:https://gretelny.com/@2026-10-09]
- Prosa de argumento permitida solo dentro de un caso: cinco resumenes largos, cada uno con cliente, imagen y resultado, y despues los mismos cinco como rejilla [doc:https://koto.com/@2026-10-09]
- Una home de ocho bloques donde ningun parrafo pasa de 30 palabras y el argumento lo llevan nueve casos y una tira de premios [doc:https://www.wearecollins.com/@2026-10-09]
- Servicios resueltos en 35 palabras con un enlace a la lista completa, en vez de una seccion de servicios [doc:https://www.wearecollins.com/@2026-10-09]
- Prueba social sin numeros inventados: premios con año y un muro de clientes reales [doc:https://www.instrument.com/@2026-10-09]
- Equipo de tres personas con foto, rol, correo y telefono en la home de un estudio pequeño [doc:https://bielkeyang.com/@2026-10-09]
- Ensayo editorial como manera de argumentar sin seccion de proceso: 55-100 palabras que desembocan en 8-28 piezas de trabajo [doc:https://www.pentagram.com/@2026-10-09]
- Cita de socio como pull quote de 17-22 palabras entre dos bloques de trabajo, no como seccion de testimonios [doc:https://www.pentagram.com/@2026-10-09]

### Anti-ejemplos

- Cuatro enlaces con imagen a categorias genericas en vez de contenido de muestra: NN/g lo marca como fallo y dice que funcionaria con contenido real de cada categoria [doc:https://www.nngroup.com/articles/homepage-design-principles/@2024-03-15]
- Imagen a sangre sin pista visual de que hay mas abajo: suelo falso, marcado como fallo en la misma guia [doc:https://www.nngroup.com/articles/homepage-design-principles/@2024-03-15]
- Carrusel a pantalla completa de informes trimestrales que no representan lo que la empresa hace, tambien marcado como fallo [doc:https://www.nngroup.com/articles/homepage-design-principles/@2024-03-15]
- Una seccion cuyo titular es `visually-hidden` deja al lector sin saber de que va lo que esta girando: ocurre hoy en valores [repo:src/design-system/components/organisms/ValueCards/ValueCards.module.scss:32]
- Una imagen de caso que solo existe en hover equivale a no tener imagen para quien llega en movil o no pasa el puntero: ocurre hoy en servicios [repo:src/design-system/components/organisms/Services/Services.module.scss:94]
- Cuatro cifras inventadas sobre el estudio son una afirmacion, no relleno, y el propio modulo lo deja escrito [repo:src/app/figures.ts:6]

### Contextos: que hace la recomendacion en cada uno

- En la app servida, un bloque nuevo de trabajo lee del CMS igual que `WorkRows` y necesita el mismo respaldo de marcadores o se queda en una pieza [repo:src/app/work.ts:64]
- En la base de desarrollo, un bloque de trabajo sin respaldo de marcadores renderiza una rejilla de una sola pieza repetida [repo:src/app/work.ts:11]
- En vitest con jsdom, todo organismo nuevo trae contrato publico consultado por rol y nombre, `jest-axe` y el circuito TS contra Sass contando clases [repo:CLAUDE.md:186]
- En `/ds`, el preview no se amplia con previews de cada componente, asi que el bloque nuevo no entra ahi [repo:CLAUDE.md:559]
- En el admin de Payload, un organismo nuevo es un bloque nuevo: la correspondencia organismo a bloque es la regla central del proyecto [repo:CLAUDE.md:100]

## 8. Trampas

- Un organismo nuevo no lleva margen externo ni decide su tema: el hueco y la zona los pone `layout/Section`, o el espacio entre bloques pasa a depender de cuales sean [repo:CLAUDE.md:140]
- Si los bloques alrededor de la banda de imagen se vuelven bloques de trabajo con imagen, la banda deja de ser la tercera capa y se lee como un hermano mas; solo hay tres superficies y una banda cada dos o tres secciones [repo:CLAUDE.md:160]
- Nada que leer encima de la banda: un titular, una cifra o un boton la convierten en una seccion mas [repo:CLAUDE.md:165]
- Los gradientes candy nunca como fondo de seccion ni debajo de texto corrido largo [repo:CLAUDE.md:283]
- La imagen de servicios es `aria-hidden` porque hoy es decoracion de hover; al hacerla presente en reposo pasa a ser contenido y necesita alt, y el camino de hover tiene que seguir funcionando [repo:src/design-system/components/organisms/Services/Services.tsx:83]
- Cualquier copy que entre en `ValueCards` se multiplica por cinco en pantalla, asi que acortar el texto de valores sin bajar las copias solo quita un quinto del peso visual [repo:src/design-system/motion/useRadialSlider.ts:27]
- Las rutas destino de los bloques que se mudan no existen: todas las piezas apuntan a un `/trabajo` que es `TODO(rutas)` [repo:src/app/work.ts:57] y los servicios a un `/servicios` tambien pendiente [repo:src/app/services.ts:7]
- Las catorce imagenes del portafolio van con clientes marcadores a proposito; un bloque nuevo que las use publica nombres de cliente falsos si se le ponen rotulos reales [repo:src/app/work.ts:12]
- Las medidas de cada pieza salen del documento de media y nunca se escriben a mano: una medida inventada hace saltar el layout al llegar el archivo [repo:src/cms/projects.ts:32]
- Toda hoja que anime lleva su bloque de `prefers-reduced-motion` apagando `transition` y `animation`, comprobado sobre el CSS compilado [repo:CLAUDE.md:420]
- Toda seccion entra con el scroll usando `ScrollReveal`, con `inner` para listas porque el envoltorio no cabe dentro de un `ul` [repo:CLAUDE.md:465]
- Un `ScrollTrigger` no se cuelga de una linea de tiempo: colgado, gsap deja su final sin calcular y la pagina entera se cae con "reading 'end'" [repo:CLAUDE.md:453]
- Cero valores literales de color, spacing, tipografia y motion: un literal no re-tematiza y rompe la premisa de la capa de marca [repo:CLAUDE.md:76]
- Carpeta por componente con `.tsx`, `.module.scss` y `.test.tsx`, named exports y sin barriles `index.ts` [repo:CLAUDE.md:106]
- Carbon no aporta componentes aqui: de Carbon no entra ni una regla de CSS de sus componentes, asi que la rejilla de trabajo se autora con `layout/` y atomos propios [repo:CLAUDE.md:16]
- No se añaden dependencias: el motion que haga falta se escribe con los tokens que `_app.scss` publica y lee `motion/tokens.ts` [repo:CLAUDE.md:410]
- Quitar un bloque de la home deja su modulo de contenido y su clave de catalogo huerfanos en `app/` y en los dos idiomas; `es` y `en` tienen que moverse juntos [repo:src/i18n/messages/es.json:65]

## 9. Incertidumbre

- ASSUMPTION: los 18 proyectos publicados y sin destacar viven en el CMS de produccion, no en el repo; la base local tiene uno solo. prueba: `findProjects` por el MCP `pigmento-cms-prod` contando total y `featured`, antes de dimensionar una rejilla de 18 piezas.
- ASSUMPTION: la tabla medida de pantallas y porcentaje de area con imagen se tomo a 1440x900 por el equipo y no se reprodujo en esta sesion, que no tiene navegador. prueba: captura headless a 1440x900 por seccion y comparar pantallas y area de imagen con la tabla de la peticion.
- ASSUMPTION: las ocho homes se leyeron como HTML servido sin ejecutar JavaScript, asi que un bloque que se monte al hacer scroll pudo no entrar en mi conteo; Base Design llego truncado en "Now" y quedo fuera del conjunto, y PORTO ROCHA, Pentagram e Instrument llegaron truncados. prueba: repetir el conteo de dos de las ocho en un navegador real a 1440x900 y comprobar que el numero de bloques no cambia la conclusion de "0 de 8 con FAQ".
- ASSUMPTION: las notas del vault citadas como `KAREN` son el estandar propio de la casa, pero varias ramas del vault las generan scripts, asi que su autoria literal no esta comprobada. prueba: `git log` sobre esos cuatro archivos en el repo del vault para ver si entraron a mano o por generador.
- ASSUMPTION: el linter no puede expresar una cita al archivo que de verdad ordena la home, `src/app/[locale]/page.tsx`, porque los corchetes del segmento dinamico rompen la forma de la marca `repo`; el orden se cito por los modulos de contenido y por `CLAUDE.md`. prueba: leer ese archivo y comprobar que el orden de los `Section` coincide con la tabla de la seccion 5.
- [NEEDS CLARIFICATION: hay presupuesto en este cambio para crear la pagina destino de proceso, comparativa y FAQ, o ese contenido tiene que quedarse en algun sitio de la home mientras no exista? Hoy `/trabajo` y `/servicios` son TODO.]
- [NEEDS CLARIFICATION: los bloques nuevos de trabajo pueden usar las catorce imagenes de `public/portfolio/` con rotulo generico mientras el CMS no tenga casos reales, o se espera a tener proyectos con cliente publicable?]
- [NEEDS CLARIFICATION: se confirman las cuatro cifras (120 proyectos, 8 años, 14 industrias, 70% que repiten) o la seccion de cifras se cae hasta tenerlas?]
- [NEEDS CLARIFICATION: valores se queda con techo de 75 palabras y titular visible, o sale de la home? La evidencia admite las dos y es una decision de marca.]

## 10. Checklist de estandar

- [ ] De las secciones bajo el heroe, al menos la mitad contienen imagen presente en reposo (sin hover, sin puntero)
- [ ] El trabajo aparece al menos tres veces en el scroll, en al menos dos formatos visualmente distintos
- [ ] Ningun bloque nuevo repite el formato de `WorkRows` (dos filas que pasan por delante)
- [ ] El copy fuente de la home en `es.json` baja de 964 a 700 palabras o menos, y `en.json` se mueve con el
- [ ] Ninguna seccion de la home pasa de 120 palabras de copy fuente
- [ ] Toda prosa de argumento que se queda cuelga de un caso con nombre e imagen, o se va a su pagina
- [ ] Ninguna seccion de la home tiene su `h2` oculto con `visually-hidden`
- [ ] Cada pieza de imagen nueva lleva alt, y sus medidas salen del documento de media, nunca escritas a mano
- [ ] Ningun bloque nuevo declara margen externo ni tema propio: los pone `layout/Section`
- [ ] Sigue habiendo exactamente tres capas de superficie y una banda cada dos o tres secciones
- [ ] La banda de imagen sigue sin nada que leer encima
- [ ] Todo organismo nuevo recibe props serializables y equivale a un bloque de Payload
- [ ] Todo organismo nuevo trae contrato publico por rol y nombre, `jest-axe`, y el conteo de clases TS contra Sass
- [ ] Toda hoja nueva que anime trae su bloque de `prefers-reduced-motion` apagando `transition` y `animation`
- [ ] Todo bloque nuevo entra con `ScrollReveal`, con `inner` si su contenido es una lista
- [ ] Cero literales de color, spacing, tipografia y motion; `./scripts/gates.sh` en verde
- [ ] Cero dependencias nuevas
- [ ] Un bloque de trabajo nuevo renderiza algo razonable con un solo proyecto en la base (respaldo de marcadores, como `getWork`)
- [ ] Ninguna cifra sin confirmar sigue publicada
- [ ] Ningun bloque que se mueve fuera de la home deja su contenido sin pagina destino alcanzable
- [ ] Ningun modulo de `app/` ni clave de catalogo queda huerfano tras el recorte

## 11. Fuentes

| n | Titulo | Editor | Version o fecha | Consultado | Confianza |
|---|---|---|---|---|---|
| 1 | Scrolling and Attention | Nielsen Norman Group (Therese Fessenden) | 2018-04-15 | 2026-10-09 | high |
| 2 | How Little Do Users Read? | Nielsen Norman Group (Jakob Nielsen) | 2008-05-05 | 2026-10-09 | high |
| 3 | Homepage Design: 5 Fundamental Principles | Nielsen Norman Group (Huei-Hsin Wang) | 2024-03-15 | 2026-10-09 | high |
| 4 | Top 10 Guidelines for Homepage Usability | Nielsen Norman Group (Jakob Nielsen) | 2002-05-11 | 2026-10-09 | medium, es de 2002 |
| 5 | Minimize Cognitive Load to Maximize Usability | Nielsen Norman Group (Kathryn Whitenton) | 2013-12-22 | 2026-10-09 | high |
| 6 | The Picture-Superiority Effect | Nielsen Norman Group (Sara Paul) | 2024-04-26 | 2026-10-09 | high |
| 7 | Long vs. Short Articles as Content Strategy | Nielsen Norman Group (Jakob Nielsen) | 2007-11-11 | 2026-10-09 | medium, es de 2007 |
| 8 | FAQs Still Deliver Great Value | Nielsen Norman Group (Susan Farrell) | 2014-12-21 | 2026-10-09 | medium |
| 9 | Strategic Design for Frequently Asked Questions | Nielsen Norman Group (Susan Farrell) | 2015 | 2026-10-09 | medium, solo la ficha del informe |
| 10 | Mobile Homepage benchmark | Baymard Institute | benchmark de 93 sitios | 2026-10-09 | medium, es comercio electronico movil |
| 11 | Home de Pentagram | Pentagram | consultada | 2026-10-09 | high |
| 12 | Home de COLLINS | COLLINS | consultada | 2026-10-09 | high |
| 13 | Home de AREA 17 | AREA 17 | consultada | 2026-10-09 | high |
| 14 | Home de Koto | Koto | consultada | 2026-10-09 | high |
| 15 | Home de PORTO ROCHA | PORTO ROCHA | consultada, truncada | 2026-10-09 | medium |
| 16 | Home de Gretel | Gretel | consultada | 2026-10-09 | high |
| 17 | Home de Bielke&Yang | Bielke&Yang | consultada | 2026-10-09 | high |
| 18 | Home de Instrument | Instrument | consultada, truncada | 2026-10-09 | medium |
| 19 | Composicion de paginas | vault Knowledge, Frontend/Estilo | nota de fundamento | 2026-10-09 | medium, autoria no comprobada |
| 20 | Mapa de Secciones y familias galeria, stats, faq, comparacion, testimonios | vault Knowledge, Frontend/Estilo | notas de seccion | 2026-10-09 | medium, autoria no comprobada |
| 21 | CLAUDE.md y codigo de Pigmento Studio | el propio repo | arbol de trabajo 2026-10-09 | 2026-10-09 | high |
| 22 | Veredicto de Karen sobre la home | conversacion | 2026-10-09 | 2026-10-09 | high |
