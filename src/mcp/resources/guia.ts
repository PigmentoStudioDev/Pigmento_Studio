/**
 * pigmento://cms/guia — como esta modelado el CMS, en una pagina.
 *
 * Se escribe a mano y no se lee del CMS porque el CMS no tiene un documento que
 * lo diga: el criterio vive en CLAUDE.md y en cada coleccion. Lo que un campo
 * SIGNIFICA no cabe en su tipo, y es lo que un modelo necesita antes de escribir.
 */
export const GUIA_URI = 'pigmento://cms/guia';

export const guia = `# Como esta modelado el CMS de Pigmento

## Idiomas
- Dos locales: \`es\` (por defecto) y \`en\`, con fallback al español.
- Los campos de texto que se leen (\`title\`, \`summary\`, \`alt\`, los textos de una
  propuesta) se localizan: se escriben una vez por locale, pasando \`locale\` en la tool.
- \`slug\` NO se localiza: una direccion es una direccion. Es unico e indexado.

## Colecciones
### media
Los archivos que el sitio pinta, servidos desde R2 bajo el prefijo \`pigmento/media\`.
Payload guarda \`width\` y \`height\` y el sitio los usa para reservar el hueco. El
archivo entra por la tool de subida; crear un \`media\` por JSON solo registra
metadatos. Reglas de los assets: \`pigmento://cms/media\`.

### projects — el portfolio
- \`title\` (localizado, obligatorio), \`slug\` (unico), \`client\`, \`year\`,
  \`discipline\` (branding | web | motion | marketing), \`summary\` (localizado, texto plano:
  los organismos reciben cadenas, no rich text).
- \`discipline\` es UNA, la principal: la etiqueta que pinta cada fila del sitio.
  \`categories\` son TODAS las que se trabajaron, de una lista cerrada: branding |
  packaging | motion | web | ecommerce | producto (UX/UI) | marketing | redes. Motion
  cubre motion branding y motion graphics; ecommerce, diseno y desarrollo de tienda.
  No se localizan: se guarda la clave y el sitio traduce la etiqueta.
- \`cover\` (obligatorio) y \`gallery[].image\` son ids de \`media\`.
- \`featured\`: aparece en el escaparate del menu y en el manifiesto.
- \`order\`: menor primero; empata por fecha de creacion.
- Tiene borradores (\`_status\`: draft | published). El sitio solo pinta lo publicado.
  Crea con \`draft: true\` y deja que la persona publique.

### proposals — cotizaciones privadas
- Contenido no publico. Su URL publica lleva un \`accessToken\` que acuña el SERVIDOR al
  crear: no lo mandes ni lo inventes; lo que mandes se ignora.
- Nace con \`status: borrador\`; cambiar el estado es decision de la persona.
- Dinero en centavos enteros en campos \`*Cents\` (\`amountCents\`, \`amountMaxCents\`), con
  \`currency\` MXN | USD. Nunca decimales.
- La comparativa se apoya en \`criteria\` (declarados una vez) y \`packages[].values\`
  (un valor por criterio, en el mismo orden). Al guardar, el servidor alinea la matriz
  y acuña las claves de \`findings\`: no las escribas.
- \`notes\` es interno y nunca llega a la pagina.

### legal — los textos legales
- Una entrada por documento: aviso de privacidad, terminos, cookies. \`slug\` unico y NO
  localizado; \`title\`, \`intro\` y \`tocTitle\` si se localizan.
- \`effectiveDate\` es desde cuando rige esta version, y va arriba del documento.
- El cuerpo es \`sections\`, una LISTA, no un bloque de texto: la pagina lleva un indice al
  lado y ese indice sale de aqui. Cada seccion tiene \`heading\`, \`level\` (2 seccion, 3
  subseccion), \`body\` con un parrafo por bloque separados por linea en blanco, y \`items\`
  para una lista opcional.
- \`anchor\` lo acuña el SERVIDOR desde el encabezado al CREAR: no lo escribas, y lo que
  mandes ahi se sanea igual, asi que no sirve para meter nada.
- Al ACTUALIZAR, devuelve en cada seccion el \`anchor\` tal cual lo leiste. Una fila que
  llega sin el se trata como nueva y su ancla se recalcula desde el encabezado nuevo, lo
  que rompe un enlace que puede estar pegado en un correo. No es un capricho: estas tools
  no admiten el \`id\` de una fila, asi que el ancla es lo unico que la identifica.
- Tiene borradores y no se puede borrar por aqui. Publicar un legal es decision de la
  persona.

## Lo que no existe
- Usuarios: se dan de alta en el panel, no por aqui.
- Globals de navegacion y pie: todavia no estan en el CMS.
- Rich text: ningun campo lo lleva; los parrafos van en \`textarea\`, separados por
  linea en blanco.
`;
