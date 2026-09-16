import type { HeroBandItem } from "@/design-system/components/molecules/HeroBand/HeroBand";

/**
 * Piezas de los dos heros. Lista fija porque el portafolio del CMS tiene hoy un solo
 * proyecto y los dos heros necesitan varios; sin fallback silencioso entre ambos.
 *
 * TODO(cms): cambiar a getFeaturedPieces cuando haya 8+ proyectos destacados.
 */
export const HERO_PIECES: HeroBandItem[] = Array.from({ length: 14 }, (_, i) => ({
  src: `/portfolio/${String(i + 1).padStart(2, "0")}.png`,
}));
