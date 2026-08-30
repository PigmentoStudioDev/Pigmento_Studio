import { join } from "node:path";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { compile } from "sass";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TARGET_OVERFLOW, VideoBackdrop } from "./VideoBackdrop";

const SRC = "https://cdn.example/hero.mp4";
const POSTER = "/hero-poster.webp";

/** jsdom no implementa HTMLMediaElement.play: sin doble, montar ya revienta. */
function stubPlay() {
  const play = vi.fn(() => Promise.resolve());
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play);
  return play;
}

function setReducedMotion(reduced: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe("VideoBackdrop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /**
   * El video es decoracion detras del contenido del hero. Anunciarlo mete ruido
   * entre el titular y la llamada a la accion, que son lo que de verdad hay que
   * leer ahi.
   */
  it("el video queda fuera del arbol de accesibilidad", () => {
    setReducedMotion(false);
    stubPlay();

    const { container } = render(<VideoBackdrop src={SRC} poster={POSTER} />);
    const video = container.querySelector("video");

    expect(video).toHaveAttribute("aria-hidden", "true");
    expect(video).not.toHaveAttribute("controls");
  });

  /**
   * Un bucle de fondo corriendo es exactamente lo que esta preferencia pide
   * evitar. Se queda en el poster: apagado, no acelerado.
   */
  it("no reproduce con prefers-reduced-motion", () => {
    setReducedMotion(true);
    const play = stubPlay();

    const { container } = render(<VideoBackdrop src={SRC} poster={POSTER} />);

    expect(play).not.toHaveBeenCalled();
    expect(container.querySelector("video")).toHaveAttribute("poster", POSTER);
  });

  it("reproduce cuando no se ha pedido menos movimiento", () => {
    setReducedMotion(false);
    const play = stubPlay();

    render(<VideoBackdrop src={SRC} poster={POSTER} />);

    expect(play).toHaveBeenCalledTimes(1);
  });

  /**
   * Sin `muted` ningun navegador deja arrancar un video solo, y sin `playsInline`
   * iOS lo abre a pantalla completa en vez de dejarlo de fondo. Las dos son la
   * diferencia entre un fondo y un reproductor que secuestra la pagina.
   */
  it("arranca en silencio y en linea, como exige el autoplay movil", () => {
    setReducedMotion(false);
    stubPlay();

    const { container } = render(<VideoBackdrop src={SRC} poster={POSTER} />);
    const video = container.querySelector("video");

    expect(video).toHaveProperty("muted", true);
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("loop");
  });

  /**
   * play() se rechaza cuando el navegador bloquea la reproduccion. Sin capturarlo
   * es un unhandled rejection en la consola de cada visitante — y no hay nada que
   * hacer: el poster ya es el plan B.
   */
  it("un play() rechazado no rompe el montaje", async () => {
    setReducedMotion(false);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(
      new DOMException("blocked", "NotAllowedError"),
    );

    expect(() => render(<VideoBackdrop src={SRC} poster={POSTER} />)).not.toThrow();
    await Promise.resolve();
  });

  /**
   * El recorrido del parallax se calcula desde TARGET_OVERFLOW, pero quien decide el
   * alto real del objetivo es la hoja. Si los dos numeros se separan, el fondo se
   * desplaza mas de lo que tiene de sobrante y descubre una franja vacia en el
   * borde — y es un fallo mudo: no hay error, y solo se ve al final del scroll,
   * cuando ya nadie esta mirando el diff.
   */
  it("el sobrante declarado en TS es el que pone la hoja", () => {
    const css = compile(
      join(process.cwd(), "src/design-system/components/molecules/VideoBackdrop/VideoBackdrop.module.scss"),
      { loadPaths: ["node_modules"], quietDeps: true },
    ).css;

    const declared = /\.target\b[^{]*\{[^}]*block-size:\s*([0-9.]+)%/.exec(css)?.[1];

    expect(declared, "no se encontro el block-size de .target en la hoja").toBeDefined();
    expect(Number(declared)).toBe(TARGET_OVERFLOW);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    setReducedMotion(false);
    stubPlay();

    const { container } = render(<VideoBackdrop src={SRC} poster={POSTER} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
