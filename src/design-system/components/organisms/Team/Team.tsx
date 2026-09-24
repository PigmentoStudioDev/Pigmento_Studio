"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { cursorAttributes } from "../../../motion/cursor";
import { useRosterSlider } from "../../../motion/useRosterSlider";
import { IconButton } from "../../atoms/IconButton/IconButton";
import type { IconName } from "../../atoms/Icon/Icon";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { ControlBar } from "../../molecules/ControlBar/ControlBar";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Team.module.scss";

/**
 * Quien esta detras del estudio, filtrado por area y en una fila que se recorre.
 *
 * A la izquierda, las areas y la pastilla de flechas; a la derecha, tarjetas del mismo
 * tamano. La persona activa es la unica a color completo: la tarjeta nunca crece, asi
 * que el color es todo el estado. Flechas, teclado y arrastre mueven el mismo indice.
 *
 * La foto abre un panel encima con el oficio y la bio. El foco entra en el al abrirse y
 * vuelve a la foto al cerrarlo con Escape o con su boton: quien navega con teclado no
 * puede quedarse en un sitio que acaba de desaparecer.
 *
 * Props serializables: los miembros los trae el CMS tal cual, y los textos son plantillas
 * con huecos (`{name}`, `{network}`) que se rellenan por tarjeta.
 */
export type TeamGroup = "direccion" | "diseno" | "desarrollo" | "estrategia";
export type TeamNetwork = "linkedin" | "instagram" | "behance" | "x" | "web";

export interface TeamMember {
  name: string;
  role: string;
  group: TeamGroup;
  bio?: string;
  photo: { src: string; width: number; height: number };
  links: { network: TeamNetwork; url: string }[];
}

export interface TeamLabels {
  groups: Record<TeamGroup | "all", string>;
  /** El nombre del grupo de areas. */
  filter: string;
  previous: string;
  next: string;
  /** Plantilla con `{name}`: el nombre del boton que abre el panel de cada persona. */
  open: string;
  close: string;
  /** Plantilla con `{name}` y `{network}`: el nombre de cada enlace a una red. */
  link: string;
  networks: Record<TeamNetwork, string>;
  /** El nombre de la fila, que dice ademas como se recorre. */
  roster: string;
  /** Lo que dice el cursor sobre la fila: el gesto, en imperativo. */
  drag: string;
}

export interface TeamProps {
  title: string;
  /** El trozo del titular que se resalta con el scroll. */
  titleHighlight?: string;
  label: string;
  intro: string;
  members: TeamMember[];
  labels: TeamLabels;
  titleId?: string;
}

type Filter = TeamGroup | "all";

/** El orden de las areas en la columna. Fijo: el de los datos depende de quien entro antes. */
const GROUPS: TeamGroup[] = ["direccion", "diseno", "desarrollo", "estrategia"];

const NETWORK_ICONS: Record<TeamNetwork, IconName> = {
  linkedin: "linkedin",
  instagram: "instagram",
  behance: "behance",
  x: "x",
  web: "globe",
};

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

