/**
 * El vocabulario del cursor propio: que atributos lo cambian y que decide cada uno.
 *
 * El cursor es UNO para todo el sitio y se monta en el layout. Lo que cambia su forma
 * no es el componente que tiene debajo sino un atributo que ese componente publica en
 * su HTML, como el sonido de la interfaz: un bloque renderizado en servidor pide su
 * cursor sin volverse componente de cliente, y el cursor no conoce ningun bloque.
 *
 * Agregar una variante es: su nombre aqui, su capa en CustomCursor y su estilo en la
 * hoja. Ningun componente que ya use otra cambia.
 */

/** Pide una variante. Gana el ancestro mas cercano que lo lleve. */
export const CURSOR_ATTRIBUTE = "data-cursor";

/** Marca el instante en que el boton esta abajo: el disco de arrastre se aprieta. */
export const CURSOR_PRESSED_ATTRIBUTE = "data-cursor-pressed";

/** El texto de la variante, para las que llevan texto. */
export const CURSOR_TEXT_ATTRIBUTE = "data-cursor-text";

/**
 * `default` es la flecha, y es lo que se ve sin atributo. Existe como nombre para
 * poder VOLVER a ella dentro de un bloque que pida otra.
 *
 * `scramble` es la pastilla de texto para lo que LLEVA a otro sitio; `drag` es el disco
 * con dos flechas para lo que se arrastra en su sitio. La diferencia no es cosmetica:
 * una promete navegacion y la otra promete un gesto, y confundirlas es prometer mal.
 */
export const CURSOR_VARIANTS = ["default", "scramble", "drag"] as const;

export type CursorVariant = (typeof CURSOR_VARIANTS)[number];

/** Lo que crece la flecha: sobre esto hay algo que se puede pulsar. */
export const CURSOR_INTERACTIVE = "a, button, [role='button']";

export interface CursorTarget {
  variant: CursorVariant;
  text: string;
  /** El elemento que pidio la variante, o null si es la de por defecto. */
  element: Element | null;
}

function isVariant(value: string | null): value is CursorVariant {
  return (CURSOR_VARIANTS as readonly string[]).includes(value ?? "");
}

/** La variante y el texto que pide lo que hay bajo el puntero. */
export function readCursorTarget(under: Element | null): CursorTarget {
  const element = under?.closest(`[${CURSOR_ATTRIBUTE}]`) ?? null;
  const value = element?.getAttribute(CURSOR_ATTRIBUTE) ?? null;

  // Un valor que no es variante se trata como si no hubiera atributo: un typo en el
  // HTML deja la flecha, no un cursor vacio.
  if (!element || !isVariant(value) || value === "default") {
    return { variant: "default", text: "", element: null };
  }

  return { variant: value, text: element.getAttribute(CURSOR_TEXT_ATTRIBUTE) ?? "", element };
}

export type CursorState = "" | "active" | "active-edge";

/**
 * El estado de la capa que acompana al puntero. `active-edge` solo lo usa la pastilla:
 * cuelga a la derecha del puntero y al llegar al borde se voltea en vez de salirse. El
 * disco de arrastre va centrado en el puntero, asi que el borde no le afecta.
 */
export function cursorState(variant: CursorVariant, overflowsRight: boolean): CursorState {
  if (variant === "default") return "";
  if (variant === "scramble" && overflowsRight) return "active-edge";
  return "active";
}

/** Hacia donde apunta la flecha cuando el puntero se mueve: la punta en la direccion. */
export function rotationFromDelta(dx: number, dy: number): number {
  return Math.atan2(dy, dx) * (180 / Math.PI) + 90;
}

/** Los atributos de una variante, listos para esparcir en un elemento. */
export function cursorAttributes(variant: CursorVariant, text?: string): Record<string, string> {
  return {
    [CURSOR_ATTRIBUTE]: variant,
    ...(text ? { [CURSOR_TEXT_ATTRIBUTE]: text } : {}),
  };
}
