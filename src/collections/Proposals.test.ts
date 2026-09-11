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

  it('sin criterios no toca los paquetes', () => {
    const paquetes = [{ values: [{ key: 'x', value: 'y' }] }];
    expect(alignProposal({ criteria: [], packages: paquetes }).packages).toBe(paquetes);
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
