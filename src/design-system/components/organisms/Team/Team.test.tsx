import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Team, type TeamProps } from "./Team";

const PROPS: TeamProps = {
  title: "Equipo",
  label: "Quién lo hace",
  intro: "Un estudio pequeño.",
  members: [
    { name: "Ana Ruiz", role: "Dirección de arte", photo: { src: "/portfolio/02.png", width: 522, height: 715 } },
    { name: "Luis Vega", role: "Motion", photo: { src: "/portfolio/05.png", width: 516, height: 775 } },
  ],
};

describe("Team", () => {
  it("presenta a cada persona con su oficio", () => {
    render(<Team {...PROPS} />);

    expect(screen.getByText("Ana Ruiz")).toBeInTheDocument();
    expect(screen.getByText("Dirección de arte")).toBeInTheDocument();
  });

  /**
   * El retrato SI se anuncia, al contrario que las piezas decorativas del resto de la
   * pagina: es la foto de una persona concreta y su nombre es lo que la describe.
   */
  it("cada retrato lleva el nombre de quien retrata", () => {
    render(<Team {...PROPS} />);

    expect(screen.getByRole("img", { name: "Ana Ruiz" })).toBeInTheDocument();
  });

  /**
   * EL gate del gesto: quien vuela es la tarjeta y quien escucha es su marco. Si el
   * hook marcara al que escucha, apartarse del puntero contaria como salir —y volver a
   * entrar— y el retrato se quedaria rebotando solo.
   */
  it("marca la pieza que vuela, y esa no es la que escucha", () => {
    const { container } = render(<Team {...PROPS} />);

    const targets = container.querySelectorAll("[data-momentum-target]");

    expect(targets).toHaveLength(PROPS.members.length);
    targets.forEach((target) => {
      expect(target.parentElement).not.toHaveAttribute("data-momentum-target");
    });
  });

  /** Una lista de personas es una lista, y se anuncia con su cuenta. */
  it("es una lista", () => {
    render(<Team {...PROPS} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(PROPS.members.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Team {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
