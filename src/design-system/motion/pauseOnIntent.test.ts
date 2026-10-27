import { beforeEach, describe, expect, it } from "vitest";
import { setMotionPaused } from "./motionPause";
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

  // El bug: pausar solo con puntero o foco no es un mecanismo valido para 2.2.2 y en
  // tactil no existe. El conmutador global para todos los bucles.
  it("el conmutador global para el bucle y lo reanuda", () => {
    const loop = spy();
    setMotionPaused(false);
    pauseOnIntent(root, () => [loop]);

    setMotionPaused(true);
    expect(loop.paused).toBe(1);

    setMotionPaused(false);
    expect(loop.resumed).toBe(1);
  });

  // El bug: mover el foco entre dos hijos reanudaba y paraba en un parpadeo.
  it("el foco que pasa de un hijo a otro no reanuda", () => {
    const loop = spy();
    setMotionPaused(false);
    const [a, b] = [document.createElement("button"), document.createElement("button")];
    root.append(a, b);
    pauseOnIntent(root, () => [loop]);

    root.dispatchEvent(new FocusEvent("focusin"));
    a.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: b }));

    expect(loop.resumed).toBe(0);
  });
});
