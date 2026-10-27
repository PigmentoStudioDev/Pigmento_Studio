import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { MOTION_PAUSED_ATTRIBUTE, MOTION_STORAGE_KEY, setMotionPaused } from "../../../motion/motionPause";
import { MotionToggle } from "./MotionToggle";

const LABEL = "Pausar animaciones";

describe("MotionToggle", () => {
  afterEach(() => {
    // El store cachea el estado en el modulo: se devuelve por su propia puerta.
    setMotionPaused(false);
    localStorage.clear();
  });

  /** Es un interruptor: el estado va en aria-pressed y el nombre no cambia. */
  it("para el movimiento, lo anuncia y lo publica en la raiz", async () => {
    setMotionPaused(false);
    render(<MotionToggle label={LABEL} />);
    const toggle = screen.getByRole("button", { name: LABEL });

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute(MOTION_PAUSED_ATTRIBUTE);
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe("paused");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<MotionToggle label={LABEL} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
