"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { themeZoneClass, type ThemeZone } from "../../../theme/zone";
import { Button } from "../../atoms/Button/Button";
import { Logo } from "../../atoms/Logo/Logo";
import { NavBanner, type NavBannerProps } from "../../molecules/NavBanner/NavBanner";
import { NavLinkList, type NavLinkItem } from "../../molecules/NavLinkList/NavLinkList";
import { NavToggle } from "../../molecules/NavToggle/NavToggle";
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
}

export interface SiteHeaderAction {
  label: string;
  href: string;
  emphasis: "primary" | "secondary";
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
  const [zone, setZone] = useState<ThemeZone | undefined>(undefined);

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

    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > SCROLL_THRESHOLD);
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
        setZone(
          (hit.target.getAttribute("data-theme-section") as ThemeZone | null) ?? undefined,
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
        zone ? themeZoneClass(zone) : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Cierra al pulsar fuera. Decorativo: la via accesible de cerrar son Escape
          y el propio boton, que ya estan. */}
      <span aria-hidden="true" className={styles.backdrop} onClick={close} />

      <nav aria-label={label} className={styles.nav}>
        {/* La placa: fondo, borde y radio de la barra, en su propia capa. Separada
            del <nav> porque su geometria se mueve — se mete hacia dentro al hacer
            scroll y se abre al desplegar el panel — y si llevara el contenido, cada
            uno de esos gestos reflowaria la fila entera. */}
        <span aria-hidden="true" className={styles.plate} />

        <div ref={barRef} className={styles.bar}>
          <NavToggle open={open} controls={panelId} label={toggleLabel} onToggle={() => setOpen(!open)} />

          <Link href={homeHref} aria-label={homeLabel} className={styles.home} onClick={close}>
            <Logo compact={scrolled} />
          </Link>

          {actions?.length ? (
            <div className={styles.actions}>
              {actions.map((action) => (
                <Button
                  key={action.href}
                  href={action.href}
                  size="sm"
                  emphasis={action.emphasis === "primary" ? "primary" : "ghost"}
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
