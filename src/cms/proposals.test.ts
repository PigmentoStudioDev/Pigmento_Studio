import { describe, expect, it } from 'vitest';
import type { Proposal } from '@/payload-types';
import { toView } from './proposals';

/**
 * Contrato de la vista del cliente. Estos tres tests son la mitad de la
 * seguridad de esta coleccion; la otra mitad es el gate de la consulta.
 *
 * Nada de datos con pinta de real: ni nombres de clientes ni cifras que parezcan
 * una cotizacion. Un fixture realista acaba en una captura de pantalla, y esto
 * es el repo de una agencia de marca.
 */
const propuesta = (fields: Partial<Proposal>) =>
  ({
    id: 1,
    client: 'Cliente A',
    status: 'enviada',
    currency: 'MXN',
    ...fields,
  }) as Proposal;

describe('toView', () => {
  /**
   * El que importa. `notes` y `accessToken` son internos: el primero lleva lo que
   * se dice del cliente sin que lo lea, el segundo ES la llave de la URL. Se
   * comprueba sobre las CLAVES y no leyendo cada campo, porque lo que hay que
   * impedir es que un `...doc` futuro los cuele sin que nadie lo decida.
   */
  it('no deja salir ningun campo interno', () => {
    const view = toView(
      propuesta({
        notes: 'no publicar',
        accessToken: 'no-publicar-tampoco',
        contactEmail: 'interno@example.invalid',
      }),
    );

    // Se afirma sobre la AUSENCIA y no sobre la lista exacta de claves. La version
    // anterior comparaba las siete claves de entonces contra un array literal, y se
    // rompio entera al crecer la vista — un test que falla por anadir un campo
    // publico entrena a actualizarlo sin leerlo, que es como se cuela el que si
    // importaba. Lo que no puede pasar es que un `...doc` futuro arrastre un campo
    // interno, y eso lo cubre esta lista.
    const INTERNOS = ['notes', 'accessToken', 'contactEmail', 'id', 'createdAt', 'updatedAt'];

    for (const campo of INTERNOS) {
      expect(Object.keys(view), `${campo} cruzo al cliente`).not.toContain(campo);
    }

    const serializado = JSON.stringify(view);
    expect(serializado).not.toContain('no publicar');
    expect(serializado).not.toContain('no-publicar-tampoco');
    expect(serializado).not.toContain('interno@example.invalid');
  });

  /**
   * El total se calcula. Guardado podria contradecir a sus renglones —basta con
   * editar uno y que falle el hook— y entonces la cotizacion dice dos cosas.
   * En centavos enteros: SQLite no tiene decimal y 0.1 + 0.2 no da 0.3.
   */
  it('suma los renglones en centavos enteros', () => {
    const view = toView(
      propuesta({
        scopeItems: [
          { id: 'a', concept: 'Uno', amountCents: 1050 },
          { id: 'b', concept: 'Dos', amountCents: 2075 },
        ],
      }),
    );

    expect(view.totalCents).toBe(3125);
    expect(Number.isInteger(view.totalCents)).toBe(true);
  });

  it('marca vencida la que paso de fecha, y solo esa', () => {
    const ahora = new Date('2026-06-15');
    expect(toView(propuesta({ validUntil: '2026-06-01' }), ahora).expired).toBe(true);
    expect(toView(propuesta({ validUntil: '2026-07-01' }), ahora).expired).toBe(false);
    expect(toView(propuesta({}), ahora).expired).toBe(false);
  });
});
