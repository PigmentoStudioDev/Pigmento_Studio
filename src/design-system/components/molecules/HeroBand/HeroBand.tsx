"use client";

import Image from "next/image";
import { useHeroBand } from "../../../motion/useHeroBand";
import styles from "./HeroBand.module.scss";

/**
 * Tira de fotos del hero: deriva continua y entrada escalonada desde la izquierda.
 * Los sets los pinta React; cuantos hacen falta lo mide el hook.
 */
export interface HeroBandItem {
  src: string;
}

export interface HeroBandProps {
  items: HeroBandItem[];
}

/**
 * El ancho maximo de la foto a 3:4: el techo de `$band-card-block-size-compact` (15rem)
 * por debajo de md y el de `$band-card-block-size` (22.5rem) por encima. El techo y no
 * el valor fluido, porque `sizes` no admite clamp() en todos los navegadores.
 */
const CARD_SIZES = "(max-width: 42rem) 180px, 270px";

export function HeroBand({ items }: HeroBandProps) {
  const { rootRef, trackRef, sets } = useHeroBand<HTMLDivElement, HTMLDivElement>(items.length);

  if (items.length === 0) return null;

  const cards = Array.from({ length: sets }, (_, set) =>
    items.map((item, index) => ({ key: `${set}-${index}`, src: item.src, first: set === 0 })),
  ).flat();

  return (
    <div ref={rootRef} className={styles.root}>
      <div ref={trackRef} className={styles.track}>
        {cards.map((card) => (
          <div key={card.key} className={styles.card}>
            {/* Decorativo: con alt las copias se anunciarian una y otra vez. */}
            <Image
              className={styles.image}
              src={card.src}
              alt=""
              fill
              sizes={CARD_SIZES}
              priority={card.first}
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
