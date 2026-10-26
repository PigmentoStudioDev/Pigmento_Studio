import type { TestimonialsProps } from "@/design-system/components/organisms/Testimonials/Testimonials";

/**
 * Lo que dicen los clientes.
 *
 * Las citas se LEEN de `items.<clave>` en los diccionarios y hoy no hay ninguna: las
 * seis de antes eran maqueta firmada "Nombre Apellido" y estaban en produccion, y una
 * cita atribuida a alguien que no la dijo es una afirmacion falsa. Una clave que no
 * existe no se pinta, asi que publicar una cita real es anadir su entrada en es y en
 * en, sin tocar nada mas.
 *
 * Sin citas la seccion no se pinta: la ruta no monta el bloque con la lista vacia.
 * Son seis como maximo porque la tira corre en bucle y con menos la misma cita vuelve
 * a pasar cada pocos segundos.
 *
 * El bloque ya no tiene cabecera, asi que `title`, `label` e `intro` dejaron de
 * viajar. Las claves siguen en los dos diccionarios a proposito: la decision es de
 * composicion —las resenas se presentan solas debajo de la banda— y borrar la copia
 * obligaria a reescribirla en los dos idiomas el dia que vuelva a hacer falta.
 */
type Translate = ((key: string) => string) & { has: (key: string) => boolean };

const KEYS = ["first", "second", "third", "fourth", "fifth", "sixth"] as const;

export function getTestimonials(t: Translate): TestimonialsProps {
  return {
    testimonials: KEYS.filter((key) => t.has(`items.${key}.quote`)).map((key) => ({
      quote: t(`items.${key}.quote`),
      author: t(`items.${key}.author`),
      role: t(`items.${key}.role`),
      company: t(`items.${key}.company`),
    })),
  };
}
