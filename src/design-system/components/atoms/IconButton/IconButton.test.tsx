import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { compile, type Options } from "sass";
import { describe, expect, it, vi } from "vitest";
import { IconButton, type IconButtonEmphasis } from "./IconButton";

const SASS: Options<"sync"> = { loadPaths: ["node_modules"], quietDeps: true };

const declared = new Set(
  [
    ...compile(join(__dirname, "IconButton.module.scss"), SASS).css.matchAll(
      /\.([a-zA-Z][\w-]*)/g,
    ),
  ].map(([, name]) => name),
);

const EMPHASES: IconButtonEmphasis[] = ["primary", "secondary"];

describe("IconButton", () => {
  it("sin href es un boton", () => {
    render(<IconButton icon="instagram" label="Instagram" />);

    expect(screen.getByRole("button", { name: "Instagram" })).toHaveAttribute("type", "button");
  });

  it("con href es un enlace", () => {
    render(<IconButton href="https://example.com" icon="behance" label="Behance" />);

    expect(screen.getByRole("link", { name: "Behance" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });

  /**
   * El nombre sale de `label` y de ningun otro sitio. Un control cuyo contenido es
   * un dibujo no tiene texto del que sacarlo: sin esto se anuncia como "boton" a
   * secas, que para tres redes seguidas son tres controles indistinguibles.
   */
  it("el nombre accesible siempre sale de label", () => {
    render(<IconButton icon="facebook" label="Pigmento en Facebook" />);

    expect(screen.getByRole("button", { name: "Pigmento en Facebook" })).toBeInTheDocument();
  });

  /**
   * Las dos caras son decorativas: son copias del mismo dibujo, y si contaran para
   * el nombre lo dirian dos veces.
   */
  it("las dos caras del gesto quedan fuera del arbol de accesibilidad", () => {
    const { container } = render(<IconButton icon="instagram" label="Instagram" />);

    expect(container.querySelectorAll("svg")).toHaveLength(2);
    expect(screen.getByRole("button").textContent).toBe("");
  });

  /** Un destino de fuera abre en pestana nueva, y rel cierra el acceso a opener. */
  it("external abre fuera y sin dar acceso a la pestana de origen", () => {
    render(<IconButton href="https://example.com" external icon="behance" label="Behance" />);
    const link = screen.getByRole("link", { name: "Behance" });

    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("sin external se queda en la misma pestana", () => {
    render(<IconButton href="/contacto" icon="facebook" label="Facebook" />);

    expect(screen.getByRole("link", { name: "Facebook" })).not.toHaveAttribute("target");
  });

  it("deshabilitado no responde", async () => {
    const onClick = vi.fn();
    render(<IconButton icon="instagram" label="Instagram" disabled onClick={onClick} />);

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  /**
   * Cierra el circuito TS <-> Sass. Se CUENTA ademas de comprobar pertenencia, y esa
   * es la parte que importa: si un mapa apunta a una clase que la hoja no declara,
   * styles.x es undefined y join(' ') lo convierte en cadena vacia — la clase no
   * sale rota, sale ausente, y comprobar solo pertenencia pasaria verde.
   */
  it.each(EMPHASES)("con emphasis %s todas sus clases existen en la hoja", (emphasis) => {
    const { container } = render(
      <IconButton icon="instagram" label="Instagram" emphasis={emphasis} />,
    );

    // getAttribute y no .className: en un <svg> esa propiedad es un
    // SVGAnimatedString, no una cadena, y toString() la convierte en
    // "[object SVGAnimatedString]" — un nombre de clase que ninguna hoja declara y
    // que hacia fallar este caso por un motivo que no era el suyo.
    const used = [...container.querySelectorAll("[class]")].flatMap((node) =>
      (node.getAttribute("class") ?? "").split(/\s+/).filter(Boolean),
    );

    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((name) => !declared.has(name))).toEqual([]);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <IconButton href="https://example.com" external icon="instagram" label="Instagram" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
