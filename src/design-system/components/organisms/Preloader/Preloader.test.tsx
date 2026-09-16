import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PAGE_STATUS, PRELOADER_SEEN_KEY } from "../../../motion/pageReady";
import { Preloader } from "./Preloader";

const html = () => document.documentElement;

function mount() {
  const { container } = render(<Preloader />);
  const panel = container.firstElementChild as HTMLElement;
  const mark = panel.firstElementChild?.firstElementChild as HTMLElement;

  return { container, panel, mark };
}

describe("Preloader", () => {
  afterEach(() => {
    html().removeAttribute(PAGE_STATUS);
    sessionStorage.removeItem(PRELOADER_SEEN_KEY);
  });

  // Sin la marca lo esconde la hoja: en el DOM se queda, invisible para todos.
  it("sin la marca de loading queda en espera y oculto", () => {
    const { panel } = mount();

    expect(panel).toHaveAttribute("data-preloader", "entering");
    expect(panel).toHaveAttribute("aria-hidden", "true");
  });

  it("encadena entrada y salida, y marca la pagina lista al empezar a abrirse", () => {
    html().setAttribute(PAGE_STATUS, "loading");
    const { container, panel, mark } = mount();

    fireEvent.animationEnd(mark);
    expect(panel).toHaveAttribute("data-preloader", "leaving");
    expect(html()).toHaveAttribute(PAGE_STATUS, "loading");

    // La pagina queda lista al empezar la salida, con el panel aun encima.
    fireEvent.animationStart(panel);
    expect(html()).toHaveAttribute(PAGE_STATUS, "ready");
    expect(sessionStorage.getItem(PRELOADER_SEEN_KEY)).toBe("1");
    expect(panel).toBeInTheDocument();

    fireEvent.animationEnd(panel);
    expect(container).toBeEmptyDOMElement();
  });

  it("la entrada solo la cierra la marca, no el logo que lleva dentro ni el panel", () => {
    html().setAttribute(PAGE_STATUS, "loading");
    const { panel, mark } = mount();

    fireEvent.animationEnd(mark.firstElementChild as HTMLElement);
    fireEvent.animationEnd(panel);

    expect(panel).toHaveAttribute("data-preloader", "entering");
  });

  it("la salida no la cierra el logo que sube con el panel", () => {
    html().setAttribute(PAGE_STATUS, "loading");
    const { panel, mark } = mount();

    fireEvent.animationEnd(mark);
    fireEvent.animationEnd(mark);

    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute("data-preloader", "leaving");
  });
});
