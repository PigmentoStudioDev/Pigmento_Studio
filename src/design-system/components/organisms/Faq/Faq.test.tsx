import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Faq, type FaqProps } from "./Faq";

const PROPS: FaqProps = {
  title: "FAQ",
  label: "Preguntas frecuentes",
  intro: "Las preguntas que nos hacen antes de firmar.",
  items: [
    { question: "¿Cuánto cuesta un proyecto?", answer: "Depende del alcance." },
    { question: "¿Cuánto tarda?", answer: "Entre cuatro y ocho semanas." },
    { question: "¿De quién es lo que producen?", answer: "Tuyo." },
  ],
};

describe("Faq", () => {
  /** El contrato de un acordeon: un boton por pregunta, y cerrado de salida. */
  it("arranca con todo cerrado", () => {
    render(<Faq {...PROPS} />);

    const triggers = screen.getAllByRole("button");

    expect(triggers).toHaveLength(PROPS.items.length);
    expect(triggers.every((trigger) => trigger.getAttribute("aria-expanded") === "false")).toBe(
      true,
    );
  });

  it("abre la fila que se pulsa", async () => {
    render(<Faq {...PROPS} />);

    const trigger = screen.getByRole("button", { name: /cuesta/i });
    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  /**
   * Una sola abierta por defecto, y no es una preferencia: con varias abiertas la
   * pagina crece por debajo del puntero y lo que estabas leyendo se va de la pantalla.
   */
  it("cierra la anterior al abrir otra", async () => {
    render(<Faq {...PROPS} />);

    const first = screen.getByRole("button", { name: /cuesta/i });
    const second = screen.getByRole("button", { name: /tarda/i });

    await userEvent.click(first);
    await userEvent.click(second);

    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
  });

  it("con multiple deja abrir varias a la vez", async () => {
    render(<Faq {...PROPS} multiple />);

    const first = screen.getByRole("button", { name: /cuesta/i });
    const second = screen.getByRole("button", { name: /tarda/i });

    await userEvent.click(first);
    await userEvent.click(second);

    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second).toHaveAttribute("aria-expanded", "true");
  });

  /**
   * EL gate del panel cerrado. Tiene que seguir MIDIENDO para poder animarse, y un
   * contenido que mide pero no se ve sigue recibiendo el tabulador y se sigue leyendo
   * en voz alta. `inert` lo saca de los dos sitios sin sacarlo del flujo.
   */
  it("el panel cerrado no es alcanzable", async () => {
    const { container } = render(<Faq {...PROPS} />);

    expect(container.querySelectorAll("[inert]")).toHaveLength(PROPS.items.length);

    await userEvent.click(screen.getByRole("button", { name: /cuesta/i }));

    expect(container.querySelectorAll("[inert]")).toHaveLength(PROPS.items.length - 1);
  });

  /** Las flechas se quedan dentro de la lista; el tabulador es el que sale. */
  it("las flechas mueven el foco entre preguntas", async () => {
    render(<Faq {...PROPS} />);

    const first = screen.getByRole("button", { name: /cuesta/i });
    first.focus();

    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: /tarda/i })).toHaveFocus();

    // Y da la vuelta por arriba en vez de dejar el foco en un callejon.
    first.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("button", { name: /producen/i })).toHaveFocus();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Faq {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
