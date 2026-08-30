"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { getServerThemeMode, getThemeMode, subscribeThemeMode } from "../../../theme/mode";
import { resolveZone, themeZoneClass, type ThemeRole } from "../../../theme/zone";
import { Button, type ButtonEmphasis } from "../../atoms/Button/Button";
import { IconButton } from "../../atoms/IconButton/IconButton";
import type { IconName } from "../../atoms/Icon/Icon";
import { GlassSurface } from "../../atoms/GlassSurface/GlassSurface";
import { Logo } from "../../atoms/Logo/Logo";
import { NavBanner, type NavBannerProps } from "../../molecules/NavBanner/NavBanner";
import { NavLinkList, type NavLinkItem } from "../../molecules/NavLinkList/NavLinkList";
import { NavToggle } from "../../molecules/NavToggle/NavToggle";
import { LanguageToggle } from "../../molecules/LanguageToggle/LanguageToggle";
import { ThemeToggle } from "../../molecules/ThemeToggle/ThemeToggle";
import styles from "./SiteHeader.module.scss";

/**
 * La cabecera del sitio: barra fija con marca y acciones, y un panel que se
 * despliega debajo con la navegacion completa.
 *
 * Es cliente entera y no un cascaron de estado con ranuras. La alternativa —
 * dejar la cabecera en el servidor y pasar el contenido como children a un
 * envoltorio cliente — ahorraria unos pocos kilobytes de enlaces y un SVG en un
 * sitio que ya envia Carbon completo, a cambio de partir en dos un componente que
 * es interactivo de arriba abajo. No sale a cuenta, y su linea esta declarada una
 * a una en react-contract.json.
 *
 * Las props siguen siendo enteramente serializables: esta navegacion sale de una
 * global de Payload el dia que exista, sin tocar el componente.
 */
export interface SiteHeaderGroup {
  label: string;
  items: NavLinkItem[];
  /**
   * Segunda lista, mas pequena. Se ancla al PIE de la columna, no debajo de la
   * primera: asi las columnas cierran a la misma altura aunque sus listas midan
   * distinto, que es lo que hace que la fila se lea como una retmica y no como
   * tres bloques sueltos.
   */
  secondary?: NavLinkItem[];
  /** Destaca la columna como tarjeta con fondo propio. Solo una por fila. */
  featured?: boolean;
  /**
   * Fila de iconos al PIE de la columna. Mismo anclaje que `secondary` y por el
   * mismo motivo: las columnas cierran a la misma altura sea cual sea el largo de
   * sus listas, que es lo que hace que la fila se lea como una retmica.
   *
   * Va en el grupo y no en la cabecera entera porque quien decide donde cuelga es
   * la navegacion, no el componente — el dia que el CMS mueva las redes a otra
   * columna, no hay nada que tocar aqui.
   */
  socials?: SiteHeaderSocial[];
  /**
   * Muestra el conmutador de modo al pie de esta columna, junto a las redes.
   *
   * Bandera explicita y no "donde haya redes": son dos cosas distintas que hoy
   * comparten fila, y atarlas obligaria a mover una para mover la otra.
   */
  themeToggle?: SiteHeaderThemeToggle;
  /** Conmutador de idioma, al lado del de tema. */
  languageToggle?: SiteHeaderThemeToggle;
}

export interface SiteHeaderThemeToggle {
  /**
   * Nombre accesible. Dice la ACCION y no el estado — "cambiar entre claro y
   * oscuro", no "cambiar a oscuro": un nombre que depende del modo no coincidiria
   * entre servidor y cliente, porque el servidor no conoce la preferencia.
   */
  label: string;
}

export interface SiteHeaderSocial {
  /** Nombre del icono. Una cadena y no un SVG: esto sale de una global del CMS. */
  icon: IconName;
  href: string;
  /** Nombre accesible del enlace. Un icono no tiene texto del que sacarlo. */
  label: string;
}

