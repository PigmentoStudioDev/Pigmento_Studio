import { join } from "node:path";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import postcss from "postcss";
import { compile, type Options } from "sass";
import { afterEach, describe, expect, it } from "vitest";
import { SiteHeader, type SiteHeaderProps } from "./SiteHeader";

const PROPS: SiteHeaderProps = {
  label: "Principal",
  homeHref: "/",
  homeLabel: "Pigmento Studio, ir al inicio",
  toggleLabel: "Menu",
  groups: [
    {
      label: "Estudio",
      items: [
        { label: "Trabajo", href: "/trabajo" },
        { label: "Servicios", href: "/servicios" },
      ],
      secondary: [{ label: "Laboratorio", tag: "Pronto" }],
    },
    {
      label: "Explorar",
      items: [{ label: "Contacto", href: "/contacto" }],
    },
  ],
  actions: [{ label: "Hablemos", href: "/contacto", emphasis: "primary" }],
  banner: { href: "/estudio", title: "Como trabajamos", cta: "Verlo" },
};

const openPanel = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
};

const panel = () => document.getElementById(screen.getByRole("button", { name: "Menu" }).getAttribute("aria-controls") ?? "");

/** jsdom no desplaza nada: se mueve scrollY a mano y se emite el evento. */
const scrollTo = async (y: number) => {
  window.scrollY = y;
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
  });
};

afterEach(() => {
  window.scrollY = 0;
});

describe("SiteHeader", () => {
  it("es una navegacion con nombre: un sitio puede tener mas de una", () => {
    render(<SiteHeader {...PROPS} />);

    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();
  });

  /**
   * El logo es decorativo, asi que el nombre del enlace al inicio tiene que
   * ponerlo el enlace. Sin esto queda un enlace sin nombre — el fallo de
   * accesibilidad mas comun en una cabecera con logotipo.
   */
  it("el enlace al inicio se llama por si mismo, no por el logo", () => {
    render(<SiteHeader {...PROPS} />);

    expect(screen.getByRole("link", { name: "Pigmento Studio, ir al inicio" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("arranca cerrado", () => {
    render(<SiteHeader {...PROPS} />);

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });

  /**
   * Cerrado, el panel sigue en el DOM para poder animarse — y por eso tiene que
   * estar inerte. Sin inert, la tabulacion se mete en enlaces invisibles y el foco
   * desaparece de la pantalla sin que nadie sepa donde ha ido.
   */
  it("cerrado, el panel esta inerte", () => {
    render(<SiteHeader {...PROPS} />);

    expect(panel()).toHaveAttribute("inert");
  });

  it("abierto, el panel deja de estar inerte", async () => {
    render(<SiteHeader {...PROPS} />);

    await openPanel();

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "true");
    expect(panel()).not.toHaveAttribute("inert");
  });

  it("el boton apunta al panel que gobierna", () => {
    render(<SiteHeader {...PROPS} />);

    expect(panel()).toBeInTheDocument();
  });

  it("el panel trae los grupos con su encabezado y sus enlaces", async () => {
    render(<SiteHeader {...PROPS} />);
    await openPanel();

    const target = panel();
    if (!target) throw new Error("sin panel");

    expect(within(target).getByRole("heading", { name: "Estudio" })).toBeInTheDocument();
    expect(within(target).getByRole("link", { name: /Servicios/ })).toBeInTheDocument();
    expect(within(target).getByRole("link", { name: "Como trabajamos" })).toBeInTheDocument();
  });

  it("Escape cierra el panel", async () => {
    render(<SiteHeader {...PROPS} />);
    await openPanel();

    await userEvent.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });

  it("navegar por un enlace del panel lo cierra", async () => {
    render(<SiteHeader {...PROPS} />);
    await openPanel();

    await userEvent.click(screen.getByRole("link", { name: /Servicios/ }));

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });

  /**
   * Desplazarse cierra el panel. Sustituye al bloqueo de scroll que habia antes:
   * las dos cosas no pueden convivir, porque con el fondo bloqueado no hay evento
   * de scroll que escuchar.
   */
  it("se cierra al desplazar la pagina", async () => {
    render(<SiteHeader {...PROPS} />);
    await openPanel();

    await scrollTo(200);

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  /**
   * El rebote elastico de movil emite scroll sin que nadie se haya desplazado. Sin
   * margen, el menu se cerraria solo nada mas abrirlo — y el sintoma seria "a veces
   * no abre", que es de los que se persiguen una tarde entera.
   */
  it("un movimiento minimo no lo cierra", async () => {
    render(<SiteHeader {...PROPS} />);
    await openPanel();

    await scrollTo(2);

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("no bloquea el scroll de la pagina: eso impediria el gesto que lo cierra", async () => {
    render(<SiteHeader {...PROPS} />);
    await openPanel();

    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("las acciones son enlaces, no botones: llevan a otra pagina", () => {
    render(<SiteHeader {...PROPS} />);

    expect(screen.getByRole("link", { name: "Hablemos" })).toHaveAttribute("href", "/contacto");
  });

  /**
   * El panel cerrado tiene que medir CERO, y quien lo garantiza es que su item de
   * grid no lleve padding.
   *
   * El truco de `grid-template-rows: 0fr -> 1fr` colapsa gracias a
   * `min-block-size: 0` en el item — pero eso solo pone a cero la caja de
   * CONTENIDO. Un padding en ese mismo elemento se sigue sumando, la fila nunca
   * llega a cero y el panel cerrado empuja la placa por debajo de la barra. Paso:
   * 48px de padding estirando la cabecera, con el contenido pegado arriba.
   *
   * No se puede medir alto en jsdom, que no hace layout. Se comprueba sobre el
   * Sass compilado la propiedad estructural de la que depende el alto.
   */
  it("el item del grid que colapsa no lleva padding", () => {
    const SASS: Options<"sync"> = { loadPaths: ["node_modules"], quietDeps: true };
    const css = compile(join(__dirname, "SiteHeader.module.scss"), SASS).css;

    const offenders: string[] = [];
    postcss.parse(css).walkRules((rule) => {
      if (!/\.panelInner\b/.test(rule.selector)) return;
      rule.walkDecls(/^(padding|border(-[a-z]+)?-width|border)$|^padding-/, (decl) => {
        if (decl.value.trim() !== "0") offenders.push(`${rule.selector} { ${decl.prop}: ${decl.value} }`);
      });
    });

    expect(offenders).toEqual([]);
  });

  it.each([
    { label: "cerrado", open: false },
    { label: "abierto", open: true },
  ])("$label no tiene violaciones de accesibilidad", async ({ open }) => {
    const { container } = render(<SiteHeader {...PROPS} />);
    if (open) await openPanel();

    expect(await axe(container)).toHaveNoViolations();
  });
});
