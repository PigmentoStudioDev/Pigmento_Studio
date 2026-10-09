import type { TestimonialsProps } from "@/design-system/components/organisms/Testimonials/Testimonials";

/**
 * Lo que dicen los clientes.
 *
 * TODO(copy): **las seis citas son PLACEHOLDER y la atribucion tambien** — "Nombre
 * Apellido", igual que los placeholders del equipo en el CMS. Estan escritas con la
 * forma y el largo de una resena de verdad porque el bloque hay que poder VERLO antes
 * de tener las reales: un "texto pendiente" repetido seis veces no dice si la tira
 * funciona, dice que falta copy.
 *
 * Lo que NO llevan es firma real, y esa parte no se toca: una cita atribuida a una
 * persona que no la dijo es una afirmacion falsa sobre alguien de fuera del estudio.
 * Con "Nombre Apellido, Cargo, Empresa" a la vista, nadie las publica por error.
 * Pigmento las sustituye por citas reales con permiso de quien las firma.
 *
 * Son SEIS y no tres porque el bloque dejo de ser una rejilla y paso a ser una tira
 * que corre: con tres, la vuelta se nota y la misma cita vuelve a pasar cada pocos
 * segundos. Seis es lo que hace que parezca una lista y no un bucle.
 *
 * Sin citas publicadas la seccion no se pinta: el organismo devuelve null con la
 * lista vacia, asi que quitar este bloque del borrador es dejar el array a cero.
 */
type Translate = (key: string) => string;

const KEYS = ["first", "second", "third", "fourth", "fifth", "sixth"] as const;

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
