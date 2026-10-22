import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { FinalCta, type FinalCtaProps } from "./FinalCta";

const ERRORS = {
  nameRequired: "a",
  emailRequired: "b",
  emailInvalid: "c",
  phoneInvalid: "f",
  messageRequired: "d",
  messageShort: "e",
};

const PROPS: FinalCtaProps = {
  label: "Hablemos",
  title: "Cuentanos que tienes en mente.",
  form: {
    locale: "es",
    topics: [{ value: "branding", label: "Branding" }],
    copy: {
      formLabel: "Formulario de contacto",
      name: "Nombre",
      namePlaceholder: "",
      email: "Correo",
      emailPlaceholder: "",
      phone: {
        label: "Telefono",
        country: "Pais: {country}, +{dial}",
        search: "Buscar pais o lada",
        searchPlaceholder: "Pais o lada",
        clearSearch: "Borrar busqueda",
        suggested: "Sugeridos",
        allCountries: "Todos los paises",
        noMatches: "Ningun pais coincide con {query}",
        results: "{count} paises",
        valid: "Numero valido de {country}",
      },
      topic: "Que necesitas",
      message: "Mensaje",
      messagePlaceholder: "",
      remaining: "Quedan {count}",
      submit: "Empezar la conversacion",
      sending: "Enviando",
      failure: "Fallo",
      successTitle: "Gracias, {name}",
      successText: "Recibido",
      again: "Otro",
      errors: ERRORS,
    },
  },
  onSubmit: vi.fn(),
};

describe("FinalCta", () => {
  /**
   * Una sola accion: el envio. Si volviera el enlace a /contacto junto al formulario,
   * la llamada final ofreceria dos salidas y dejaria de ser una llamada.
   */
  it("la unica accion es enviar el formulario", () => {
    render(<FinalCta {...PROPS} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByRole("form", { name: "Formulario de contacto" })).toBeInTheDocument();
  });

  it("el titular nombra la seccion", () => {
    render(<FinalCta {...PROPS} titleId="contacto" />);

    expect(screen.getByRole("heading", { name: PROPS.title })).toHaveAttribute("id", "contacto");
  });

  /**
   * EL gate de la placa. La asignacion viaja como atributos y la aplica la hoja global
   * bajo la clase de modo del documento: es lo que permite que destaque en los dos
   * modos sin cruzar al navegador a preguntar en que modo esta el sitio.
   *
   * Si el atributo desapareciera, la placa no fallaria — se pintaria del mismo color
   * que la pagina y dejaria de ser una placa, sin un solo error.
   */
  it("pide oscuro en claro y claro en oscuro, para que la hoja lo aplique", () => {
    const { container } = render(<FinalCta {...PROPS} />);

    expect(container.firstElementChild).toHaveAttribute("data-theme-light", "dark");
    expect(container.firstElementChild).toHaveAttribute("data-theme-dark", "light");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<FinalCta {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
