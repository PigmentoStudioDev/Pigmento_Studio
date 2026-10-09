/**
 * Las familias del gradiente candy que puede llevar una tarjeta, del lado de TS.
 *
 * Los colores viven en `_brand.scss` ($candy-families) y la forma en `_candy.scss`;
 * aqui solo el NOMBRE, que es lo que viaja en las props y lo que un campo `select` de
 * Payload guardaria. El contrato de candy comprueba que cada nombre exista en la hoja.
 *
 * El orden es el del reparto por posicion: alterna calidos y frios para que dos
 * tarjetas vecinas no caigan en la misma temperatura.
 *
 * Orquidea NO esta en el ciclo. Su esquina saturada no llega a 4.5:1 con ningun texto
 * —ni el negro puro—, asi que solo admite texto grande, y las tarjetas del ciclo
 * llevan cuerpo de texto en la mitad baja. Sigue siendo token para quien la use con
 * titulares.
 */
export const CANDY_CYCLE = ["periwinkle", "tangerine", "cyan", "pink", "lime", "amber"] as const;

/** Una familia del ciclo: lo que `candyAt` puede devolver, sin orquidea. */
export type CycledCandyFamily = (typeof CANDY_CYCLE)[number];

export type CandyFamily = CycledCandyFamily | "orchid";

/**
 * El tipo de vuelta es el del CICLO y no `CandyFamily`: orquidea no entra, y
 * prometer que podria obliga a quien reparta clases por familia a inventarse un caso
 * que nunca ocurre — que es exactamente donde se cuela un color equivocado.
 */
export function candyAt(index: number): CycledCandyFamily {
  return CANDY_CYCLE[index % CANDY_CYCLE.length];
}