export interface SiteHeaderAction {
  label: string;
  href: string;
  /**
   * Se pasa TAL CUAL al boton. Antes se traducia — 'secondary' salia renderizado
   * como ghost — y el tipo mentia: pedir un secundario daba un control sin borde ni
   * fondo. Nadie lo vio porque la navegacion solo usa 'primary'.
   *
   * Es el subconjunto de ButtonEmphasis que tiene sentido en la barra: un ghost
   * junto a la marca no se distingue de un enlace mas.
   */
  emphasis: Extract<ButtonEmphasis, "primary" | "secondary">;
}

export interface SiteHeaderProps {
  /** Nombre accesible del <nav>. Un sitio con dos navegaciones necesita distinguirlas. */
  label: string;
  homeHref: string;
  /** Nombre accesible del enlace al inicio: el logo es decorativo. */
  homeLabel: string;
  toggleLabel: string;
  groups: SiteHeaderGroup[];
  actions?: SiteHeaderAction[];
  banner?: NavBannerProps;
}



/** Pixeles de scroll a partir de los cuales la barra se compacta. */
const SCROLL_THRESHOLD = 50;

/**
 * Margen antes de que un desplazamiento cuente como intencion de cerrar. Existe
 * por el rebote elastico de movil, que emite scroll sin que nadie se haya movido.
 */
const CLOSE_ON_SCROLL_THRESHOLD = 4;

/**
 * Altura de scroll por debajo de la cual la barra NUNCA se esconde.
 *
 * Sobre el hero la barra tiene que estar: esconderla al primer gesto se lee como un
 * parpadeo, no como una decision. Y al volver arriba del todo reaparece sola, sin
 * depender de que alguien suba lo suficiente para disparar la direccion.
 */
const HIDE_THRESHOLD = 100;

/**
 * Movimiento minimo para que un gesto cuente como direccion. Mismo motivo que
 * CLOSE_ON_SCROLL_THRESHOLD: el rebote elastico de movil emite scroll sin que nadie
 * se haya movido, y sin margen la barra parpadearia sola al llegar a los topes.
 */
const DIRECTION_THRESHOLD = 4;

