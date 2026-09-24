import { act, renderHook } from "@testing-library/react";
import type { KeyboardEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clampIndex, rosterSteps, useRosterSlider } from "./useRosterSlider";

describe("clampIndex", () => {
  it("no sale de la fila por ningun lado", () => {
    expect(clampIndex(-1, 5)).toBe(0);
    expect(clampIndex(9, 5)).toBe(4);
    expect(clampIndex(2, 5)).toBe(2);
  });

  it("una fila vacia se queda en cero", () => {
    expect(clampIndex(3, 0)).toBe(0);
  });
});

describe("rosterSteps", () => {
  it("arrastrar hacia la izquierda avanza, hacia la derecha retrocede", () => {
    expect(rosterSteps(-420, 400)).toBe(1);
    expect(rosterSteps(820, 400)).toBe(-2);
  });

  /** Un arrastre corto se queda donde estaba: moverse por medio paso seria un salto. */
  it("menos de medio paso no mueve", () => {
    expect(rosterSteps(-150, 400)).toBe(0);
  });

  it("sin medida no hay paso", () => {
    expect(rosterSteps(-500, 0)).toBe(0);
  });
});

/**
 * Con reduced-motion la fila es un scroll nativo y la hoja ya no aplica el indice. Las
 * flechas del teclado tienen que dejar hacer al navegador, y las de la barra desplazar
 * la fila de verdad: si solo movieran el indice, no moverian nada.
 */
describe("useRosterSlider con reduced-motion", () => {
  const original = window.matchMedia;

  afterEach(() => {
    window.matchMedia = original;
  });

  function setup() {
    window.matchMedia = ((query: string) => ({ ...original(query), matches: true })) as typeof window.matchMedia;

    const viewport = document.createElement("div");
    const track = document.createElement("ul");
    const card = document.createElement("li");
    track.append(card);
    viewport.append(track);
    Object.defineProperty(card, "offsetWidth", { value: 300 });
    const scrollBy = vi.fn();
    viewport.scrollBy = scrollBy;

    const hook = renderHook(() => useRosterSlider<HTMLDivElement>(4));
    hook.result.current.viewportRef.current = viewport;
    return { hook, scrollBy };
  }

  it("las flechas del teclado no se tragan el scroll nativo", () => {
    const { hook } = setup();
    const preventDefault = vi.fn();

    act(() =>
      hook.result.current.handlers.onKeyDown({ key: "ArrowRight", preventDefault } as unknown as KeyboardEvent<HTMLDivElement>),
    );

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("las flechas de la barra desplazan la fila una tarjeta", () => {
    const { hook, scrollBy } = setup();

    act(() => hook.result.current.go(1));

    expect(scrollBy).toHaveBeenCalledWith({ left: 300 });
  });
});
