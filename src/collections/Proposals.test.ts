import { describe, expect, it } from 'vitest';
import { alignProposal, criterionKey, mintAccessToken } from './Proposals';

/**
 * El token de acceso ES la llave de la URL privada. Este archivo existe porque
 * `admin.readOnly` NO lo protege: es una propiedad del panel, no del control de
 * acceso — vive bajo el tipo `AdminClient` y no bajo `access` del campo. Con
 * `access.update` de la coleccion en `Boolean(user)`, cualquiera con sesion podia
 * mandar `PATCH /api/proposals/1 { "accessToken": "pigmento2026" }` y el hook se
 * quedaba con ese valor por ser truthy.
 */
describe('mintAccessToken', () => {
  it('al crear ignora el token que venga en la peticion', () => {
    const token = mintAccessToken({ operation: 'create', value: 'pigmento2026' });

    expect(token).not.toBe('pigmento2026');
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('al actualizar conserva el token guardado, diga lo que diga la peticion', () => {
    const guardado = '11111111-2222-4333-8444-555555555555';

    expect(
      mintAccessToken({
        operation: 'update',
        value: 'pigmento2026',
        originalDoc: { accessToken: guardado },
      }),
    ).toBe(guardado);
  });

  it('acuna uno si el documento guardado no tenia', () => {
    expect(mintAccessToken({ operation: 'update', originalDoc: {} })).toHaveLength(36);
  });

  it('dos llamadas no dan el mismo token', () => {
    expect(mintAccessToken({ operation: 'create' })).not.toBe(
      mintAccessToken({ operation: 'create' }),
    );
  });
});

describe('criterionKey', () => {
  it('quita acentos, espacios y mayusculas', () => {
    expect(criterionKey('Carga de propiedades')).toBe('carga-de-propiedades');
    expect(criterionKey('Operación')).toBe('operacion');
  });

  it('no deja guiones colgando en los extremos', () => {
    expect(criterionKey('  ¡Permisos!  ')).toBe('permisos');
  });
});

/**
 * El tipo que `alignProposal` acepta. Sin nombrarlo, TypeScript infiere de cada literal
 * un elemento SIN `key` ni `id` y `out.packages[0].key` no compila: la funcion devuelve
 * exactamente el tipo que recibe. Se nombra aqui en vez de exportar su interfaz solo
 * para el test.
 */
type Alineable = Parameters<typeof alignProposal>[0];

describe('alignProposal', () => {
  const criteria = [{ label: 'Inventario' }, { label: 'Permisos' }];

  /**
   * El caso REAL que motivo el hook. En la propuesta de MoEasy la tercera ruta
   * definia PERMISOS y las otras dos no, asi que las columnas dejaron de compararse
   * fila con fila y nadie lo noto — el PDF salio asi.
   */
  it('da a cada paquete una fila por criterio, aunque no la trajera', () => {
    const out = alignProposal({
      criteria,
      packages: [
        { values: [{ key: 'inventario', value: 'Nuevo' }] },
        { values: [{ key: 'permisos', value: 'Segun la integracion' }] },
      ],
    });

    expect(out.packages?.[0].values).toEqual([
      { key: 'inventario', value: 'Nuevo' },
      { key: 'permisos', value: '' },
    ]);
    expect(out.packages?.[1].values).toEqual([
      { key: 'inventario', value: '' },
      { key: 'permisos', value: 'Segun la integracion' },
    ]);
  });

  it('deriva la clave de cada criterio y respeta la que ya tenga', () => {
    const out = alignProposal({
      criteria: [{ label: 'Carga de propiedades' }, { label: 'Otro', key: 'clave-vieja' }],
      packages: [],
    });

    expect(out.criteria?.map((c) => c.key)).toEqual(['carga-de-propiedades', 'clave-vieja']);
  });

  /**
   * El valor de un criterio borrado NO sobrevive. Si lo hiciera, reaparecia en su
   * columna al volver a crear un criterio con el mismo nombre — con el texto de otra
   * version de la propuesta.
   */
  it('descarta los valores de criterios que ya no existen', () => {
    const out = alignProposal({
      criteria: [{ label: 'Inventario' }],
      packages: [
        {
          values: [
            { key: 'inventario', value: 'Nuevo' },
            { key: 'borrado', value: 'Texto viejo' },
          ],
        },
      ],
    });

    expect(out.packages?.[0].values).toEqual([{ key: 'inventario', value: 'Nuevo' }]);
  });

  /**
   * La fila de un valor CONSERVA SU ID.
   *
   * Antes de localizar daba igual: el texto vivia en la propia fila y se reescribia
   * identico. Con `value` localizado, devolver una fila sin id hace que Payload borre
   * la vieja y cree otra — y las filas `_locales` que colgaban de ella se van en
   * cascada. Guardar la version en ingles vaciaba la tabla comparativa en espanol,
   * sin error y sin que nada lo avisara.
   */
  it('conserva el id de cada fila de valor', () => {
    const entrada: Alineable = {
      criteria: [{ key: 'inventario', label: 'Inventario' }],
      packages: [{ name: 'Ruta', values: [{ id: 'fila-1', key: 'inventario', value: 'Texto' }] }],
    };

    expect(alignProposal(entrada).packages?.[0]?.values?.[0]).toEqual({
      id: 'fila-1',
      key: 'inventario',
      value: 'Texto',
    });
  });

  /** El hueco de un criterio nuevo no trae id: lo acuna Payload al guardarlo. */
  it('el criterio sin valor previo entra sin id', () => {
    const entrada: Alineable = {
      criteria: [{ key: 'nuevo', label: 'Nuevo' }],
      packages: [{ name: 'Ruta', values: [] }],
    };

    expect(alignProposal(entrada).packages?.[0]?.values).toEqual([{ key: 'nuevo', value: '' }]);
  });

  /**
   * Antes de S10 esto afirmaba IDENTIDAD —que el array saliera siendo el mismo
   * objeto— y dejo de ser cierto a proposito: ahora se acuna la clave de cada ruta
   * tambien sin criterios. Lo que sigue en pie, y es lo que protegia de verdad, es
   * que sin matriz declarada los valores ya escritos no se tocan: vaciarlos aqui
   * borraria trabajo del editor cada vez que guardara antes de declarar criterios.
   */
  it('sin criterios no toca los valores de los paquetes', () => {
    const paquetes = [{ values: [{ key: 'x', value: 'y' }] }];
    const out = alignProposal({ criteria: [], packages: paquetes });

    expect(out.packages?.[0]?.values).toEqual([{ key: 'x', value: 'y' }]);
  });
});

/**
 * Los hallazgos comparten la maquina de claves con los criterios: S9b ata cada
 * entregable a un hallazgo por su clave, y una clave tecleada a mano por quien
 * redacta es un typo que rompe esa relacion sin dar error. Se acuna aqui, en S9a,
 * para no migrar la coleccion dos veces.
 */
describe('alignProposal · hallazgos', () => {
  it('deriva la clave de cada hallazgo y respeta la que ya tenga', () => {
    const out = alignProposal({
      findings: [
        { title: 'La ficha no capta ningun lead' },
        { title: 'Titulo reescrito tres veces', key: 'captacion' },
      ],
    });

    expect(out.findings?.map((f) => f.key)).toEqual([
      'la-ficha-no-capta-ningun-lead',
      'captacion',
    ]);
  });

  /**
   * Una propuesta SIN hallazgos se deja como estaba. La cotizacion simple de S5 no
   * tiene diagnostico, y crearle un array vacio la haria renderizar una seccion de
   * auditoria en blanco.
   */
  it('no inventa una lista cuando la propuesta no trae hallazgos', () => {
    expect(alignProposal({ criteria: [], findings: undefined }).findings).toBeUndefined();
  });
});

/**
 * La clave de cada RUTA, que es el mismo problema una capa mas.
 *
 * Hasta S10 la ruta recomendada se resolvia comparando cadenas:
 * `recommendedPackage === p.name`. Eso aguanta mientras el nombre sea un dato
 * fijo, y deja de aguantar en cuanto el nombre se traduce — en ingles
 * "Plataforma conectada" no casa con "Connected platform" y la insignia
 * desaparece sin que falle nada. Una clave que no se traduce es lo unico que
 * sobrevive a los dos idiomas.
 */
describe('alignProposal · rutas', () => {
  it('deriva la clave de cada ruta y respeta la que ya tenga', () => {
    const out = alignProposal({
      packages: [
        { name: 'Plataforma conectada' },
        { name: 'Nombre reescrito tres veces', key: 'sitio-base' },
      ],
    });

    expect(out.packages?.map((p) => p.key)).toEqual([
      'plataforma-conectada',
      'sitio-base',
    ]);
  });

  /**
   * Sin criterios `alignProposal` sale temprano —no hay matriz que alinear— pero
   * las claves de ruta se acunan igual: no dependen de la matriz, y una propuesta
   * puede declarar rutas antes de declarar en que se diferencian.
   */
  it('acuna la clave aunque no haya criterios que alinear', () => {
    const entrada: Alineable = { criteria: [], packages: [{ name: 'Sitio base' }] };
    const out = alignProposal(entrada);

    expect(out.packages?.[0]?.key).toBe('sitio-base');
  });

  it('no inventa una lista cuando la propuesta no trae rutas', () => {
    expect(alignProposal({ criteria: [], packages: undefined }).packages).toBeUndefined();
  });

  /**
   * Quien redacta escribe el NOMBRE de la ruta recomendada, no su clave. Se
   * normaliza con la misma funcion que derivo la clave, asi que casan por
   * construccion y nadie tiene que teclear un slug.
   */
  it('convierte la ruta recomendada en su clave', () => {
    const entrada: Alineable = {
      criteria: [],
      packages: [{ name: 'Plataforma conectada' }],
      recommendedPackage: 'Plataforma conectada',
    };
    const out = alignProposal(entrada);

    expect(out.recommendedPackage).toBe(out.packages?.[0]?.key);
  });

  /** Idempotente: guardar dos veces no degrada la clave. */
  it('deja en paz una recomendada que ya venia en clave', () => {
    const entrada: Alineable = { criteria: [], recommendedPackage: 'plataforma-conectada' };

    expect(alignProposal(entrada).recommendedPackage).toBe('plataforma-conectada');
  });

  /** Sin recomendada no se inventa una cadena vacia que casaria con cualquier hueco. */
  it('no toca la recomendada cuando no hay ninguna', () => {
    const entrada: Alineable = { criteria: [] };

    expect(alignProposal(entrada).recommendedPackage).toBeUndefined();
  });
});
