/**
 * Las cuatro zonas de tema de Carbon, como lo que son: una clase.
 *
 * Carbon trae un componente <Theme> para esto, pero hace tres cosas y solo
 * necesitamos una — poner la clase. Las otras dos molestan: abre un contexto de
 * cliente (usePrefix) y anade SIEMPRE `cds--layer-one`, que reinicia la capa
 * aunque no haya cambio de tema.
 *
 * Y sobre todo: importarlo arrastraba el barrel entero de @carbon/react. En el
 * bundle aparecian flatpickr, TreeView y MultiSelect por pedir un componente que
 * concatena un string. Carbon es la plantilla de tokens; sus componentes no entran
 * ni por la puerta del CSS ni por la del JS.
 *
 * Este archivo es la UNICA frontera que conoce la convencion de clases de Carbon,
 * y por eso esta exento de la regla `handwritten-cds-class`: en cualquier otro
 * sitio, escribir `cds--` a mano sigue siendo acoplarse a nombres que son suyos.
 */
export type ThemeZone = "white" | "g10" | "g90" | "g100";

export function themeZoneClass(zone: ThemeZone): string {
  return `cds--${zone}`;
}

/**
 * El modo del sitio. Dos y no cuatro: claro y oscuro es lo que una persona elige.
 * Las cuatro zonas de Carbon son el material con el que se construyen esos dos, no
 * una eleccion que se le ofrezca a nadie.
 */
export type ThemeMode = "light" | "dark";

/**
 * El tono de una superficie. El modo es lo que ELIGE quien visita; el tono es lo que
 * una seccion PIDE en cada modo.
 *
 * `light` y `dark` son ABSOLUTOS: dicen de que lado esta la superficie, y valen lo
 * mismo en los dos modos. `raised` es RELATIVO: un escalon por encima del modo, sin
 * cambiar de lado — g10 sobre una pagina clara, g90 sobre una oscura.
 *
 * Y ese matiz es la diferencia con el rol `alt` que se retiro de aqui. `alt` valia "la
 * zona contraria al modo", asi que volteaba: una franja oscura por diseno se volvia
 * blanca en modo oscuro. `raised` no puede voltear nada — solo sube un escalon dentro
 * del modo en el que ya esta.
 *
 * Existe porque sin el, en modo oscuro la unica manera de marcar un capitulo es
 * blanco a pantalla completa, que deslumbra. Un sistema oscuro no puntua invirtiendo,
 * puntua elevando.
 */
export type ThemeTone = "light" | "dark" | "raised";

/** Los tonos, para quien tenga que recorrerlos — el contrato de tema los comprueba todos. */
export const THEME_TONES: readonly ThemeTone[] = ["light", "dark", "raised"];

/**
 * El tema de una seccion, ASIGNADO por modo: que tono lleva cuando el sitio esta en
 * claro y cual cuando esta en oscuro. El modo que se omite sigue al sitio.
 *
 * Asignacion y no inversion, y esa es la decision. Hubo un rol `alt` que valia "la
 * zona contraria al modo": en claro salia oscuro y en oscuro claro, lo pidiera la
 * seccion o no. Una franja oscura por diseno —el trabajo sobre negro— se volvia
 * blanca al pasar a oscuro, y la cabecera con ella. El modo oscuro no es darle la
 * vuelta a la pagina: cada seccion dice que es en cada contexto, y nada cambia de
 * lado sin que alguien lo haya escrito.
 *
 * Datos planos a proposito: un bloque de Payload lo alimenta con dos selects.
 */
export type ThemeAssignment = Partial<Record<ThemeMode, ThemeTone>>;

/**
 * La zona de Carbon de cada tono, POR MODO. La tabla tiene dos filas y no una porque
 * `raised` se resuelve distinto en cada una: es el unico tono relativo, y la fila es
 * lo que lo hace explicito en vez de esconderlo en un condicional.
 *
 * La diagonal —light/light y dark/dark— es ademas la que carga el DOCUMENTO: un sitio
 * en oscuro es una pagina de tono oscuro.
 *
 * El modo no es un vocabulario nuevo ni un atributo propio: es cual de las cuatro
 * zonas lleva <html>. Asi el mecanismo sigue siendo entero el de Carbon — una de
 * sus clases, en la raiz — y no hay una segunda forma de tematizar conviviendo con
 * la suya. g10 y g90 quedan fuera de la asignacion y disponibles por su clase.
 */
const TONE_ZONE: Record<ThemeMode, Record<ThemeTone, ThemeZone>> = {
  light: { light: "white", dark: "g100", raised: "g10" },
  dark: { light: "white", dark: "g100", raised: "g90" },
};

export function themeModeClass(mode: ThemeMode): string {
  return themeZoneClass(TONE_ZONE[mode][mode]);
}

/** La zona de una superficie en un modo: la asignada, o la del sitio si no hay. */
export function resolveZone(mode: ThemeMode, assignment?: ThemeAssignment): ThemeZone {
  return TONE_ZONE[mode][assignment?.[mode] ?? mode];
}

/**
 * El atributo que publica la asignacion de cada modo. Dos y no uno con las dos
 * mitades dentro: la hoja global los lee con un selector de atributo exacto bajo la
 * clase de modo, y un valor compuesto no se puede partir en CSS.
 */
export const THEME_ATTRIBUTE: Record<ThemeMode, string> = {
  light: "data-theme-light",
  dark: "data-theme-dark",
};

/** Los atributos de una asignacion, listos para esparcir en un elemento. */
export function themeAttributes(assignment: ThemeAssignment | undefined): Record<string, ThemeTone> {
  if (!assignment) return {};

  return Object.fromEntries(
    (Object.keys(THEME_ATTRIBUTE) as ThemeMode[])
      .filter((mode) => assignment[mode])
      .map((mode) => [THEME_ATTRIBUTE[mode], assignment[mode] as ThemeTone]),
  );
}

function toTone(value: string | null): ThemeTone | undefined {
  return THEME_TONES.includes(value as ThemeTone) ? (value as ThemeTone) : undefined;
}

/** Lee de vuelta la asignacion que un elemento publica. Sin atributos, ninguna. */
export function readThemeAssignment(element: Element): ThemeAssignment | undefined {
  const light = toTone(element.getAttribute(THEME_ATTRIBUTE.light));
  const dark = toTone(element.getAttribute(THEME_ATTRIBUTE.dark));
  if (!light && !dark) return undefined;

  return { ...(light ? { light } : {}), ...(dark ? { dark } : {}) };
}

/** El selector de todo lo que publica una asignacion, para quien lo observe. */
export const THEMED_SELECTOR = Object.values(THEME_ATTRIBUTE)
  .map((name) => `[${name}]`)
  .join(", ");

/**
 * Las dos zonas CLARAS de Carbon.
 *
 * Vive aqui y no en el componente que lo necesita por la misma razon que el resto
 * del archivo: cuales de las cuatro zonas son claras es conocimiento de la
 * convencion de Carbon, y esta es la unica frontera que la conoce. Un componente
 * que lo dedujera por su cuenta se acoplaria a unos nombres que no son nuestros.
 */
const LIGHT_ZONES: readonly ThemeZone[] = ["white", "g10"];

export function isLightZone(zone: ThemeZone): boolean {
  return LIGHT_ZONES.includes(zone);
}
