import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Testimonials.module.scss";

/**
 * Lo que dicen los clientes, con nombre y cargo.
 *
 * La pagina tenia prueba social a medias: la tira de logos dice quien confio y no
 * dice que paso despues. Un logo es permiso para mirar; una frase firmada es el
 * argumento.
 *
 * **Con nombre, cargo y empresa, o no entra.** Una cita anonima —"un cliente del
 * sector salud"— no prueba nada y se lee como inventada, que es lo que pasa cuando
 * una web pone tres frases sin firma. Por eso los tres campos son obligatorios en el
 * tipo y no opcionales: el componente no puede pintar media atribucion.
 *
 * **Es `<blockquote>` con `<cite>` de verdad**, no un parrafo con comillas tipografiadas.
 * La cita y su fuente son una relacion que el navegador ya sabe expresar, y quien
 * escucha la pagina oye donde empieza y acaba lo citado.
 *
 * **Sin comillas dibujadas.** La primera version llevaba unas grandes de adorno y el
 * gate de tipografia la tumbo: su cuerpo no salia de ninguna de las dos escalas. Tenia
 * razon — `blockquote` ya dice que esto es una cita, y el signo solo lo repetia en el
 * dibujo a cambio de un tamano inventado.
 *
 * Server component entero: lo que cruza al navegador es el envoltorio del gesto.
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

      {/* `inner`: el envoltorio del gesto no puede meterse entre el <ul> y sus <li>. */}
      <ScrollReveal by="block" inner>
        <ul className={styles.list}>
          {/* La clave lleva la POSICION y no solo la atribucion: dos citas pueden venir
              firmadas igual —la misma persona dice dos cosas, o los placeholders
              comparten nombre— y React avisa de claves repetidas y puede omitir una de
              las dos. Es la misma clave que usa la fila del equipo. */}
          {testimonials.map((testimonial, index) => (
            <li className={styles.item} key={`${testimonial.author}-${index}`}>
              <figure className={styles.card}>
                <blockquote className={styles.quote}>
                  <p className={styles.text}>{testimonial.quote}</p>
                </blockquote>

                <figcaption className={styles.author}>
                  <cite className={styles.name}>{testimonial.author}</cite>
                  <span className={styles.role}>
                    {testimonial.role}, {testimonial.company}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </ScrollReveal>
    </div>
  );
}
