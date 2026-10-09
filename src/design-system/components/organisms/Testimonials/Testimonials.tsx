import { Marquee } from "../../molecules/Marquee/Marquee";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Testimonials.module.scss";

/**
 * Lo que dicen los clientes, con nombre y cargo, en una tira que corre sola.
 *
 * La pagina tenia prueba social a medias: la tira de logos dice quien confio y no
 * dice que paso despues. Un logo es permiso para mirar; una frase firmada es el
 * argumento.
 *
 * **Era una rejilla de tres citas y ahora es una tira.** Tres tarjetas quietas una al
 * lado de la otra es la forma de una diapositiva, y esta pagina venia arrastrando el
 * diagnostico de leerse como un documento. Una fila que corre dice dos cosas que la
 * rejilla no decia: que hay mas de tres, y que esto es una pagina. El gesto no es
 * nuevo —es la MISMA tira de los logos, con un tipo de contenido mas— asi que no
 * entra ni una mecanica ni un componente de cliente al bundle.
 *
 * **Con nombre, cargo y empresa, o no entra.** Una cita anonima —"un cliente del
 * sector salud"— no prueba nada y se lee como inventada, que es lo que pasa cuando
 * una web pone tres frases sin firma. Por eso los tres campos son obligatorios en el
 * tipo y no opcionales: el componente no puede pintar media atribucion.
 *
 * **Es `<blockquote>` con `<cite>` de verdad**, no un parrafo con comillas
 * tipografiadas — eso lo pinta la tira, y por eso la tarjeta vive alli: una sola
 * hoja para una sola forma de tarjeta de resena.
 *
 * **Sin comillas dibujadas.** La primera version llevaba unas grandes de adorno y el
 * gate de tipografia la tumbo: su cuerpo no salia de ninguna de las dos escalas. Tenia
 * razon — `blockquote` ya dice que esto es una cita, y el signo solo lo repetia en el
 * dibujo a cambio de un tamano inventado.
 *
 * Server component entero: lo que cruza al navegador es la tira, que ya cruzaba.
 */
export interface Testimonial {
  /** La frase, sin comillas: las pone la hoja. */
  quote: string;
  author: string;
  role: string;
  company: string;
}

export interface TestimonialsProps {
  title: string;
  /** El trozo del titular que se resalta con el scroll. */
  titleHighlight?: string;
  label: string;
  intro: string;
  testimonials: Testimonial[];
  titleId?: string;
}

/**
 * Segundos por vuelta. Lenta: una resena hay que poder LEERLA al pasar, y la tira de
 * logos —que solo hay que reconocer— corre al ritmo que trae por defecto.
 */
const SPEED = 90;

export function Testimonials({
  title,
  titleHighlight,
  label,
  intro,
  testimonials,
  titleId,
}: TestimonialsProps) {
  if (testimonials.length === 0) return null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <StripHeader title={title} titleHighlight={titleHighlight} label={label} intro={intro} titleId={titleId} />
      </div>

      {/* Sin ScrollReveal: la tira ya entra moviendose, y una entrada por scroll
          encima de un bucle es el mismo bloque animandose dos veces. */}
      <div className={styles.strip}>
        <Marquee kind="quotes" items={testimonials} speed={SPEED} />
      </div>
    </div>
  );
}
