import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import styles from "./PhoneField.module.scss";
import { PhoneField, type PhoneFieldCopy } from "./PhoneField";

const COPY: PhoneFieldCopy = {
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
};

const setup = (onChange = vi.fn()) => {
  render(<PhoneField copy={COPY} locale="es" name="phone" onChange={onChange} />);
  return onChange;
};

describe("PhoneField", () => {
  it("formatea lo escrito y emite E.164 con la lada de Mexico por defecto", () => {
    const onChange = setup();
    const input = screen.getByLabelText("Telefono");

    fireEvent.change(input, { target: { value: "5512345678" } });

    expect(input).toHaveValue("55 1234 5678");
    expect(onChange).toHaveBeenLastCalledWith("+525512345678");
    expect(screen.getByRole("button", { name: "Pais: México, +52" })).toBeInTheDocument();
  });

  /** El "+" no se puede escribir en el numero: abre la lista buscando por codigo. */
  it("el + abre la lista, y elegir un pais cambia la lada", () => {
    const onChange = setup();
    fireEvent.keyDown(screen.getByLabelText("Telefono"), { key: "+" });

    const search = screen.getByRole("combobox", { name: "Buscar pais o lada" });
    expect(search).toHaveValue("+");
    fireEvent.change(search, { target: { value: "colombia" } });
    fireEvent.keyDown(search, { key: "Enter" });

    expect(screen.getByRole("button", { name: "Pais: Colombia, +57" })).toHaveAttribute("aria-expanded", "false");
    fireEvent.change(screen.getByLabelText("Telefono"), { target: { value: "3211234567" } });
    expect(onChange).toHaveBeenLastCalledWith("+573211234567");
  });

  it("la busqueda ignora acentos", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Pais:/ }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "peru" } });

    expect(screen.getByRole("option", { name: /Perú/ })).toBeInTheDocument();
  });

  it("un numero internacional pegado elige su pais", () => {
    const onChange = setup();
    fireEvent.paste(screen.getByLabelText("Telefono"), { clipboardData: { getData: () => "+34 612 34 56 78" } });

    expect(onChange).toHaveBeenLastCalledWith("+34612345678");
    expect(screen.getByRole("button", { name: "Pais: España, +34" })).toBeInTheDocument();
  });

  it("cada clase que pone existe en su hoja", () => {
    const { container } = render(<PhoneField copy={COPY} locale="es" name="phone" onChange={vi.fn()} />);
    const used = new Set([...container.querySelectorAll("[class]")].flatMap((node) => [...node.classList]));
    const declared = new Set(Object.values(styles as Record<string, string>));

    expect(used.size).toBeGreaterThan(10);
    for (const name of used) expect(declared, name).toContain(name);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<PhoneField copy={COPY} locale="es" name="phone" onChange={vi.fn()} error="Revisa" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
