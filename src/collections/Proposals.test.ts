import { describe, expect, it } from 'vitest';
import { mintAccessToken } from './Proposals';

/**
 * El token de acceso ES la llave de la URL privada. Este archivo existe porque
 * `admin.readOnly` NO lo protege: es una propiedad del panel, no del control de
 * acceso — vive bajo el tipo `AdminClient` y no bajo `access` del campo. Con
 * `access.update` de la coleccion en `Boolean(user)`, cualquiera con sesion podia
 * mandar `PATCH /api/proposals/1 { "accessToken": "pigmento2026" }` y el hook se
 * quedaba con ese valor por ser truthy.
 *
 * El hook se prueba como funcion pura, igual que `toPiece` en S4: arrancar Payload
 * dentro de Vitest seria montar una base de datos para afirmar sobre tres lineas
 * que no dependen de ella.
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

  /**
   * Un documento sin token no puede quedarse sin el: su URL dejaria de existir y
   * el indice UNIQUE de SQLite admite varios NULL, asi que tampoco lo impediria
   * la base. Se le acuna uno.
   */
  it('acuna uno si el documento guardado no tenia', () => {
    const token = mintAccessToken({ operation: 'update', originalDoc: {} });

    expect(token).toHaveLength(36);
  });

  it('dos llamadas no dan el mismo token', () => {
    expect(mintAccessToken({ operation: 'create' })).not.toBe(
      mintAccessToken({ operation: 'create' }),
    );
  });
});
