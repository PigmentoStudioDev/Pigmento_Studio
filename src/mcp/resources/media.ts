/** pigmento://cms/media — las reglas de los assets, las que \`Media.ts\` ya escribe. */
export const MEDIA_URI = 'pigmento://cms/media';

export const mediaRules = `# Los assets de Pigmento

- \`alt\` es OBLIGATORIO y se localiza (\`es\` y \`en\`). Describe lo que se ve para quien no
  lo ve: sujeto, accion, contexto. No empieza por "imagen de". Un alt vacio no vale: si la
  imagen es decorativa y no aporta nada, no se sube a una coleccion que el sitio pinta.
- Formatos: png, jpeg, webp, gif y mp4. Nada mas: \`media\` es lo que el sitio pinta, y un
  PDF no se pinta. SVG queda fuera porque se sirve sin sanear desde un bucket publico;
  AVIF, hasta que haga falta de verdad.
- Tope: 15 MB por archivo. Para el portfolio, webp o avif a 2000 px de lado mayor sobra.
- Los archivos viven en R2 bajo \`pigmento/media/\`. El nombre se limpia a
  \`[a-z0-9._-]\` y Payload desduplica si ya existe uno igual.
- Antes de subir, busca en \`media\` por \`filename\` o por \`alt\`: un duplicado en R2 no se
  borra solo.
- \`width\` y \`height\` los calcula Payload al subir; el sitio los necesita y no se
  escriben a mano.
- Borrar un \`media\` que un proyecto usa como \`cover\` deja el proyecto sin portada y el
  campo es obligatorio: comprueba con una busqueda de \`projects\` antes de borrar.
`;
