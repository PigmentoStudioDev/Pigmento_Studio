import styles from "./ProgressiveBlur.module.scss";

/**
 * Franja de desenfoque progresivo anclada al borde superior de la ventana.
 *
 * Difumina lo que pasa por debajo de la cabecera conforme se acerca al borde, en
 * vez de taparlo con un velo: el contenido sigue viendose, solo deja de competir
 * por la atencion. Es lo que permite una barra sin fondo propio sobre un hero de
 * video sin que el titular se pierda.
 *
 * El efecto son CINCO capas superpuestas, cada una con el doble de desenfoque que
 * la anterior y su ventana un escalon mas cerca del borde. Hace falta que sean
 * cinco: `backdrop-filter` no acepta una intensidad variable, asi que un degradado
 * de desenfoque real no existe — lo que se percibe como continuo es la suma.
 *
 * Sin props y sin estado: es pintura pura, server component, y no cruza al
 * navegador. `pointer-events: none` en la hoja, asi que no intercepta un solo clic.
 */

/**
 * Las clases se nombran una a una en vez de construirse con una plantilla sobre el
 * indice. El gate de modulos comprueba estaticamente que cada clase pedida exista en
 * la hoja, y una clave calculada en runtime no la puede ver: si el nombre no
 * existiera, el mapa devuelve `undefined`, y al unir con espacios eso no escribe la
 * palabra "undefined" sino nada. La capa saldria sin desenfoque y sin un solo error.
 *
 * (El gate es literal y lee tambien los comentarios: escribir aqui un ejemplo con la
 * forma `styles.<algo>` lo cuenta como uso real y falla. Verificado en carne propia.)
 */
const LAYERS = [styles.layer1, styles.layer2, styles.layer3, styles.layer4, styles.layer5];

export function ProgressiveBlur() {
  return (
    <div aria-hidden="true" className={styles.band}>
      {LAYERS.map((layer) => (
        <div key={layer} className={[styles.layer, layer].join(" ")} />
      ))}
    </div>
  );
}
