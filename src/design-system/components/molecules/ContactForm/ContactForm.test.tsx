import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { ContactForm, type ContactFormProps } from "./ContactForm";
import { validateContact } from "./validate";

const PROPS: ContactFormProps = {
  locale: "es",
  topics: [
    { value: "branding", label: "Branding" },
    { value: "web", label: "Desarrollo web" },
  ],
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
    remaining: "Quedan {count} caracteres",
    submit: "Empezar la conversacion",
    sending: "Enviando",
    failure: "No pudimos enviar tu mensaje.",
    successTitle: "Gracias, {name}",
    successText: "Recibimos tu mensaje.",
    again: "Escribir otro mensaje",
    errors: {
      nameRequired: "Escribe tu nombre",
      emailRequired: "Escribe tu correo",
      emailInvalid: "Correo invalido",
      phoneInvalid: "Revisa el numero",
      messageRequired: "Cuentanos",
      messageShort: "Mas detalle",
    },
  },
};

const MESSAGE = "Queremos rehacer la identidad para marzo.";

function fill() {
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana Torres" } });
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@empresa.com" } });
  fireEvent.change(screen.getByLabelText("Mensaje"), { target: { value: MESSAGE } });
}

const submit = () => fireEvent.click(screen.getByRole("button", { name: PROPS.copy.submit }));

describe("validateContact", () => {
  it("nombra el error de cada campo", () => {
    expect(validateContact({ name: " ", email: "ana@", phone: "+52551", message: "hola" })).toEqual({
      name: "nameRequired",
      email: "emailInvalid",
      phone: "phoneInvalid",
      message: "messageShort",
    });
  });

  it("un mensaje valido no tiene errores", () => {
    expect(validateContact({ name: "Ana", email: "ana@empresa.com", phone: "", message: MESSAGE })).toEqual({});
  });
});

describe("ContactForm", () => {
  /** Antes del primer envio no se rine a nadie por un campo a medio escribir. */
  it("los errores aparecen al enviar y el foco va al primero", () => {
    render(<ContactForm {...PROPS} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    submit();

    expect(screen.getByText("Escribe tu nombre")).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText("Nombre")).toHaveFocus();
  });

  it("envia el mensaje con el tema elegido y confirma con el nombre de pila", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ContactForm {...PROPS} onSubmit={onSubmit} />);
    fill();
    fireEvent.change(screen.getByLabelText("Telefono"), { target: { value: "5512345678" } });
    fireEvent.click(screen.getByRole("radio", { name: "Desarrollo web" }));

    submit();

    expect(await screen.findByRole("heading", { name: "Gracias, Ana" })).toHaveFocus();
    expect(onSubmit).toHaveBeenCalledWith({ name: "Ana Torres", email: "ana@empresa.com", phone: "+525512345678", topic: "web", message: MESSAGE });
  });

  /** Un envio fallido no puede tirar lo que la persona escribio. */
  it("si el envio falla se queda el formulario con lo escrito y un aviso", async () => {
    render(<ContactForm {...PROPS} onSubmit={vi.fn().mockRejectedValue(new Error("red"))} />);
    fill();

    submit();

    await waitFor(() => expect(screen.getByText(PROPS.copy.failure)).toBeInTheDocument());
    expect(screen.getByLabelText("Mensaje")).toHaveValue(MESSAGE);
  });

  /** Sin destino no hay boton: un formulario que finge enviar es peor que ninguno. */
  it("sin onSubmit no ofrece enviar", () => {
    render(<ContactForm {...PROPS} />);
    expect(screen.queryByRole("button", { name: PROPS.copy.submit })).not.toBeInTheDocument();
  });

  it("las flechas mueven la eleccion de tema", () => {
    render(<ContactForm {...PROPS} onSubmit={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole("radio", { name: "Branding" }), { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: "Desarrollo web" })).toHaveAttribute("aria-checked", "true");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ContactForm {...PROPS} onSubmit={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
