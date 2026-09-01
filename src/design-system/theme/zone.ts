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
 * El papel que juega una seccion DENTRO de su modo, que es lo que una pagina
 * declara. No dice un color: dice si es el fondo de la pagina o una franja que se
 * despega de el.
 *
 * Es relativo a proposito. Una seccion que declarase una zona literal — `g100` —
 * mentiria en cuanto existiera el modo claro: la prop diria una cosa y el CSS
 * pintaria otra. Un rol es cierto en los dos modos.
 */
export type ThemeRole = "base" | "alt";

/**
 * La zona que carga el DOCUMENTO en cada modo.
 *
 * El modo no es un vocabulario nuevo ni un atributo propio: es cual de las cuatro
 * zonas lleva <html>. Asi el mecanismo sigue siendo entero el de Carbon — una de
 * sus clases, en la raiz — y no hay una segunda forma de tematizar conviviendo con
 * la suya.
 */
const MODE_ZONE: Record<ThemeMode, ThemeZone> = {
  light: "white",
  dark: "g100",
};

export function themeModeClass(mode: ThemeMode): string {
  return themeZoneClass(MODE_ZONE[mode]);
}

/**
 * El par de zonas de cada modo. `base` es la del documento y `alt` la que se
 * despega de ella.
 *
 * `alt` es la zona INVERTIDA, no un escalon: en modo claro una franja alt sale
 * oscura y en oscuro sale clara. Antes era un escalon suave —g10 en claro, g90 en
 * oscuro— y eso hacia que dos secciones seguidas se distinguieran por un gris de
 * diferencia que en una pantalla mal calibrada no existe. Un rol que solo se ve en
 * un monitor bueno no esta separando nada.
 *
 * Y es simetrico a proposito. El rol tiene que querer decir lo mismo en los dos
 * modos: con la inversion en claro y el escalon en oscuro, `alt` seria un corte
 * duro o un matiz segun donde caiga, y la pagina que lo usa no puede saber cual le
 * va a tocar.
 *
 * Las cuatro zonas de Carbon se siguen emitiendo; lo que cambia es cuales ata un
 * rol. g10 y g90 quedan disponibles para quien las pida por su clase.
 */
const ROLE_ZONE: Record<ThemeMode, Record<ThemeRole, ThemeZone>> = {
  light: { base: "white", alt: "g100" },
  dark: { base: "g100", alt: "white" },
};

export function resolveZone(mode: ThemeMode, role: ThemeRole): ThemeZone {
  return ROLE_ZONE[mode][role];
}

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
