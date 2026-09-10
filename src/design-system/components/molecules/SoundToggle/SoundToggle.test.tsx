import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { SOUND_STORAGE_KEY, setSoundEnabled } from "../../../sound/mode";
import { SoundToggle } from "./SoundToggle";

const LABEL = "Activar o silenciar el sonido";

describe("SoundToggle", () => {
  afterEach(() => {
    // El store cachea la preferencia en el modulo, igual que el del tema: vaciar el
    // almacenamiento no le llega. Se apaga por su propia puerta y luego se limpia,
    // que es la unica forma de que cada caso empiece donde dice que empieza.
    setSoundEnabled(false);
    localStorage.clear();
  });

  /**
   * Arranca apagado, y es la decision que sostiene todo lo demas: un sitio que suena
   * sin que nadie lo haya pedido es de las pocas cosas que un visitante no puede
   * deshacer a tiempo — para cuando encuentra el interruptor, ya ha sonado.
   */
  it("arranca apagado", () => {
    render(<SoundToggle label={LABEL} />);

    expect(screen.getByRole("button", { name: LABEL })).toHaveAttribute("aria-pressed", "false");
  });

  /** Es un interruptor: el estado se anuncia por su atributo, no en el nombre. */
  it("anuncia su estado sin cambiar de nombre", async () => {
    render(<SoundToggle label={LABEL} />);

    const toggle = screen.getByRole("button", { name: LABEL });
    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: LABEL })).toBe(toggle);
  });

  /** La preferencia sobrevive a la recarga, como la del tema. */
  it("recuerda la eleccion", async () => {
    render(<SoundToggle label={LABEL} />);

    await userEvent.click(screen.getByRole("button", { name: LABEL }));

    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe("on");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<SoundToggle label={LABEL} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