export function Team({ title, titleHighlight, label, intro, members, labels, titleId }: TeamProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const idBase = useId();

  const visible = filter === "all" ? members : members.filter((member) => member.group === filter);
  const filters: Filter[] = ["all", ...GROUPS.filter((group) => members.some((member) => member.group === group))];

  const { viewportRef, index, dragPx, dragging, go, reset, handlers } = useRosterSlider<HTMLDivElement>(
    visible.length,
  );

  // Los botones que abren cada panel, para devolverles el foco al cerrar.
  const openers = useRef(new Map<number, HTMLButtonElement>());
  const cardsRef = useRef(new Map<number, HTMLLIElement>());

  const close = (returnFocus: boolean) => {
    const opener = openIndex === null ? undefined : openers.current.get(openIndex);
    setOpenIndex(null);
    if (returnFocus) opener?.focus();
  };

  // Escape y el clic fuera se escuchan en el documento mientras hay un panel abierto:
  // el foco puede estar en cualquier sitio de la tarjeta, o fuera de ella.
  useEffect(() => {
    if (openIndex === null) return;

    const card = cardsRef.current.get(openIndex);
    card?.querySelector<HTMLElement>("[data-team-close] button, [data-team-close] a")?.focus();

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenIndex(null);
      openers.current.get(openIndex)?.focus();
    };
    const onPointer = (event: globalThis.PointerEvent) => {
      if (card && event.target instanceof Node && card.contains(event.target)) return;
      setOpenIndex(null);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [openIndex]);

  const choose = (next: Filter) => {
    setFilter(next);
    setOpenIndex(null);
    reset();
  };

  // Numeros puros; las unidades las pone la hoja.
  const trackStyle = { "--pg-roster-index": index, "--pg-roster-drag": dragPx } as CSSProperties;

  return (
    <div className={styles.root}>
      <StripHeader title={title} titleHighlight={titleHighlight} label={label} intro={intro} titleId={titleId} />

      <ScrollReveal by="block">
        <div className={styles.body}>
          <div className={styles.rail}>
            <div role="group" aria-label={labels.filter} className={styles.filters}>
              {filters.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={styles.chip}
                  aria-pressed={option === filter}
                  onClick={() => choose(option)}
                >
                  {labels.groups[option]}
                </button>
              ))}
            </div>

            <ControlBar>
              {/* La flecha es una sola y apunta a la derecha: la de atras es la misma
                  reflejada, en un envoltorio para no pisar la escala del gesto de pulsar. */}
              <span className={styles.previous}>
                <IconButton icon="arrow" label={labels.previous} disabled={index === 0} onClick={() => go(-1)} />
              </span>
              <IconButton
                icon="arrow"
                label={labels.next}
                emphasis="primary"
                disabled={index >= visible.length - 1}
                onClick={() => go(1)}
              />
            </ControlBar>
          </div>

          <div
            ref={viewportRef}
            role="group"
            aria-label={labels.roster}
            tabIndex={0}
            className={styles.viewport}
            data-dragging={dragging ? "true" : undefined}
            {...cursorAttributes("drag", labels.drag)}
            {...handlers}
          >
            {/* La clave cambia con el area: la fila nueva entra desde cero, con su gesto
                de entrada, en vez de reordenar la anterior debajo del ojo. */}
            <ul key={filter} className={styles.track} style={trackStyle}>
              {visible.map((member, position) => {
                const panelId = `${idBase}-${position}`;
                const isOpen = openIndex === position;

                return (
                  <li
                    key={`${member.name}-${position}`}
                    ref={(node) => {
                      if (node) cardsRef.current.set(position, node);
                      else cardsRef.current.delete(position);
                    }}
                    className={styles.card}
                    style={{ "--pg-roster-card-index": position } as CSSProperties}
                    aria-current={position === index ? "true" : undefined}
                    data-open={isOpen ? "true" : undefined}
                  >
                    <div className={styles.shot}>
                      <Image
                        className={styles.photo}
                        src={member.photo.src}
                        alt={member.name}
                        width={member.photo.width}
                        height={member.photo.height}
                        draggable={false}
                        // Dos tarjetas y media en pantalla ancha y una en movil.
                        sizes="(max-width: 671px) 90vw, 35vw"
                      />
                      <button
                        type="button"
                        ref={(node) => {
                          if (node) openers.current.set(position, node);
                          else openers.current.delete(position);
                        }}
                        className={styles.open}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        aria-label={fill(labels.open, { name: member.name })}
                        onClick={() => setOpenIndex(isOpen ? null : position)}
                      />
                      <div
                        id={panelId}
                        className={styles.panel}
                        aria-hidden={isOpen ? undefined : true}
                        inert={!isOpen}
                      >
                        <span className={styles.closeButton} data-team-close="">
                          <IconButton icon="close" label={labels.close} onClick={() => close(true)} />
                        </span>
                        <p className={styles.panelName}>{member.name}</p>
                        <p className={styles.panelRole}>{member.role}</p>
                        {member.bio ? <p className={styles.panelBio}>{member.bio}</p> : null}
                      </div>
                    </div>

                    <div className={styles.foot}>
                      <div className={styles.id}>
                        <p className={styles.name}>{member.name}</p>
                        <p className={styles.role}>{member.role}</p>
                      </div>
                      {member.links.length > 0 ? (
                        <div className={styles.links}>
                          {member.links.map((link) => (
                            <IconButton
                              key={`${link.network}-${link.url}`}
                              icon={NETWORK_ICONS[link.network]}
                              href={link.url}
                              external
                              label={fill(labels.link, { name: member.name, network: labels.networks[link.network] })}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
