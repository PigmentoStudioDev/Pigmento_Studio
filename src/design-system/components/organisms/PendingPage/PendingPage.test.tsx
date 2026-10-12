import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { PendingPage, type PendingPageProps } from "./PendingPage";

const PROPS: PendingPageProps = {
  title: "Trabajo",
  intro: "El portafolio completo todavia no esta publicado.",
  actionLabel: "Volver al inicio",
  actionHref: "/",
};

describe("PendingPage", () => {
  it("pinta el nombre de la pagina como su titular", () => {
    render(<PendingPage {...PROPS} />);

    expect(screen.getByRole("heading", { level: 1, name: "Trabajo" })).toBeInTheDocument();
  });

  /**
   * Una pagina sin salida es un callejon: quien llega aqui venia de un enlace y tiene
   * que poder seguir. Es lo unico interactivo que hay, asi que si se cae no queda nada.
   */
  it("siempre deja una salida, y es un enlace de verdad", () => {
    render(<PendingPage {...PROPS} />);

    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  });

  /** `/contacto` sale a otro sitio que el resto, y es la razon de que el destino sea prop. */
  it("el destino lo decide quien la monta", () => {
    render(
      <PendingPage
        {...PROPS}
        actionLabel="Escribenos por Instagram"
        actionHref="https://www.instagram.com/pigmento__studio"
      />,
    );

    expect(screen.getByRole("link", { name: "Escribenos por Instagram" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/pigmento__studio",
    );
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<PendingPage {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
