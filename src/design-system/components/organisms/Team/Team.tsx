"use client";

import Image from "next/image";
import {
  MOMENTUM_TARGET,
  useMomentumHover,
} from "../../../motion/useMomentumHover";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Team.module.scss";

/**
 * Quien esta detras del estudio: retrato, nombre y oficio.
 *
 * El gesto es lo que lo distingue de una rejilla de fotos. El puntero EMPUJA los
 * retratos al cruzarlos: la velocidad con la que se entra en uno se convierte en su
 * velocidad inicial, y la pieza sale despedida y vuelve frenando sola. Pasar despacio
 * apenas los mueve; cruzar rapido deja media fila volviendo a su sitio.
 *
 * **El nombre y el oficio NO vuelan.** Solo la foto. Son la unica informacion del
 * bloque y un texto que se mueve cada vez que el raton pasa cerca deja de poder
 * leerse — que es justo lo que el bloque viene a contar.
 *
 * Props serializables: la lista es un campo `array` de Payload 1:1, y el dia que el
 * equipo cambie no se toca este archivo.
 */
export interface TeamMember {
  name: string;
  role: string;
  photo: { src: string; width: number; height: number };
}

export interface TeamProps {
  title: string;
  label: string;
  intro: string;
  members: TeamMember[];
  titleId?: string;
}

export function Team({ title, label, intro, members, titleId }: TeamProps) {
  const rootRef = useMomentumHover<HTMLDivElement>();

  return (
    <div ref={rootRef} className={styles.root}>
      <StripHeader
        title={title}
        label={label}
        intro={intro}
        titleId={titleId}
      />

      {/* Los retratos entran escalonados, no la rejilla de golpe: `inner` hace que el
          grupo sean las celdas y no la lista, porque un <div> dentro de un <ul> no es
          HTML valido y romperia la lista para quien la escucha. */}
      <ScrollReveal by="block" inner>
        <ul className={styles.grid}>
          {members.map((member, index) => (
            // El indice entra en la clave porque un nombre NO es un identificador: dos
            // personas pueden llamarse igual, y mientras el equipo sea de marcadores de
            // posicion se llaman igual las cinco. Con el nombre solo, React ve cinco
            // hijos con la misma clave y puede duplicar u omitir sin avisar.
            <li key={`${member.name}-${index}`} className={styles.member}>
              {/*
              El marco escucha y la tarjeta vuela. Son dos elementos y no uno: si el
              que escucha fuera el que se mueve, apartarse del puntero contaria como
              salir —y volver a entrar— y la foto se quedaria rebotando sola.
            */}
              <div className={styles.frame}>
                <div className={styles.card} {...{ [MOMENTUM_TARGET]: "" }}>
                  <Image
                    className={styles.photo}
                    src={member.photo.src}
                    alt={member.name}
                    width={member.photo.width}
                    height={member.photo.height}
                    // Cinco columnas en pantalla ancha y una en movil: sin esta pista,
                    // next/image sirve la variante del ancho del contenedor y descarga
                    // de mas en cada retrato.
                    sizes="(max-width: 671px) 100vw, 20vw"
                  />
                </div>
              </div>

              <p className={styles.name}>{member.name}</p>
              <p className={styles.role}>{member.role}</p>
            </li>
          ))}
        </ul>
      </ScrollReveal>
    </div>
  );
}
