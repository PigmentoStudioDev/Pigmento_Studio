import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const idle = vi.hoisted(() => {
  let release: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release: () => release() };
});

vi.mock("./gsap", () => ({
  loadMotion: vi.fn(() => new Promise(() => {})),
  whenIdle: () => idle.promise,
}));

import { ScrollReveal } from "../components/layout/ScrollReveal/ScrollReveal";
import { loadMotion } from "./gsap";

describe("useScrollReveal", () => {
  /**
   * Lo que nace bajo el pliegue espera al ralenti para pedir gsap. Si el bloque se
   * desmonta antes —una navegacion, el fin de un test—, esa espera no puede seguir
   * descargando gsap y leyendo `document` para una pagina que ya no esta.
   */
  it("un bloque desmontado antes del ralenti no carga el motion", async () => {
    const { unmount } = render(
      <ScrollReveal>
        <p>Texto bajo el pliegue</p>
      </ScrollReveal>,
    );
    unmount();

    idle.release();
    await idle.promise;
    await Promise.resolve();

    expect(loadMotion).not.toHaveBeenCalled();
  });
});
