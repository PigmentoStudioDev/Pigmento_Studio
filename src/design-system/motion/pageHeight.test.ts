import { afterEach, describe, expect, it, vi } from "vitest";
import { PAGE_HEIGHT_SETTLE_MS, watchPageHeight } from "./gsap";

/**
 * El bug: abrir una pregunta del Faq cambiaba el alto de la pagina sin tocar la
 * ventana, ScrollTrigger no se enteraba y cada trigger de debajo quedaba desplazado.
 */
describe("watchPageHeight", () => {
  let notify: () => void = () => {};

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function setup(onChange: () => void) {
    vi.useFakeTimers();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    let height = 1000;
    vi.spyOn(document.body, "scrollHeight", "get").mockImplementation(() => height);
    const stop = watchPageHeight(onChange);
    return { grow: (next: number) => (height = next), stop };
  }

  it("recalcula una sola vez cuando el alto se asienta, y no si no cambio", () => {
    const onChange = vi.fn();
    const { grow, stop } = setup(onChange);

    notify();
    vi.advanceTimersByTime(PAGE_HEIGHT_SETTLE_MS);
    expect(onChange).not.toHaveBeenCalled();

    grow(1200);
    notify();
    notify();
    vi.advanceTimersByTime(PAGE_HEIGHT_SETTLE_MS);
    expect(onChange).toHaveBeenCalledTimes(1);

    stop();
  });
});
