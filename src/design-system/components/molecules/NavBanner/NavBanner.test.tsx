import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { NavBanner } from "./NavBanner";

const BASE = { href: "/estudio", title: "Como trabajamos", cta: "Verlo" };

describe("NavBanner", () => {
  /**
   * Un solo control para un solo destino. Si la llamada a la accion fuese un
   * <button>, habria dos elementos interactivos que llevan al mismo sitio — y un
   * control dentro de un enlace ni siquiera es HTML valido.
   */
  it("la tarjeta entera es un unico enlace", () => {
    render(<NavBanner {...BASE} />);

    const link = screen.getByRole("link", { name: "Como trabajamos" });

    expect(link).toHaveAttribute("href", "/estudio");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  /**
   * El enlace se llama por su titulo y solo por su titulo. La llamada a la accion
   * queda fuera del arbol de accesibilidad: no identifica el destino, y su texto
   * concatenado dependeria del display que le de el CSS — separado en el navegador,
   * pegado en jsdom. Un nombre accesible no puede depender del layout.
   */
  it("el nombre accesible es el titulo, sin la llamada a la accion", () => {
    render(<NavBanner {...BASE} />);

    expect(screen.getByRole("link")).toHaveAccessibleName("Como trabajamos");
    expect(screen.getByText("Verlo")).toHaveAttribute("aria-hidden", "true");
  });

  it("los distintivos son opcionales", () => {
    const { rerender } = render(<NavBanner {...BASE} />);
    expect(screen.getByRole("link")).not.toHaveTextContent("Nuevo");

    rerender(<NavBanner {...BASE} tags={["Nuevo"]} />);
    expect(screen.getByRole("link")).toHaveTextContent("Nuevo");
  });

  /**
   * next/image necesita ancho y alto para reservar el hueco antes de descargar.
   * Sin eso el panel salta cuando la imagen llega, y el salto se lo come quien ya
   * habia empezado a leer.
   */
  it("la imagen reserva su hueco con las dimensiones declaradas", () => {
    render(
      <NavBanner
        {...BASE}
        image={{ src: "/decor/banner.avif", alt: "", width: 540, height: 600 }}
      />,
    );

    const img = screen.getByRole("presentation");

    expect(img).toHaveAttribute("width", "540");
    expect(img).toHaveAttribute("height", "600");
  });

  it("avisa al navegar", async () => {
    const onNavigate = vi.fn();
    render(<NavBanner {...BASE} onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole("link"));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<NavBanner {...BASE} tags={["Nuevo"]} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
