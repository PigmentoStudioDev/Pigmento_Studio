import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Los envoltorios de navegacion que conocen el idioma.
 *
 * Se usan EN LUGAR de los de next/link y next/navigation en todo lo que navegue
 * dentro del sitio: un `<Link href="/trabajo">` de Next se lleva a alguien que
 * estaba en ingles de vuelta al espanol, porque no sabe que existe un prefijo que
 * conservar. Estos lo anaden solos.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
