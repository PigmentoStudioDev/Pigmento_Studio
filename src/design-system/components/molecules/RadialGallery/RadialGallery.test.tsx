import { act, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RadialGallery } from "./RadialGallery";

const IMAGES = Array.from({ length: 6 }, (_, index) => ({
  src: `/portfolio/0${index + 1}.png`,
  width: 522,
  height: 522,
}));

/**
 * jsdom no trae IntersectionObserver. El componente ya cae a "arranca sin observar"
 * cuando no existe, asi que el doble solo hace falta para comprobar lo contrario:
 * que con observador presente el intervalo NO corre hasta que la caja se ve.
 */
function stubIntersectionObserver() {
  const instances: Array<(visible: boolean) => void> = [];

  class Stub {
    constructor(private readonly callback: IntersectionObserverCallback) {
      instances.push((visible) => {
        this.callback(
          [{ isIntersecting: visible } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      });
    }
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  }

  vi.stubGlobal("IntersectionObserver", Stub);
  return instances;
}

/**
 * Lo que jsdom no trae y el arrastre necesita: captura de puntero y una caja con
 * ancho. Van aqui y no como guardas en el componente — la API de captura existe en
 * todos los navegadores, y una rama defensiva en produccion por una carencia del
 * runner es codigo muerto que nadie vuelve a mirar.
 */
const ROOT_WIDTH = 200;

function stubPointerEnvironment(root: HTMLElement) {
  root.setPointerCapture = () => {};
  root.releasePointerCapture = () => {};
  root.getBoundingClientRect = () => ({ width: ROOT_WIDTH, height: ROOT_WIDTH }) as DOMRect;
}

describe("RadialGallery", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /**
   * El reparto en corona es MAQUETACION, no movimiento: sale del CSS leyendo dos
   * variables. Si dependiera del JS de motion, con prefers-reduced-motion —o antes
   * de hidratar— las miniaturas quedarian apiladas en el mismo punto, que no es
   * "sin animacion", es roto.
   */
  it("reparte la corona con variables, no con el motion", () => {
    const { container } = render(<RadialGallery images={IMAGES} />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--radial-gallery-count")).toBe("6");

    const items = container.querySelectorAll<HTMLElement>("[style*='--radial-gallery-index']");
    expect(items).toHaveLength(6);
    expect(items[0].style.getPropertyValue("--radial-gallery-index")).toBe("0");
    expect(items[5].style.getPropertyValue("--radial-gallery-index")).toBe("5");
  });

  /**
   * La corona es decoracion dentro de un enlace que ya se llama por su titulo. Con
   * texto alternativo, catorce miniaturas se sumarian a ese nombre accesible y lo
   * dejarian ilegible.
   */
  it("las miniaturas no tienen texto alternativo", () => {
    render(<RadialGallery images={IMAGES} />);

    const thumbs = screen.getAllByRole("presentation");

    expect(thumbs).toHaveLength(6);
    thumbs.forEach((thumb) => expect(thumb).toHaveAttribute("alt", ""));
  });

  /**
   * next/image necesita ancho y alto para reservar el hueco antes de descargar; sin
   * eso la corona se recoloca entera segun van llegando las imagenes.
   */
  it("cada miniatura reserva su hueco", () => {
    render(<RadialGallery images={IMAGES} />);

    const thumb = screen.getAllByRole("presentation")[0];

    expect(thumb).toHaveAttribute("width", "522");
    expect(thumb).toHaveAttribute("height", "522");
  });

  /**
   * El panel del menu colapsa a 0fr: cerrado, la galeria mide cero. Un intervalo
   * girando ahi gasta cuadros durante toda la vida de la pagina sin que nadie lo vea.
   */
  it("no avanza mientras no se la ve", () => {
    const observers = stubIntersectionObserver();
    // El intervalo se pasa explicito: lo que este caso mide es la VISIBILIDAD, y
    // atarlo al valor por defecto lo hacia fallar el dia que se afino el ritmo de
    // la corona — un test en rojo por un cambio que no tiene nada que ver con lo
    // que el test dice comprobar.
    const { container } = render(<RadialGallery images={IMAGES} intervalMs={1_000} />);

    const track = container.querySelector<HTMLElement>("[style*='--radial-gallery-step']");
    expect(track?.style.getPropertyValue("--radial-gallery-step")).toBe("0");

    act(() => vi.advanceTimersByTime(20_000));
    expect(track?.style.getPropertyValue("--radial-gallery-step")).toBe("0");

    act(() => observers.forEach((emit) => emit(true)));
    act(() => vi.advanceTimersByTime(1_000));
    expect(track?.style.getPropertyValue("--radial-gallery-step")).toBe("1");
  });

  /**
   * El arrastre gira la corona 1:1 con el puntero y al soltar engancha.
   *
   * El desvio va en grados y como numero puro; la unidad la pone la hoja. Mientras
   * el gesto vive, la rueda no interpola — eso lo dice data-dragging, que es lo que
   * la hoja lee para apagar la transicion.
   */
  it("arrastrar gira la corona y al soltar engancha a un paso entero", () => {
    stubIntersectionObserver();
    const { container } = render(<RadialGallery images={IMAGES} />);

    const root = container.firstElementChild as HTMLElement;
    const track = container.querySelector<HTMLElement>("[style*='--radial-gallery-step']");
    stubPointerEnvironment(root);

    fireEvent.pointerDown(root, { pointerId: 1, clientX: 0 });
    expect(root).toHaveAttribute("data-dragging", "true");

    // Radio = ancho x 3 / 2 = 300. Arrastrar 200px gira 200/300 rad = 38.2 grados,
    // que con seis miniaturas (60 grados por paso) engancha al primero.
    fireEvent.pointerMove(root, { pointerId: 1, clientX: 200 });
    expect(Number(track?.style.getPropertyValue("--radial-gallery-drag"))).toBeGreaterThan(0);

    fireEvent.pointerUp(root, { pointerId: 1, clientX: 200 });
    expect(root).not.toHaveAttribute("data-dragging");
    expect(track?.style.getPropertyValue("--radial-gallery-drag")).toBe("0");
    expect(track?.style.getPropertyValue("--radial-gallery-step")).toBe("-1");
  });

  /**
   * Y el clic que sigue al arrastre no navega.
   *
   * Esta galeria se monta DENTRO de un enlace. Sin esto, soltar el puntero despues
   * de girar la rueda emite un click que sube hasta el <a> y cambia de pagina: el
   * fallo mas desconcertante que puede tener la pieza, porque el gesto que se hizo
   * no se parece en nada al resultado.
   */
  it("el clic que sigue a un arrastre no navega", () => {
    stubIntersectionObserver();
    const { container } = render(<RadialGallery images={IMAGES} />);

    const root = container.firstElementChild as HTMLElement;
    stubPointerEnvironment(root);

    fireEvent.pointerDown(root, { pointerId: 1, clientX: 0 });
    fireEvent.pointerMove(root, { pointerId: 1, clientX: 200 });
    fireEvent.pointerUp(root, { pointerId: 1, clientX: 200 });

    // dispatchEvent devuelve false cuando algo llamo a preventDefault.
    expect(fireEvent.click(root)).toBe(false);
  });

  /** Un toque sin desplazamiento sigue siendo un clic: la tarjeta tiene que navegar. */
  it("un toque sin arrastre deja pasar el clic", () => {
    stubIntersectionObserver();
    const { container } = render(<RadialGallery images={IMAGES} />);

    const root = container.firstElementChild as HTMLElement;
    stubPointerEnvironment(root);

    fireEvent.pointerDown(root, { pointerId: 1, clientX: 0 });
    fireEvent.pointerUp(root, { pointerId: 1, clientX: 0 });

    expect(fireEvent.click(root)).toBe(true);
  });

  /** Con una sola pieza no hay corona que girar. */
  it("no monta el intervalo con una sola miniatura", () => {
    const observers = stubIntersectionObserver();
    const { container } = render(<RadialGallery images={[IMAGES[0]]} />);

    act(() => observers.forEach((emit) => emit(true)));
    act(() => vi.advanceTimersByTime(20_000));

    const track = container.querySelector<HTMLElement>("[style*='--radial-gallery-step']");
    expect(track?.style.getPropertyValue("--radial-gallery-step")).toBe("0");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    // axe recorre el arbol de forma asincrona: con temporizadores falsos su propia
    // espera no avanza nunca y el test agota el tiempo sin analizar nada.
    vi.useRealTimers();

    const { container } = render(<RadialGallery images={IMAGES} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
