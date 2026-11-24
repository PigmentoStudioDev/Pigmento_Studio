import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Prose } from "./Prose";

describe("Prose", () => {
  it("parte el texto en un parrafo por cada linea en blanco y descarta los vacios", () => {
    const { container } = render(<Prose text={"Uno.\n\nDos.\n\n\n\nTres.\n\n"} />);

    expect([...container.querySelectorAll("p")].map((p) => p.textContent)).toEqual(["Uno.", "Dos.", "Tres."]);
  });
});
