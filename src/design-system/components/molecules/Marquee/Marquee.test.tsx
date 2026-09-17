import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Marquee } from "./Marquee";

const TEXT = ["Marca", "Motion", "Producto"];
const LOGOS = [
  { src: "/logos/a.svg", alt: "Cliente A", width: 120, height: 40 },
  { src: "/logos/b.svg", alt: "Cliente B", width: 120, height: 40 },
];

describe("Marquee", () => {
  /**
   * El bucle no puede descubrir un hueco: mientras una copia sale por un lado, otra
   * tiene que estar entrando por el otro. Con una sola, la tira se queda en blanco
   * media vuelta.
   */
  it("renderiza al menos dos copias de la coleccion", () => {
    const { container } = render(<Marquee kind="text" items={TEXT} copies={1} />);

    expect(container.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Marca").length).toBeGreaterThanOrEqual(2);
  });

  /**
   * Las copias existen para que el bucle no se vea, no para leerse. Sin ocultarlas,
   * un lector de pantalla anuncia la tira entera tantas veces como copias haya — y
   * lo que era decoracion pasa a ser ruido.
   */
  it("solo la primera copia se anuncia", () => {
    const { container } = render(<Marquee kind="text" items={TEXT} copies={3} />);

    const collections = container.querySelectorAll("[aria-hidden]");

    // Tres copias, dos ocultas: la primera es la que se lee.
    expect(collections).toHaveLength(2);
  });

  /**
   * Lo mismo con los logos: el texto alternativo lo lleva el primero de cada marca.
   * Repetirlo en las copias anunciaria "Cliente A" tres veces seguidas.
   */
  it("el texto alternativo del logo solo viaja en la copia que se lee", () => {
    render(<Marquee kind="logos" items={LOGOS} copies={2} />);

    expect(screen.getAllByRole("img", { name: "Cliente A" })).toHaveLength(1);
  });

  /**
   * `data-marquee-status` es el contrato con el CSS: deja legible hacia donde va la
   * tira para lo que quiera reaccionar a ello. Arranca en su sentido declarado.
   */
  it("publica su sentido desde el primer render", () => {
    const { container } = render(<Marquee kind="text" items={TEXT} />);

    expect(container.firstElementChild).toHaveAttribute("data-marquee-status", "normal");
  });

  /**
   * El tema entra como ASIGNACION por modo y se resuelve contra el modo, que es el
   * metodo de la cabecera. Sin asignacion no se pone zona ninguna: hereda la de su
   * seccion, que es lo que tiene que pasar cuando nadie pide nada.
   */
  it("sin tema asignado no declara zona", () => {
    const { container } = render(<Marquee kind="text" items={TEXT} />);

    expect(container.firstElementChild?.className).not.toMatch(/cds--/);
  });

  it("con tema asignado resuelve una zona de Carbon", () => {
    const { container } = render(<Marquee kind="text" items={TEXT} theme={{ light: "dark" }} />);

    expect(container.firstElementChild?.className).toMatch(/cds--(white|g10|g90|g100)/);
  });

  /**
   * Un kit de marcas viene casi siempre en blanco, listo para fondo oscuro. Sobre una
   * zona clara los logos desaparecen — y desaparecen del TODO: no hay error, no hay
   * hueco, la tira se ve vacia y parece que el componente no carga.
   *
   * El snapshot de servidor del modo es claro, asi que este es el caso por defecto y
   * el que se rompe primero.
   */
  it("invierte los logos sobre una zona clara", () => {
    const { container } = render(<Marquee kind="logos" items={LOGOS} theme={{ light: "light" }} />);

    expect(container.firstElementChild?.className).toMatch(/onLight/);
  });

  /**
   * La inversion de los logos sigue a la ZONA RESUELTA en el modo actual, no a lo que
   * la asignacion pida en el otro modo. El snapshot de servidor del modo es claro:
   * una tira que pide oscuro solo en modo oscuro sigue siendo clara aqui, y un
   * componente que mirase la asignacion entera en vez de la zona se equivocaria.
   *
   * Que zonas son claras lo decide theme/zone.ts; aqui solo se comprueba que el
   * componente lo consulta en vez de deducirlo.
   */
  it("la inversion sigue a la zona del modo actual", () => {
    const light = render(<Marquee kind="logos" items={LOGOS} theme={{ dark: "dark" }} />);
    const dark = render(<Marquee kind="logos" items={LOGOS} theme={{ light: "dark" }} />);

    expect(light.container.firstElementChild?.className).toMatch(/onLight/);
    expect(dark.container.firstElementChild?.className).not.toMatch(/onLight/);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Marquee kind="logos" items={LOGOS} theme={{ light: "dark" }} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
