import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ServiceStatement } from "./ServiceStatement";

describe("ServiceStatement", () => {
  it("sin titular pinta solo los parrafos, uno por linea en blanco", () => {
    const { container } = render(<ServiceStatement text={"Uno.\n\nDos."} />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });

  it("los puntos se leen como lista ordenada con su titulo como encabezado", () => {
    render(
      <ServiceStatement
        title="Creatividad y datos."
        items={[
          { title: "Estrategia antes que ejecucion", text: "Cada decision parte de un objetivo." },
          { title: "Trabajo en equipo", text: "Nos involucramos." },
        ]}
      />,
    );

    expect(screen.getByRole("list").tagName).toBe("OL");
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Estrategia antes que ejecucion",
      "Trabajo en equipo",
    ]);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <ServiceStatement
        title="Mas que disenar, nos involucramos."
        label="02. Nuestra filosofia"
        text="Creemos que las mejores ideas nacen de entender."
        tagline="Estrategia que da direccion."
        cta={{ label: "Hablemos", href: "#contacto" }}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
