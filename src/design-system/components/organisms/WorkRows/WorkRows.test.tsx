import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { WorkRows } from "./WorkRows";

const IMAGE = { src: "/portfolio/01.png", width: 520, height: 700 };

const ROWS = [
  [
    { client: "Cliente uno", discipline: "Branding", href: "/trabajo/uno", image: IMAGE },
    { client: "Cliente dos", href: "/trabajo/dos", image: IMAGE },
  ],
  [{ client: "Cliente tres", discipline: "Motion", href: "/trabajo/tres", image: IMAGE }],
];

const PROPS = {
  title: "Trabajo destacado",
  label: "Casos",
  intro: "Una muestra de lo que hacemos.",
  rows: ROWS,
  ctaLabel: "Ver todo el trabajo",
  ctaHref: "/trabajo",
  titleId: "trabajo",
};

describe("WorkRows", () => {
  it("el titular es el de la seccion y lleva el id que la nombra", () => {
    render(<WorkRows {...PROPS} />);

    expect(screen.getByRole("heading", { level: 2, name: PROPS.title })).toHaveAttribute("id", "trabajo");
  });

  it("cada pieza es UN enlace nombrado por su cliente y su disciplina", () => {
    render(<WorkRows {...PROPS} />);

    expect(screen.getAllByRole("listitem").map((item) => item.querySelectorAll("a").length)).toEqual([1, 1, 1]);
    expect(screen.getByRole("link", { name: "Cliente uno Branding" })).toHaveAttribute("href", "/trabajo/uno");
    expect(screen.getByRole("link", { name: "Cliente tres Motion" })).toHaveAttribute("href", "/trabajo/tres");
  });

  it("lleva un atajo al portafolio entero", () => {
    render(<WorkRows {...PROPS} />);

    expect(screen.getByRole("link", { name: PROPS.ctaLabel })).toHaveAttribute("href", "/trabajo");
  });

  it("la disciplina es opcional", () => {
    render(<WorkRows {...PROPS} />);

    expect(screen.getByRole("link", { name: "Cliente dos" })).toHaveAttribute("href", "/trabajo/dos");
  });

  it("una lista por fila, y las filas vacias no se pintan", () => {
    render(<WorkRows {...PROPS} rows={[...ROWS, []]} />);

    expect(screen.getAllByRole("list")).toHaveLength(2);
  });

  it("las imagenes son decorativas", () => {
    render(<WorkRows {...PROPS} />);

    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("sin piezas no se monta", () => {
    const { container } = render(<WorkRows {...PROPS} rows={[[], []]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<WorkRows {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("WorkRows: flechas", () => {
  /** Sin motion (jsdom, movil, reduced-motion) cada fila es un carril y la flecha lo desplaza. */
  it("la siguiente desplaza los carriles, y la anterior empieza apagada", () => {
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo;
    // jsdom no maqueta: sin medidas, cada carril mide cero y ya estaria en su final.
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(500);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(2000);
    // Cada pieza 300px mas a la derecha que la anterior: los puntos de snap del carril.
    vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (this: HTMLElement) {
      return Array.from(this.parentElement?.children ?? []).indexOf(this) * 300;
    });
    render(<WorkRows {...PROPS} labels={{ previous: "Anteriores", next: "Siguientes" }} />);

    expect(screen.getByRole("button", { name: "Anteriores" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Siguientes" }));

    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo.mock.calls[0][0].left).toBeGreaterThan(0);
    vi.restoreAllMocks();
  });
});
