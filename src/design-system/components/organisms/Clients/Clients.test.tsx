import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Clients, type ClientsProps } from "./Clients";

const PROPS: ClientsProps = {
  title: "Marcas",
  description: "Marcas con las que trabajamos.",
  clients: [
    { name: "Acme", discipline: "Branding", href: "/trabajo/acme" },
    { name: "Globex", href: "/trabajo/globex" },
  ],
  titleId: "marcas",
};

describe("Clients", () => {
  it("el titular nombra la seccion", () => {
    render(<Clients {...PROPS} />);

    expect(screen.getByRole("heading", { level: 2, name: "Marcas" })).toHaveAttribute("id", "marcas");
  });

  it("cada marca lleva a su caso con un nombre que no cambia al barajar el texto", () => {
    render(<Clients {...PROPS} />);

    expect(screen.getByRole("link", { name: "Acme, Branding" })).toHaveAttribute("href", "/trabajo/acme");
    expect(screen.getByRole("link", { name: "Globex" })).toHaveAttribute("href", "/trabajo/globex");
  });

  it("sin marcas no se monta", () => {
    const { container } = render(<Clients {...PROPS} clients={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Clients {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
