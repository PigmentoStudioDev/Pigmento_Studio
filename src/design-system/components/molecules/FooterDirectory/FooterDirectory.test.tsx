import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { FooterDirectory, type FooterDirectoryProps } from "./FooterDirectory";
import styles from "./FooterDirectory.module.scss";

const PROPS: FooterDirectoryProps = {
  brand: "Pigmento Studio®",
  tagline: "Estudio de diseño de marca y crecimiento en Ciudad de México.",
  copyright: "© 2026 Pigmento Studio. Todos los derechos reservados.",
  backToTop: "Volver arriba",
  columns: [
    {
      title: "Estudio",
      links: [
        { label: "Trabajo", href: "/trabajo" },
        { label: "Laboratorio" },
      ],
    },
    {
      title: "Diseño",
      links: [{ label: "Branding", href: "/servicios" }],
    },
  ],
};

describe("FooterDirectory", () => {
  it("publica cada columna como un grupo de navegacion con su nombre", () => {
    render(<FooterDirectory {...PROPS} />);

    expect(screen.getByRole("navigation", { name: "Estudio" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Diseño" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trabajo" })).toHaveAttribute("href", "/trabajo");
  });

  /**
   * Quien baja al pie busca el mapa del sitio, y navegar por encabezados es como se
   * encuentra sin leerlo entero.
   */
  it("el titulo de cada columna es un encabezado", () => {
    render(<FooterDirectory {...PROPS} />);

    expect(screen.getByRole("heading", { name: "Estudio" })).toBeInTheDocument();
  });

  /**
   * El caso que tumbo la primera version: con el id derivado del titulo, limpiar el
   * acento dejaba a las dos columnas con el MISMO id, y la segunda tomaba prestado el
   * nombre de la primera.
   */
  it("nombra por separado dos columnas que solo se diferencian en el acento", () => {
    render(
      <FooterDirectory
        {...PROPS}
        columns={[
          { title: "Diseño", links: [{ label: "Branding", href: "/a" }] },
          { title: "Diseno", links: [{ label: "Otro", href: "/b" }] },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Diseño" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Diseno" })).toBeInTheDocument();
  });

  /**
   * `#top` lo entiende el navegador sin que exista ningun elemento con ese id, asi
   * que la vuelta arriba sigue funcionando con el JS caido.
   */
  it("la vuelta arriba es un enlace nativo", () => {
    render(<FooterDirectory {...PROPS} />);

    expect(screen.getByRole("link", { name: "Volver arriba" })).toHaveAttribute("href", "#top");
  });

  it("firma con el aviso de derechos que recibe", () => {
    render(<FooterDirectory {...PROPS} />);

    expect(screen.getByText(PROPS.copyright)).toBeInTheDocument();
  });

  /**
   * El circuito TS ↔ Sass: una clase que el TSX pide y la hoja no declara no sale
   * rota, sale AUSENTE — `styles.x` es undefined y se convierte en cadena vacia.
   * Contar es lo unico que ve ese hueco.
   */
  it("todas las clases que pone existen en la hoja", () => {
    const usadas = ["root", "grid", "brand", "name", "tagline", "column", "columnTitle", "close", "copyright", "top"];

    expect(usadas.filter((clase) => clase in styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<FooterDirectory {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
