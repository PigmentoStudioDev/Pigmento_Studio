import type { TestimonialsProps } from "@/design-system/components/organisms/Testimonials/Testimonials";

/**
 * Lo que dicen los clientes.
 *
 * TODO(copy): **las tres citas son PLACEHOLDER y la atribucion tambien** — "Nombre
 * Apellido", igual que los placeholders del equipo en el CMS. No llevan nombre ni
 * empresa reales a proposito: una cita firmada por una persona que no la dijo es una
 * afirmacion falsa sobre alguien de fuera del estudio, y eso no se escribe ni como
 * relleno temporal. Pigmento las sustituye por citas reales con permiso de quien las
 * firma.
 *
 * Sin citas publicadas la seccion no se pinta: el organismo devuelve null con la
 * lista vacia, asi que quitar este bloque del borrador es dejar el array a cero.
 */
type Translate = (key: string) => string;

const KEYS = ["first", "second", "third"] as const;

export function getTestimonials(t: Translate): TestimonialsProps {
  return {
    title: t("title"),
    titleHighlight: t("titleHighlight"),
    label: t("label"),
    intro: t("intro"),
    testimonials: KEYS.map((key) => ({
      quote: t(`items.${key}.quote`),
      author: t(`items.${key}.author`),
      role: t(`items.${key}.role`),
      company: t(`items.${key}.company`),
    })),
  };
}
