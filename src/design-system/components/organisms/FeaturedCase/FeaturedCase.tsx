import Image from "next/image";
import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./FeaturedCase.module.scss";

/**
 * Un caso, en profundidad, en mitad del argumento.
 *
 * La pagina enseña el trabajo UNA vez —el strip de portadas, en el primer tercio— y
 * despues argumenta durante seis secciones sin una sola imagen. Este bloque devuelve
 * el trabajo justo donde la pagina solo afirma: la comparativa dice en que se
 * diferencia el estudio y lo siguiente que se ve es un proyecto que lo demuestra.
 *
 * **No es un segundo strip.** Alli pasan dieciocho portadas y no se detiene ninguna;
 * aqui se para en uno y se ven sus piezas. Son dos formatos distintos del mismo
 * material, que es lo que hacen las homes de estudio que repiten el trabajo: nunca el
 * mismo bloque dos veces.
 *
 * **El texto es el del CMS, no uno escrito para la home.** Cada proyecto trae su
 * `summary` redactado, y ese parrafo —el reto real del encargo— argumenta mejor que
 * cualquier cosa que se escriba aqui. La prosa de una home de estudio funciona cuando
 * cuelga de un caso con nombre; suelta, se lee como relleno.
 *
 * **Sin enlace, a proposito.** La pagina de cada caso todavia no existe
 * (`TODO(rutas)` en `app/work.ts`): una llamada a un 404 es peor que ninguna. El
 * bloque es prueba, no navegacion, y se sostiene sin ella.
 *
 * El titular es el NOMBRE del cliente, no un rotulo de seccion. Es lo que nombra el
 * bloque para quien lo escucha, y un "Caso destacado" generico encima del nombre
 * seria un nivel de titulo gastado en no decir nada.
 *
 * Server component entero: lo unico que cruza al navegador es el envoltorio del gesto.
 *
 * Props serializables: cliente, disciplina, texto y piezas. 1:1 un bloque de Payload.
 */
export interface FeaturedCasePiece {
  src: string;
  width: number;
  height: number;
}

export interface FeaturedCaseProps {
  /** El nombre del caso: es el titular del bloque. */
  client: string;
  /** Ya traducida: "Branding", "Desarrollo web". */
  discipline?: string;
  /** El texto del propio proyecto, tal como esta en el CMS. */
  summary: string;
  /** Lo que se lee antes del nombre, en la voz de metadato: "El caso". */
  label: string;
  pieces: FeaturedCasePiece[];
  titleId?: string;
}

/** Lo que mide el hueco de una pieza en cada tamaño, para que no descargue de mas. */
const PIECE_SIZES = "(max-width: 42rem) 92vw, 44vw";

export function FeaturedCase({
  client,
  discipline,
  summary,
  label,
  pieces,
  titleId,
}: FeaturedCaseProps) {
  if (pieces.length === 0) return null;

  return (
    <div className={styles.root}>
      <div className={styles.text}>
        <p className={styles.label}>{label}</p>
        <Heading id={titleId} level={2}>
          {client}
        </Heading>
        {discipline ? <p className={styles.discipline}>{discipline}</p> : null}
        <p className={styles.summary}>{summary}</p>
      </div>

      {/* `inner` por lo mismo que el resto de listas: el envoltorio del gesto no puede
          meterse entre el <ul> y sus <li>. */}
      <ScrollReveal by="block" inner>
        <ul className={styles.gallery}>
          {/* La clave lleva la posicion: dos piezas pueden venir del mismo archivo. */}
          {pieces.map((piece, index) => (
            <li className={styles.piece} key={`${piece.src}-${index}`}>
              {/* Decorativas: el bloque ya esta nombrado por el cliente y descrito por
                  su texto, y describir una a una las piezas de una identidad repite lo
                  que ya se dijo. */}
              <Image
                className={styles.image}
                src={piece.src}
                alt=""
                width={piece.width}
                height={piece.height}
                sizes={PIECE_SIZES}
              />
            </li>
          ))}
        </ul>
      </ScrollReveal>
    </div>
  );
}
