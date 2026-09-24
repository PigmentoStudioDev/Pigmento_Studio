"use client";

import { getImageProps } from "next/image";
import { cursorAttributes } from "../../../motion/cursor";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { Heading } from "../../atoms/Heading/Heading";
import { useServicePreview } from "../../../motion/useServicePreview";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Services.module.scss";

/**
 * Los servicios, en una lista de filas a sangre. Al pasar por una fila, una vista
 * previa de su trabajo sigue al puntero y cada fila nueva entra en cortina.
 *
 * Cada fila es UN enlace a su servicio, y su nombre accesible es el servicio y lo que
 * incluye. "Ver servicio" es la pista visual del hover y no se anuncia: repetida en
 * cuatro enlaces seguidos solo alarga lo que ya dice el nombre.
 *
 * La vista previa es decoracion y esta fuera del arbol de accesibilidad. En tactil no
 * existe, y la pista queda siempre a la vista.
 */
export interface ServiceItem {
  name: string;
  /** Ya traducido: "Identidad, naming y sistema visual". */
  scope: string;
  href: string;
  image: { src: string; width: number; height: number };
}

export interface ServicesProps {
  title: string;
  /** El trozo del titular que se resalta con el scroll. */
  titleHighlight?: string;
  label: string;
  intro: string;
  /** La pista de cada fila, y lo que dice el cursor sobre ella: "Ver servicio". */
  cta: string;
  services: ServiceItem[];
  titleId?: string;
}

/** La caja mide 24vw, como en la referencia. */
const PREVIEW_SIZES = "24vw";

export function Services({ title, titleHighlight, label, intro, cta, services, titleId }: ServicesProps) {
  const rootRef = useServicePreview<HTMLDivElement>();

  if (services.length === 0) return null;

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.header}>
        <StripHeader title={title} titleHighlight={titleHighlight} label={label} intro={intro} titleId={titleId} />
      </div>

      {/* Las filas entran como el resto de la pagina, una detras de otra: con solo la
          cabecera animada, la lista aparecia de golpe debajo de ella. `inner` porque
          el envoltorio no puede meterse dentro del <ul>. */}
      <ScrollReveal by="block" inner>
        <ul className={styles.list} data-preview-list="">
          {services.map((service) => (
            <li key={service.href + service.name} className={styles.row} data-preview-row="">
              <a className={styles.link} href={service.href} {...cursorAttributes("scramble", cta)}>
                {/* El titular es el atomo, como en el resto del sistema; la caja solo
                    reparte el ancho de la fila. */}
                <div className={styles.name}>
                  <Heading level={3} size="title">
                    {service.name}
                  </Heading>
                </div>
                {/* Sin el espacio, el nombre del enlace sale "BrandingIdentidad". */}{" "}
                <span className={styles.scope}>{service.scope}</span>
                <span className={styles.cta} aria-hidden="true">
                  {cta}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </ScrollReveal>

      {/* Precargadas como en la referencia: la capa usa la que el navegador ya bajo. */}
      <div className={styles.medias} aria-hidden="true" data-preview-media="">
        {services.map((service) => {
          const { props } = getImageProps({
            src: service.image.src,
            width: service.image.width,
            height: service.image.height,
            alt: "",
            sizes: PREVIEW_SIZES,
          });

          // <img> con las props que calcula next/image, y no <Image>: el hook lee
          // `currentSrc` para copiarlo a la capa, y necesita el elemento tal cual.
          // eslint-disable-next-line @next/next/no-img-element
          return <img key={service.href + service.name} {...props} alt="" />;
        })}
      </div>

      <div className={styles.container} aria-hidden="true" data-preview-container="" />
    </div>
  );
}
