import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTO_ROTATE_BEATS, useAutoRotate } from "./useAutoRotate";

/** La duracion de la escala que marca el ritmo; jsdom no resuelve la hoja. */
const BEAT_SECONDS = 1.2;
const DWELL_MS = BEAT_SECONDS * AUTO_ROTATE_BEATS * 1000;

const root = document.documentElement;

beforeEach(() => {
  vi.useFakeTimers();
  root.style.setProperty("--pg-duration-double", `${BEAT_SECONDS}s`);
});

afterEach(() => {
  vi.useRealTimers();
  root.style.removeProperty("--pg-duration-double");
});

function setup(enabled = true) {
  const advance = vi.fn();
  const hook = renderHook(() => useAutoRotate<HTMLDivElement>(advance, enabled));
  return { advance, hook };
}

describe("useAutoRotate", () => {
  it("avanza una tarjeta por cada pausa de lectura", () => {
    const { advance } = setup();

    act(() => vi.advanceTimersByTime(DWELL_MS * 2));

    expect(advance).toHaveBeenCalledTimes(2);
  });

  it("se detiene con el puntero encima y sigue al salir", () => {
    const { advance, hook } = setup();

    act(() => hook.result.current.handlers.onPointerEnter());
    act(() => vi.advanceTimersByTime(DWELL_MS * 2));
    expect(advance).not.toHaveBeenCalled();

    act(() => hook.result.current.handlers.onPointerLeave());
    act(() => vi.advanceTimersByTime(DWELL_MS));
    expect(advance).toHaveBeenCalledTimes(1);
  });

  /** Quien llega con teclado esta leyendo o eligiendo: la corona no se le mueve debajo. */
  it("se detiene con el foco dentro", () => {
    const { advance, hook } = setup();

    act(() => hook.result.current.handlers.onFocus());
    act(() => vi.advanceTimersByTime(DWELL_MS * 2));

    expect(advance).not.toHaveBeenCalled();
  });

  /** Quien toca la corona ya la esta moviendo: seguir girando seria pelearle el gesto. */
  it("deja de girar para siempre en cuanto la persona la mueve", () => {
    const { advance, hook } = setup();

    act(() => hook.result.current.stop());
    act(() => hook.result.current.handlers.onPointerLeave());
    act(() => vi.advanceTimersByTime(DWELL_MS * 3));

    expect(advance).not.toHaveBeenCalled();
    expect(hook.result.current.rotating).toBe(false);
  });

  it("no gira con reduced-motion", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...original(query), matches: true })) as typeof window.matchMedia;

    const { advance, hook } = setup();
    act(() => vi.advanceTimersByTime(DWELL_MS * 2));

    expect(advance).not.toHaveBeenCalled();
    expect(hook.result.current.rotating).toBe(false);
    window.matchMedia = original;
  });

  /** Sin el token no hay ritmo que seguir: un intervalo de cero giraria sin parar. */
  it("sin la duracion publicada no gira", () => {
    root.style.removeProperty("--pg-duration-double");
    const { advance } = setup();

    act(() => vi.advanceTimersByTime(DWELL_MS * 2));

    expect(advance).not.toHaveBeenCalled();
  });

  it("apagado no gira", () => {
    const { advance, hook } = setup(false);

    act(() => vi.advanceTimersByTime(DWELL_MS * 2));

    expect(advance).not.toHaveBeenCalled();
    expect(hook.result.current.rotating).toBe(false);
  });
});
