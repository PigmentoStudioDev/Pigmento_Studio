import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { RADIAL_COPIES } from "../../../motion/useRadialSlider";
import { ValueCards, type ValueCardsProps } from "./ValueCards";

const PROPS: ValueCardsProps = {
  title: "Cómo trabajamos",
  cards: [
    { title: "Sin intermediarios", text: "Quien diseña contesta.", family: "periwinkle", position: "1 de 3" },
    { title: "Probado con gente real", text: "Se valida con quien lo usa.", family: "tangerine", position: "2 de 3" },
    { title: "Criterio antes que tendencia", text: "Marcas que se sostienen.", family: "cyan", position: "3 de 3" },
  ],
  labels: { carousel: "carrusel", previous: "Anterior", next: "Siguiente", picker: "Elegir valor", drag: "Arrastra" },
  titleId: "valores",
};

function currentDot() {
  return screen.getAllByRole("button").find((button) => button.getAttribute("aria-current") === "true");
}

describe("ValueCards", () => {
  it("el titular no se ve pero nombra la seccion", () => {
    render(<ValueCards {...PROPS} />);

    expect(screen.getByRole("heading", { level: 2, name: PROPS.title })).toHaveAttribute("id", "valores");
  });

  it("el carrusel se anuncia como tal y lo nombra el titular", () => {
    render(<ValueCards {...PROPS} />);

    const carousel = screen.getByRole("group", { name: PROPS.title });

    expect(carousel).toHaveAttribute("aria-roledescription", "carrusel");
  });

  it("cada valor se anuncia UNA vez, aunque la corona pinte copias para cerrar la vuelta", () => {
    const { container } = render(<ValueCards {...PROPS} />);

    expect(container.querySelectorAll("article")).toHaveLength(PROPS.cards.length * RADIAL_COPIES);
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(
      PROPS.cards.map((card) => card.title),
    );
    expect(screen.getByRole("group", { name: "2 de 3" })).toBeInTheDocument();
  });

  it("la corona pide el cursor de arrastre: es la unica pista del gesto con raton", () => {
    const { container } = render(<ValueCards {...PROPS} />);

    const stage = container.querySelector("[data-cursor]");

    expect(stage).toHaveAttribute("data-cursor", "drag");
    expect(stage).toHaveAttribute("data-cursor-text", "Arrastra");
  });

  it("las copias no reciben foco ni puntero", () => {
    const { container } = render(<ValueCards {...PROPS} />);

    const clones = container.querySelectorAll("[data-clone]");

    expect(clones).toHaveLength(PROPS.cards.length * (RADIAL_COPIES - 1));
    clones.forEach((clone) => expect(clone).toHaveAttribute("inert"));
  });

  it("las flechas mueven la tarjeta activa y dan la vuelta por los extremos", async () => {
    const user = userEvent.setup();
    render(<ValueCards {...PROPS} />);

    expect(currentDot()).toHaveAccessibleName("Sin intermediarios");

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(currentDot()).toHaveAccessibleName("Probado con gente real");

    await user.click(screen.getByRole("button", { name: "Anterior" }));
    await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(currentDot()).toHaveAccessibleName("Criterio antes que tendencia");
  });

  it("un punto lleva a su tarjeta y la region viva la nombra", async () => {
    const user = userEvent.setup();
    render(<ValueCards {...PROPS} />);

    await user.click(screen.getByRole("button", { name: "Criterio antes que tendencia" }));

    expect(currentDot()).toHaveAccessibleName("Criterio antes que tendencia");
    expect(screen.getByText("3 de 3: Criterio antes que tendencia")).toHaveAttribute("aria-live", "polite");
  });

  it("con una sola tarjeta no hay controles", () => {
    render(<ValueCards {...PROPS} cards={PROPS.cards.slice(0, 1)} />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("sin tarjetas no se monta", () => {
    const { container } = render(<ValueCards {...PROPS} cards={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ValueCards {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
