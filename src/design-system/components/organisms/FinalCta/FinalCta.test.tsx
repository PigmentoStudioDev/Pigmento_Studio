import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { FinalCta, type FinalCtaProps } from "./FinalCta";

const PROPS: FinalCtaProps = {
  label: "Hablemos",
  title: "Agendemos una llamada.",
  cta: "Agendar una llamada",
  href: "/contacto",
};

describe("FinalCta", () => {
  /** Un solo destino: una llamada final con dos opciones deja de ser una llamada. */
  it("ofrece un unico destino", () => {
    render(<FinalCta {...PROPS} />);

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/contacto");
  });

  it("el titular nombra la seccion", () => {
    render(<FinalCta {...PROPS} titleId="contacto" />);

    expect(screen.getByRole("heading", { name: PROPS.title })).toHaveAttribute("id", "contacto");
  });

  /**
   * EL gate de la placa. El rol viaja como atributo y lo resuelve la hoja global bajo
   * la clase de modo del documento: es lo que permite que esto se pinte invertido sin
   * cruzar al navegador a preguntar en que modo esta el sitio.
   *
   * Si el atributo desapareciera, la placa no fallaria — se pintaria del mismo color
   * que la pagina y dejaria de ser una placa, sin un solo error.
   */
  it("publica el rol invertido para que la hoja lo resuelva", () => {
    const { container } = render(<FinalCta {...PROPS} />);

    expect(container.firstElementChild).toHaveAttribute("data-theme-section", "alt");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<FinalCta {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
