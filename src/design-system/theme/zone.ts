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
