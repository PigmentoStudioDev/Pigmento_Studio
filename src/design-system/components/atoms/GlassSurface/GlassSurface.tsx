import styles from "./GlassSurface.module.scss";

/**
 * Superficie de cristal: una lamina que cubre a su padre y difumina lo que pasa
 * por detras, con el bisel y los reflejos de un material real.
 *
 * Son SIETE capas superpuestas y ninguna sobra. Cada una aporta una propiedad
 * distinta del material — tinte, cuerpo, dos reflejos especulares, dos cantos del
 * bisel y el halo interior — y lo que las distingue no es donde estan, porque
 * todas ocupan lo mismo, sino COMO se funden con las de abajo. Un solo degradado
 * no puede imitarlo: `mix-blend-mode` no se interpola.
 *
 * Se coloca sola sobre su padre (`position: absolute; inset: 0`) y hereda su radio,
 * asi que se adapta a la forma que la contenga sin conocerla. Lo unico que pide el
 * padre es `position: relative` y su propio `border-radius`.
 *
 * Sin props y sin estado: es pintura pura, server component, y `pointer-events:
 * none` — no intercepta un solo clic de los controles que cubre.
 */

/**
 * Las capas se nombran una a una en vez de calcularse. El gate de modulos verifica
 * estaticamente que cada clase pedida exista en la hoja, y una clave construida en
 * runtime no la puede ver: si el nombre no existiera, el mapa devuelve `undefined`
 * y al unir con espacios eso no escribe nada — la capa saldria sin su mezcla, que
 * es invisible como fallo.
 */
const LAYERS = [
  styles.fill,
  styles.fillBurn,
  styles.highlightSoft,
  styles.highlightStrong,
  styles.edgeLight,
  styles.edgeDark,
  styles.innerGlow,
];

export function GlassSurface() {
  return (
    <div aria-hidden="true" className={styles.surface}>
      {LAYERS.map((layer) => (
        <div key={layer} className={layer} />
      ))}
    </div>
  );
}
