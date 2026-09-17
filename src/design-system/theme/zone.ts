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
 * El tono de una superficie: claro u oscuro. Tiene los mismos dos valores que el modo,
 * pero no dice lo mismo — el modo es lo que ELIGE quien visita; el tono es lo que una
 * seccion PIDE en cada modo.
 */
export type ThemeTone = "light" | "dark";

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
 * La zona de Carbon de cada tono. Tambien es la que carga el DOCUMENTO en cada modo:
 * un sitio en oscuro es una pagina de tono oscuro.
 *
 * El modo no es un vocabulario nuevo ni un atributo propio: es cual de las cuatro
 * zonas lleva <html>. Asi el mecanismo sigue siendo entero el de Carbon — una de
 * sus clases, en la raiz — y no hay una segunda forma de tematizar conviviendo con
 * la suya. g10 y g90 quedan fuera de la asignacion y disponibles por su clase.
 */
const TONE_ZONE: Record<ThemeTone, ThemeZone> = {
  light: "white",
  dark: "g100",
};

export function themeModeClass(mode: ThemeMode): string {
  return themeZoneClass(TONE_ZONE[mode]);
}

/** La zona de una superficie en un modo: la asignada, o la del sitio si no hay. */
export function resolveZone(mode: ThemeMode, assignment?: ThemeAssignment): ThemeZone {
  return TONE_ZONE[assignment?.[mode] ?? mode];
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
  return value === "light" || value === "dark" ? value : undefined;
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
