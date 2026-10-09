import { NavLinkList, type NavLinkItem } from "../NavLinkList/NavLinkList";
import styles from "./FooterDirectory.module.scss";

/**
 * El directorio del pie: la parte CONVENCIONAL de un footer, que es la que faltaba.
 *
 * El pie del sitio es una declaracion —una linea a sangre con el nombre— y eso esta
 * bien como remate, pero no hace el trabajo de un pie: quien llega al final de una
 * pagina sin encontrar lo que buscaba espera ahi el mapa entero del sitio, lo legal y
 * quien firma. Dos filas de cuatro atajos no son un mapa.
 *
 * Va ENCIMA de la linea grande, no debajo: el nombre cierra la pagina, y cualquier
 * cosa despues de un cierre se lee como un apendice.
 *
 * La estructura es la de cualquier pie de sitio serio —columnas con titulo, una
 * columna de marca con la frase del estudio, y una linea de cierre con la firma y la
 * vuelta arriba—, y no se inventa: es la que comparten los dos catalogos de bloques
 * que usamos de referencia.
 *
 * **El titulo de cada columna es un encabezado de verdad** (`h2`) y la lista va
 * nombrada por el: asi quien navega por encabezados encuentra el mapa del sitio sin
 * tener que leerlo entero, que es justo para lo que baja hasta aqui.
 *
 * La vuelta arriba es un enlace a `#top`, que es un fragmento que el navegador
 * entiende sin que exista ningun elemento con ese id — la regla esta en el HTML desde
 * siempre. Un boton con JS haria lo mismo y dejaria de funcionar en cuanto el script
 * falle, en el unico control de la pagina que no tiene alternativa.
 *
 * Props serializables: cada columna es titulo mas enlaces, que es 1:1 lo que guardaria
 * un array de una global de pie en Payload.
 */
export interface FooterColumn {
  title: string;
  links: NavLinkItem[];
}

export interface FooterDirectoryProps {
  /** El nombre que firma, con la frase corta de debajo. */
  brand: string;
  tagline: string;
  columns: FooterColumn[];
  /** Ya compuesta y traducida: "© 2026 Pigmento Studio. Todos los derechos reservados." */
  copyright: string;
  /** La etiqueta visible de la vuelta arriba. */
  backToTop: string;
}

export function FooterDirectory({
  brand,
  tagline,
  columns,
  copyright,
  backToTop,
}: FooterDirectoryProps) {
  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <p className={styles.name}>{brand}</p>
          <p className={styles.tagline}>{tagline}</p>
        </div>

        {columns.map((column, index) => {
          /**
           * El id sale de la POSICION y no del titulo. Un id derivado del texto tiene
           * que limpiar acentos para ser un id valido, y entonces "Diseño" y "Diseno"
           * dan el mismo: dos grupos con el mismo nombre accesible y uno de los dos
           * apuntando al titulo del otro. La posicion no puede colisionar.
           */
          const titleId = `pie-columna-${index}`;

          return (
            <nav className={styles.column} key={column.title} aria-labelledby={titleId}>
              <h2 className={styles.columnTitle} id={titleId}>
                {column.title}
              </h2>
              <NavLinkList direction="column" size="small" items={column.links} />
            </nav>
          );
        })}
      </div>

      <div className={styles.close}>
        <p className={styles.copyright}>{copyright}</p>
        <a className={styles.top} href="#top">
          {backToTop}
        </a>
      </div>
    </div>
  );
}

