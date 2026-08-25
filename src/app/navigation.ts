import type { SiteHeaderProps } from "@/design-system/components/organisms/SiteHeader/SiteHeader";

/**
 * El contenido de la navegacion. Vive en app/ y no en el design system porque es
 * contenido del sitio, no una pieza reutilizable — y el contrato de modularidad
 * exige que el DS pueda salir de este repo sin arrastrar las rutas de la app.
 *
 * Es la forma exacta que tendra que devolver la global de navegacion de Payload:
 * datos planos, sin nodos de React. El dia que exista, este archivo pasa a ser una
 * consulta y SiteHeader no se entera.
 */
export const NAVIGATION: SiteHeaderProps = {
  label: "Principal",
  homeHref: "/",
  homeLabel: "Pigmento Studio, ir al inicio",
  toggleLabel: "Menu",
  groups: [
    {
      label: "Estudio",
      featured: true,
      items: [
        { label: "Trabajo", href: "/trabajo" },
        { label: "Servicios", href: "/servicios" },
        { label: "Nosotros", href: "/nosotros" },
      ],
      secondary: [{ label: "Laboratorio", tag: "Pronto" }],
    },
    {
      label: "Explorar",
      items: [
        { label: "Design system", href: "/ds" },
        { label: "Contacto", href: "/contacto" },
      ],
    },
  ],
  actions: [{ label: "Hablemos", href: "/contacto", emphasis: "primary" }],

  // La tercera columna del panel. En la referencia es una pieza promocional fija —
  // no una lista mas — y por eso el componente es otro: no tiene enlaces sueltos,
  // toda la tarjeta lleva a un solo sitio.
  banner: {
    href: "/trabajo",
    title: "Ultimo caso publicado",
    cta: "Ver el trabajo",
    tags: ["Destacado"],
  },
};
