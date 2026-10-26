import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pauseOnIntent, type Pausable } from "./pauseOnIntent";

function spy(): Pausable & { paused: number; resumed: number } {
  return {
    paused: 0,
    resumed: 0,
    pause() {
      this.paused += 1;
    },
    resume() {
      this.resumed += 1;
    },
  };
}

describe("pauseOnIntent", () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.append(root);
  });

  it("para el bucle con el puntero encima y lo reanuda al salir", () => {
    const loop = spy();
    pauseOnIntent(root, () => [loop]);

    root.dispatchEvent(new Event("pointerenter"));
    expect(loop.paused).toBe(1);

    root.dispatchEvent(new Event("pointerleave"));
    expect(loop.resumed).toBe(1);
  });

  /** El puntero no existe para quien navega con teclado, y 2.2.2 es para los dos. */
  it("para el bucle tambien cuando el foco entra", () => {
    const loop = spy();
    pauseOnIntent(root, () => [loop]);

    root.dispatchEvent(new Event("focusin"));
    expect(loop.paused).toBe(1);

    root.dispatchEvent(new Event("focusout"));
    expect(loop.resumed).toBe(1);
  });

  /** Un consumidor puede anadir piezas despues de enganchar: se leen en cada evento. */
  it("lee la lista en cada evento y no al enganchar", () => {
    const loops: Pausable[] = [];
    pauseOnIntent(root, () => loops);

    const tardio = spy();
    loops.push(tardio);
    root.dispatchEvent(new Event("pointerenter"));

    expect(tardio.paused).toBe(1);
  });

  it("al soltar deja de escuchar y reanuda lo que hubiera pausado", () => {
    const loop = spy();
    const detach = pauseOnIntent(root, () => [loop]);

    root.dispatchEvent(new Event("pointerenter"));
    detach();
    expect(loop.resumed).toBe(1);

    root.dispatchEvent(new Event("pointerenter"));
    expect(loop.paused).toBe(1);
  });

  describe("fuera de pantalla", () => {
    let notify: (isIntersecting: boolean) => void;

    beforeEach(() => {
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
            notify = (isIntersecting) => cb([{ isIntersecting }]);
          }
          observe() {}
          disconnect() {}
        },
      );
    });

    afterEach(() => vi.unstubAllGlobals());

    it("pausa al salir de pantalla y reanuda al volver", () => {
      const loop = spy();
      pauseOnIntent(root, () => [loop]);

      notify(false);
      expect(loop.paused).toBe(1);

      notify(true);
      expect(loop.resumed).toBe(1);
    });

    it("no reanuda al volver a pantalla si el puntero sigue encima", () => {
      const loop = spy();
      pauseOnIntent(root, () => [loop]);

      root.dispatchEvent(new Event("pointerenter"));
      notify(false);
      notify(true);

      expect(loop.resumed).toBe(0);
    });

    it("no reanuda al soltar el puntero si esta fuera de pantalla", () => {
      const loop = spy();
      pauseOnIntent(root, () => [loop]);

      notify(false);
      root.dispatchEvent(new Event("pointerenter"));
      root.dispatchEvent(new Event("pointerleave"));

      expect(loop.resumed).toBe(0);
    });
  });
});
