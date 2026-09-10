import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InterfaceSound } from "./InterfaceSound";

describe("InterfaceSound", () => {
  /**
   * No aporta DOM: instala un comportamiento de pagina. Si devolviera un nodo, se
   * colaria un elemento vacio como primer hijo del <body>.
   */
  it("no aporta DOM", () => {
    const { container } = render(<InterfaceSound />);

    expect(container).toBeEmptyDOMElement();
  });

  /**
   * Con el sonido apagado —que es como arranca— no se carga la libreria. Es lo que
   * hace que un sitio silencioso no pague un motor de audio: si esto dejara de ser
   * cierto, el import se resolveria despues de que el entorno del test se cierre y
   * vitest lo cantaria como error suelto, que es justo como se destaparia en vivo.
   */
  it("apagado no carga nada", () => {
    expect(() => render(<InterfaceSound />)).not.toThrow();
  });
});
