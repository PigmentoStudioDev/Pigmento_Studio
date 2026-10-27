import { describe, expect, it, vi } from "vitest";
import { onRevealed } from "./useScrollReveal";

/**
 * El bug: la cifra rodaba con un trigger propio, a destiempo de su tarjeta — media
 * vuelta con la tarjeta en opacidad 0, o debajo del preloader. Ahora espera al reveal
 * que la contiene.
 */
describe("onRevealed", () => {
  it("espera a que el bloque que la contiene pase a revealed", async () => {
    const card = document.createElement("div");
    card.setAttribute("data-reveal", "idle");
    const figure = document.createElement("span");
    card.append(figure);
    document.body.append(card);

    const callback = vi.fn();
    onRevealed(figure, callback);
    expect(callback).not.toHaveBeenCalled();

    card.setAttribute("data-reveal", "revealed");
    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(1);
    card.remove();
  });

  it("sin reveal alrededor arranca enseguida", () => {
    const callback = vi.fn();
    onRevealed(document.createElement("span"), callback);
    expect(callback).toHaveBeenCalledWith(0);
  });
});
