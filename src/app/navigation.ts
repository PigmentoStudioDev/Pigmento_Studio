import type { SiteHeaderProps } from "@/design-system/components/organisms/SiteHeader/SiteHeader";

/**
 * El contenido de la navegacion. Vive en app/ y no en el design system porque es
 * contenido del sitio, no una pieza reutilizable — y el contrato de modularidad
 * exige que el DS pueda salir de este repo sin arrastrar las rutas de la app.
 *
 * Es una FUNCION del traductor y no una constante desde que hay dos idiomas. Sigue
 * devolviendo la forma exacta que tendra la global de navegacion de Payload: datos
 * planos, sin nodos de React. El dia que exista, esto pasa a ser una consulta y
 * SiteHeader no se entera.
 *
 * Las RUTAS no se traducen y los ICONOS tampoco: una ruta es una direccion y un
 * icono es un dibujo. Lo unico que cambia de idioma son las cadenas que alguien lee.
 */
type Translate = (key: string) => string;

export function getNavigation(t: Translate): SiteHeaderProps {
  return {
    label: t("label"),
    homeHref: "/",
    homeLabel: t("homeLabel"),
    toggleLabel: t("toggleLabel"),
    groups: [
      {
        label: t("estudio.label"),
        featured: true,
        items: [
          { label: t("estudio.trabajo"), href: "/trabajo" },
          { label: t("estudio.servicios"), href: "/servicios" },
          { label: t("estudio.nosotros"), href: "/nosotros" },
        ],
        secondary: [{ label: t("estudio.laboratorio"), tag: t("estudio.pronto") }],
      },
      {
        label: t("servicios.label"),
        items: [
          { label: t("servicios.motion"), href: "/servicios/motion" },
          { label: t("servicios.marketing"), href: "/servicios/marketing" },
          { label: t("servicios.web"), href: "/servicios/web-development" },
        ],
        // Al pie de esta columna. El nombre accesible dice la red Y que abre fuera:
        // el enlace lleva target="_blank", y un destino que cambia de pestana sin
        // avisar desorienta a quien no ve que la ventana cambio.
        socials: [
          { icon: "instagram", href: "https://www.instagram.com/pigmento__studio", label: t("social.instagram") },
          { icon: "facebook", href: "https://www.facebook.com/pigmentostudiomx/", label: t("social.facebook") },
          { icon: "behance", href: "https://www.behance.net/pigmentostudio1", label: t("social.behance") },
        ],
        themeToggle: { label: t("themeToggle") },
        languageToggle: { label: t("languageToggle") },
      },
    ],
    actions: [{ label: t("cta"), href: "/contacto", emphasis: "primary" }],

    // La tercera columna del panel. En la referencia es una pieza promocional fija —
    // no una lista mas — y por eso el componente es otro: no tiene enlaces sueltos,
    // toda la tarjeta lleva a un solo sitio.
    banner: {
      href: "/trabajo",
      title: t("banner.title"),
      cta: t("banner.cta"),
      tags: [t("banner.tag")],

      /**
       * El escaparate giratorio del pie de la tarjeta.
       *
       * Las medidas van una a una y no como un tamano comun porque NO lo son: las
       * piezas van de 477 a 796 de alto. next/image las necesita para reservar el
       * hueco antes de descargarlas, y darle una medida inventada haria saltar el
       * panel al llegar cada archivo.
       *
       * Son las catorce, una vez. El efecto de referencia las repite dos veces para
       * cerrar el circulo, pero alli la corona ocupa la pantalla; aqui, con las
       * miniaturas a 30cqw, veintiocho se solapan — el arco da para unas
       * veinticinco. Si se quieren mas piezas, la palanca es abrir la rueda, no
       * repetir la lista.
       */
      gallery: [
      { src: "/portfolio/01.png", width: 522, height: 522 },
      { src: "/portfolio/02.png", width: 522, height: 715 },
      { src: "/portfolio/03.png", width: 521, height: 737 },
      { src: "/portfolio/04.png", width: 521, height: 690 },
      { src: "/portfolio/05.png", width: 516, height: 775 },
      { src: "/portfolio/06.png", width: 520, height: 601 },
      { src: "/portfolio/07.png", width: 521, height: 715 },
      { src: "/portfolio/08.png", width: 521, height: 477 },
      { src: "/portfolio/09.png", width: 523, height: 605 },
      { src: "/portfolio/10.png", width: 523, height: 753 },
      { src: "/portfolio/11.png", width: 521, height: 631 },
      { src: "/portfolio/12.png", width: 509, height: 718 },
      { src: "/portfolio/13.png", width: 520, height: 796 },
      { src: "/portfolio/14.png", width: 518, height: 688 },
      ],
    },
  };
}
