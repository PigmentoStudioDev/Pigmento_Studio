import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { SiteFooter, type SiteFooterProps } from "./SiteFooter";

const PROPS: SiteFooterProps = {
  metaLabel: "Atajos",
  meta: [{ label: "Pigmento Studio®", plain: true }, { label: "Trabajo", href: "/trabajo" }],
  handle: {
    label: "@pigmento__studio",
    href: "https://www.instagram.com/pigmento__studio",
    name: "Pigmento Studio en Instagram (abre en una pestaña nueva)",
    external: true,
  },
  linksLabel: "Redes",
  links: [
    { label: "Behance", href: "https://www.behance.net/pigmentostudio1", external: true },
    { label: "Ciudad de México", plain: true },
  ],
};

describe("SiteFooter", () => {
  /**
   * El pie es un landmark, y solo lo es si el <footer> no esta anidado en section,
   * article, aside ni nav. Por eso lo monta el layout directamente y no un Section
   * como al resto de organismos: envuelto, este mismo markup deja de ser
   * contentinfo sin que nada falle.
   */
  it("es el landmark del pie", () => {
    render(<SiteFooter {...PROPS} />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  /**
   * Cada entrada aparece UNA vez. Hubo una capa duplicada encima que repetia el pie
   * entero para revelarlo con el puntero, y con ella cada enlace existia dos veces
   * en el DOM.
   */
  it("no repite ninguna entrada", () => {
    const { container } = render(<SiteFooter {...PROPS} />);

    expect(screen.getAllByRole("link", { name: /Behance/ })).toHaveLength(1);
    expect(container.querySelectorAll("a[href*='behance']")).toHaveLength(1);
  });

  /**
   * El nombre accesible dice la red Y que abre fuera. Un destino que cambia de
   * pestana sin avisar desorienta a quien no ve que la ventana cambio.
   */
  it("el enlace externo anuncia que abre fuera", () => {
    render(<SiteFooter {...PROPS} />);

    const handle = screen.getByRole("link", { name: PROPS.handle.name });

    expect(handle).toHaveAttribute("target", "_blank");
    expect(handle).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<SiteFooter {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
