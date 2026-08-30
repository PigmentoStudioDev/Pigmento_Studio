"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import styles from "./LanguageToggle.module.scss";

/**
 * Conmuta entre los dos idiomas del sitio.
 *
 * Es un BOTON y no dos enlaces, aunque cambiar de idioma sea navegar. Con dos
 * idiomas, uno de los dos enlaces siempre apunta a donde ya estas: un destino que
 * no lleva a ningun sitio, anunciado igual que el que si. El control dice lo que
 * hace — cambiar — y ensena a cual se va.
 *
 * `usePathname` es el de i18n y no el de next/navigation: el suyo devuelve la ruta
 * SIN el prefijo de idioma, que es justo lo que hace falta para pedir la misma
 * pagina en el otro. Con el de Next habria que recortar el prefijo a mano, y ese
 * recorte se rompe en cuanto el idioma por defecto deja de llevarlo.
 *
 * El nombre accesible dice la accion y la etiqueta visible dice el destino: quien
 * lo ve lee "EN" y sabe a donde va; quien lo escucha oye "cambiar idioma" seguido
 * del codigo.
 */
export interface LanguageToggleProps {
  label: string;
}

export function LanguageToggle({ label }: LanguageToggleProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const next = routing.locales.find((candidate) => candidate !== locale) ?? routing.defaultLocale;

  return (
    <button
      type="button"
      lang={next}
      aria-label={`${label}: ${next.toUpperCase()}`}
      onClick={() => router.replace(pathname, { locale: next })}
      className={styles.root}
    >
      {/* aria-hidden: el codigo ya va dentro del aria-label, y contarlo dos veces
          haria que se anunciara "cambiar idioma EN EN". */}
      <span aria-hidden="true">{next.toUpperCase()}</span>
    </button>
  );
}
