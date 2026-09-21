import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { LegalDocument, type LegalDocumentProps } from "./LegalDocument";

const PROPS: LegalDocumentProps = {
  title: "Aviso de privacidad",
  effectiveDateLabel: "Vigente desde el 31 de enero de 2026",
  intro: ["Este aviso explica que hacemos con tus datos."],
  tocTitle: "Contenido",
  tocLabel: "Contenido del documento",
  sections: [
    {
      anchor: "responsable",
      heading: "Responsable de los datos",
      level: 2,
      body: ["Pigmento Studio, con domicilio en Ciudad de Mexico.", "Segundo parrafo."],
      items: [],
    },
    {
      anchor: "datos-que-recabamos",
      heading: "Datos que recabamos",
      level: 3,
      body: ["Solo lo que nos das."],
      items: ["Nombre", "Correo"],
    },
  ],
};

describe("LegalDocument", () => {
  /**
   * El titulo del documento es el h1 de la pagina. Si fuera un h2, la pagina se
   * quedaria sin encabezado de primer nivel y quien navega por encabezados
   * empezaria a leer por la mitad.
   */
  it("el titulo del documento es el h1", () => {
    render(<LegalDocument {...PROPS} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Aviso de privacidad");
  });

  /**
   * El nivel que trae cada seccion es el que se pinta. Es lo que distingue una
   * subseccion de una seccion tanto en el esquema del documento como en la
   * sangria del indice, y por eso el dato viaja y no se deriva de la posicion.
   */
  it("cada seccion se pinta con su nivel", () => {
    render(<LegalDocument {...PROPS} />);
    expect(screen.getByRole("heading", { level: 2, name: "Responsable de los datos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Datos que recabamos" })).toBeInTheDocument();
  });

  /**
   * El ancla es el destino del enlace del indice, asi que tiene que existir como
   * id en el documento. Sin esto el indice se pinta entero y no lleva a nada.
   */
  it("cada seccion lleva su ancla como id", () => {
    const { container } = render(<LegalDocument {...PROPS} />);
    expect(container.querySelector("#responsable")).not.toBeNull();
    expect(container.querySelector("#datos-que-recabamos")).not.toBeNull();
  });

  it("el indice tiene un enlace por seccion, a su ancla", () => {
    render(<LegalDocument {...PROPS} />);
    const toc = screen.getByRole("navigation", { name: "Contenido del documento" });
    const links = within(toc).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "#responsable",
      "#datos-que-recabamos",
    ]);
  });

  /** El indice sangra las subsecciones, y para eso necesita el nivel en el marcado. */
  it("el indice marca el nivel de cada entrada", () => {
    render(<LegalDocument {...PROPS} />);
    const toc = screen.getByRole("navigation", { name: "Contenido del documento" });
    const links = within(toc).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("data-level"))).toEqual(["2", "3"]);
  });

  it("pinta un parrafo por bloque del cuerpo", () => {
    render(<LegalDocument {...PROPS} />);
    expect(screen.getByText("Pigmento Studio, con domicilio en Ciudad de Mexico.")).toBeInTheDocument();
    expect(screen.getByText("Segundo parrafo.")).toBeInTheDocument();
  });

  it("pinta la lista de una seccion que la tiene", () => {
    const { container } = render(<LegalDocument {...PROPS} />);
    const lista = container.querySelector("#datos-que-recabamos ul");
    expect(lista).not.toBeNull();
    expect(within(lista as HTMLElement).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Nombre",
      "Correo",
    ]);
  });

  /**
   * Una seccion sin puntos no pinta una lista vacia, que un lector de pantalla
   * anuncia igual ("lista, 0 elementos"). Se cuenta: la unica lista que queda es
   * la del indice.
   */
  it("no pinta lista cuando no hay puntos", () => {
    render(<LegalDocument {...PROPS} sections={[{ ...PROPS.sections[0], items: [] }]} />);
    expect(screen.getAllByRole("list")).toHaveLength(1);
  });

  it("muestra desde cuando rige", () => {
    render(<LegalDocument {...PROPS} />);
    expect(screen.getByText("Vigente desde el 31 de enero de 2026")).toBeInTheDocument();
  });

  /** La fecha es opcional en el CMS: sin ella la pagina no puede reventar. */
  it("aguanta un documento sin fecha de vigencia y sin intro", () => {
    render(<LegalDocument {...PROPS} effectiveDateLabel={null} intro={[]} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  /**
   * Una seccion sin ancla se LEE igual y no entra en el indice. Es texto legal: no
   * puede desaparecer porque le falte un destino.
   */
  it("una seccion sin ancla se lee pero no entra en el indice", () => {
    const sinAncla = { ...PROPS.sections[0], anchor: null };
    const { container } = render(<LegalDocument {...PROPS} sections={[sinAncla, PROPS.sections[1]]} />);

    expect(screen.getByRole("heading", { level: 2, name: "Responsable de los datos" })).toBeInTheDocument();
    expect(screen.getByText("Pigmento Studio, con domicilio en Ciudad de Mexico.")).toBeInTheDocument();

    const toc = screen.getByRole("navigation", { name: "Contenido del documento" });
    expect(within(toc).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual([
      "#datos-que-recabamos",
    ]);
    expect(container.querySelectorAll("section[id]")).toHaveLength(1);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<LegalDocument {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