export function SiteHeader({
  label,
  homeHref,
  homeLabel,
  toggleLabel,
  groups,
  actions,
  banner,
}: SiteHeaderProps) {
  const panelId = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [role, setRole] = useState<ThemeRole | undefined>(undefined);

  // El modo se lee del store y no de un estado propio: lo cambia tambien el
  // sistema operativo y el conmutador, que estan en otras ramas del arbol. La
  // cabecera adopta el ROL de la seccion que tiene debajo, y el rol solo se
  // convierte en una zona una vez que se sabe el modo — la misma seccion es g10
  // en claro y g90 en oscuro.
  const mode = useSyncExternalStore(subscribeThemeMode, getThemeMode, getServerThemeMode);

  // Escape cierra. Va en el documento y no en el panel porque el foco puede estar
  // en cualquier sitio cuando alguien decide salir — incluido el fondo oscuro.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /**
   * Desplazarse cierra el panel.
   *
   * Sustituye al bloqueo de scroll que habia antes, y las dos cosas no podian
   * convivir: con el fondo bloqueado no hay evento de scroll que escuchar, asi que
   * o se bloquea o se cierra. Cerrar es mejor — quien empieza a desplazarse ya ha
   * dejado de mirar el menu, y bloquearle la pagina para que lo cierre a mano es
   * pedirle un paso que no queria dar.
   *
   * Se compara contra la posicion que habia AL ABRIR y con un margen, no contra
   * cualquier evento: en movil el rebote elastico dispara scroll sin que nadie se
   * haya desplazado, y el menu se cerraria solo nada mas abrirlo.
   *
   * Desplazarse DENTRO del panel no cuenta: ese scroll lo recibe el panel y no la
   * ventana, y `overscroll-behavior: contain` en su hoja impide que se encadene a
   * la pagina al llegar al final.
   */
  useEffect(() => {
    if (!open) return;

    const start = window.scrollY;

    const onScroll = () => {
      if (Math.abs(window.scrollY - start) > CLOSE_ON_SCROLL_THRESHOLD) setOpen(false);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  // La barra se compacta al empezar a bajar. El listener es pasivo y se agrupa en
  // un frame: el del origen se disparaba en cada evento de scroll.
  useEffect(() => {
    let pending = false;
    let lastY = window.scrollY;

    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > SCROLL_THRESHOLD);

        // La barra se va al bajar y vuelve al subir, para devolverle el alto de la
        // ventana al contenido. Un solo listener para los dos estados: son la misma
        // lectura del mismo scroll, y separarlos duplicaria el trabajo por frame.
        const delta = y - lastY;

        // lastY solo avanza cuando el gesto ha contado. Asi un arrastre lento va
        // acumulando hasta cruzar el margen en vez de descartarse frame a frame,
        // que es lo que dejaria la barra sorda a los desplazamientos suaves.
        if (Math.abs(delta) > DIRECTION_THRESHOLD) {
          setHidden(delta > 0 && y > HIDE_THRESHOLD);
          lastY = y;
        }

        pending = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * La cabecera adopta el tema de la seccion que tiene debajo.
   *
   * Lee `data-theme-section`, que emite Section cuando la pagina le da un tema:
   * la cabecera no conoce ninguna seccion concreta, solo el atributo. El origen
   * recorria todas las secciones en cada evento de scroll midiendo rectangulos;
   * aqui la deteccion la hace el navegador con un IntersectionObserver cuya zona
   * sensible es la franja de la barra.
   */
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-theme-section]");
    if (sections.length === 0) return;

    // La altura se MIDE de la barra en vez de repetir aqui el token de Sass: dos
    // sitios escribiendo 4rem se desincronizan en cuanto uno cambie, y el sintoma
    // seria un tema que cambia unos pixeles antes o despues de tiempo — de los que
    // se miran diez veces sin ver nada.
    const barHeight = barRef.current?.getBoundingClientRect().height ?? 0;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((entry) => entry.isIntersecting);
        if (!hit) return;
        setRole(
          (hit.target.getAttribute("data-theme-section") as ThemeRole | null) ?? undefined,
        );
      },
      // Franja de un pixel justo bajo la barra: la seccion que la cruza es la que
      // tiene debajo. Con un umbral normal ganaria la seccion mas visible, que en
      // mitad del scroll no es la de arriba del todo.
      { rootMargin: `-${barHeight}px 0px -100% 0px`, threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const close = () => setOpen(false);

  return (
    <header
      className={[
        styles.root,
        open ? styles.isOpen : undefined,
        scrolled ? styles.isScrolled : undefined,
        role ? themeZoneClass(resolveZone(mode, role)) : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Cierra al pulsar fuera. Decorativo: la via accesible de cerrar son Escape
          y el propio boton, que ya estan. */}
      <span aria-hidden="true" className={styles.backdrop} onClick={close} />

      {/* La clase va en el <nav> y no en el <header>, y no es indiferente: un
          transform convierte a su elemento en bloque contenedor de los descendientes
          `position: fixed`, y el fondo oscuro del panel es justo eso. Colgado del
          header, el fondo dejaria de medir la ventana para medir la barra.

          Sin guarda para el panel abierto, y se probo que sobra: el mismo gesto que
          retira la barra ya cierra el panel, y React agrupa los dos cambios en el
          mismo render — no existe un frame en el que la barra se vaya llevandoselo. */}
      <nav
        aria-label={label}
        className={[styles.nav, hidden ? styles.isHidden : undefined]
          .filter(Boolean)
          .join(" ")}
      >
        {/* La placa: fondo, borde y radio de la barra, en su propia capa. Separada
            del <nav> porque su geometria se mueve — se mete hacia dentro al hacer
            scroll y se abre al desplegar el panel — y si llevara el contenido, cada
            uno de esos gestos reflowaria la fila entera. */}
        {/* <div> y no <span>: la lamina de cristal son divs, y un <span> solo admite
            contenido de frase. La placa ya no pinta su propio fondo — lo pone el
            cristal, que ES la superficie. Con un fondo opaco debajo, su
            backdrop-filter difuminaria un color plano y no se veria nada. */}
        <div aria-hidden="true" className={styles.plate}>
          <GlassSurface />
        </div>

        <div ref={barRef} className={styles.bar}>
          <NavToggle open={open} controls={panelId} label={toggleLabel} onToggle={() => setOpen(!open)} />

          <Link href={homeHref} aria-label={homeLabel} className={styles.home} onClick={close}>
            {/* Sin `compact`: la marca no cambia de forma al desplazarse. La barra si
                se compacta — eso lo sigue haciendo `scrolled` — pero el logotipo se
                queda como esta. El atomo conserva su forma compacta para quien la
                necesite; lo que se retira es que la dispare el scroll. */}
            <Logo />
          </Link>

          {actions?.length ? (
            <div className={styles.actions}>
              {actions.map((action) => (
                <Button
                  key={action.href}
                  href={action.href}
                  size="md"
                  emphasis={action.emphasis}
                  onClick={close}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}

          {/* La linea que separa barra y panel. Crece de dentro hacia fuera al
              abrir, en vez de aparecer: una linea que hace fade delata que el panel
              ya estaba ahi. */}
          <span aria-hidden="true" className={styles.line} />
        </div>

        {/* inert saca el panel cerrado del orden de tabulacion sin quitarlo del DOM.
            Con `hidden` no habria transicion que animar, y sin nada los enlaces
            invisibles seguirian recibiendo el foco: la tabulacion se perderia
            dentro de un panel que nadie ve. */}
        <div id={panelId} inert={!open} className={styles.panel}>
          {/* Tres capas y ninguna sobra:
              .panel      colapsa de 0fr a 1fr y recorta
              .panelInner es el item del grid y va SIN padding
              .panelContent lleva el aire y el scroll

              El padding no puede vivir en el item del grid. `min-block-size: 0`
              afecta a la caja de CONTENIDO, asi que el padding vertical se suma
              igual y la fila de 0fr nunca llega a cero: el panel cerrado seguia
              ocupando alto y empujaba la placa por debajo de la barra. */}
          <div className={styles.panelInner}>
            <div className={styles.panelContent}>
              <div className={styles.panelRow}>
                {groups.map((group) => (
                  <div
                    key={group.label}
                    className={[styles.group, group.featured ? styles.groupFeatured : undefined]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <h2 className={styles.groupLabel}>{group.label}</h2>
                    <NavLinkList items={group.items} onNavigate={close} />

                    {group.secondary?.length ? (
                      <div className={styles.groupSecondary}>
                        <NavLinkList
                          items={group.secondary}
                          size="small"
                          label={group.label}
                          onNavigate={close}
                        />
                      </div>
                    ) : null}

                    {group.socials?.length || group.themeToggle || group.languageToggle ? (
                      <div className={styles.utilities}>
                        {group.socials?.length ? (
                          // <ul> y no una fila de enlaces sueltos: son una
                          // coleccion, y el arbol de accesibilidad anuncia cuantos
                          // hay antes de que alguien los recorra uno a uno. El
                          // conmutador se queda FUERA de la lista: no es una red.
                          <ul aria-label={group.label} className={styles.socials}>
                            {group.socials.map((social) => (
                              <li key={social.href}>
                                <IconButton
                                  href={social.href}
                                  external
                                  icon={social.icon}
                                  label={social.label}
                                  onClick={close}
                                />
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {group.themeToggle ? (
                          <ThemeToggle label={group.themeToggle.label} />
                        ) : null}

                        {group.languageToggle ? (
                          <LanguageToggle label={group.languageToggle.label} />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}

                {banner ? (
                  <div className={styles.banner}>
                    <NavBanner {...banner} onNavigate={close} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
