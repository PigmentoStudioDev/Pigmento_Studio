import type { HeroBandItem } from "@/design-system/components/molecules/HeroBand/HeroBand";
import type { HeroStatementProps } from "@/design-system/components/organisms/HeroStatement/HeroStatement";

/**
 * Piezas de la tira del hero: trabajo real de Pigmento, sacado del sitio actual
 * (pigmentostudio.com.mx). Lista fija porque el portafolio del CMS tiene hoy un solo
 * proyecto.
 *
 * El orden alterna color y tipo de pieza —empaque, papeleria, retrato, web— para que
 * dos vecinas no se lean como la misma: la tira pasa rapido y dos fondos rojos
 * seguidos se funden en una sola mancha.
 *
 * TODO(cms): cambiar a getFeaturedPieces cuando haya 8+ proyectos destacados.
 */
const PIECES = [
  "bowl-bar-helado.jpg",
  "new-deli-papeleria.jpg",
  "calderoni.jpg",
  "health-unbalance.png",
  "lotus-chocolate.jpg",
  "onyx.jpg",
  "funky-spicy-rub.png",
  "skincare-empaques.jpg",
  "ilustracion-arrecife.png",
  "palacolima-gorra.jpg",
  "pilotos-f1.png",
  "galleta-club.jpg",
  "new-deli-mostaza.jpg",
  "water-man-web.jpg",
  "bowl-bar-empaques.jpg",
  "papeleria-cafe.jpg",
];

export const HERO_PIECES: HeroBandItem[] = PIECES.map((file) => ({ src: `/hero/${file}` }));

type Translate = (key: string) => string;

/** El texto del hero. `ctaHref` lo pone la ruta: es el ancla de la llamada final. */
export function getHero(t: Translate, ctaHref: string): HeroStatementProps {
  return {
    eyebrow: t("eyebrow"),
    title: t("title"),
    titleHighlight: t("titleHighlight"),
    subtitle: t("subtitle"),
    ctaLabel: t("cta"),
    ctaHref,
    pieces: HERO_PIECES,
  };
}
