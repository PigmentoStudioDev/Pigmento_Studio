import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { compile, type Options } from "sass";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setThemeMode, THEME_STORAGE_KEY } from "../../../theme/mode";
import { themeZoneClass } from "../../../theme/zone";
import { ThemeToggle } from "./ThemeToggle";

const SASS: Options<"sync"> = { loadPaths: ["node_modules"], quietDeps: true };

const declared = new Set(
  [
    ...compile(join(__dirname, "ThemeToggle.module.scss"), SASS).css.matchAll(
      /\.([a-zA-Z][\w-]*)/g,
    ),
  ].map(([, name]) => name),
);

const LABEL = "Cambiar entre modo claro y oscuro";

/**
 * El store cachea el modo en una variable de MODULO, que en una pagina real se
 * reinicia en cada carga y aqui no: sin fijarlo, cada caso heredaria el modo que
 * dejo el anterior y las aserciones absolutas cambiarian de signo segun el orden en
 * que corran.
 */
beforeEach(() => {
  setThemeMode("light");
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});

describe("ThemeToggle", () => {
  it("es un boton con nombre accesible", () => {
    render(<ThemeToggle label={LABEL} />);

    expect(screen.getByRole("button", { name: LABEL })).toHaveAttribute("type", "button");
  });

  /**
   * El nombre dice la ACCION y no el estado, y no es una preferencia de redaccion:
   * un nombre que dependiera del modo no coincidiria entre servidor y cliente,
   * porque el servidor no conoce la preferencia. Aqui se comprueba que el clic no
   * lo cambia — si alguien lo hace dependiente del estado, este caso lo dice.
   */
  it("el nombre no cambia al conmutar", async () => {
    render(<ThemeToggle label={LABEL} />);
    const button = screen.getByRole("button", { name: LABEL });

    await userEvent.click(button);

    expect(button).toHaveAccessibleName(LABEL);
  });

  it("conmuta el modo y lo guarda", async () => {
    render(<ThemeToggle label={LABEL} />);
    const button = screen.getByRole("button", { name: LABEL });

    await userEvent.click(button);

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement).toHaveClass(themeZoneClass("g100"));

    await userEvent.click(button);

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement).toHaveClass(themeZoneClass("white"));
  });

  /**
   * Exactamente una clase de modo en la raiz. Si se acumularan, la de mayor
   * precedencia ganaria para siempre y el conmutador dejaria de hacer nada a partir
   * del segundo clic — sin error y sin que nada lo avise.
   */
  it("nunca deja las dos clases de modo a la vez", async () => {
    render(<ThemeToggle label={LABEL} />);

    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("button"));

    const classes = [...document.documentElement.classList];
    const modes = classes.filter((name) =>
      [themeZoneClass("white"), themeZoneClass("g100")].includes(name),
    );

    expect(modes).toHaveLength(1);
  });

  /**
   * Los dos iconos estan SIEMPRE en el DOM y ninguno se anuncia: el estado lo pinta
   * el CSS y el nombre lo pone aria-label. Montar el que toca en cada modo pediria
   * saberlo en el render, que es justo lo que este componente evita.
   */
  it("las dos caras quedan fuera del arbol de accesibilidad", () => {
    const { container } = render(<ThemeToggle label={LABEL} />);

    expect(container.querySelectorAll("svg")).toHaveLength(2);
    expect(screen.getByRole("button").textContent).toBe("");
  });

  it("todas sus clases existen en la hoja", () => {
    const { container } = render(<ThemeToggle label={LABEL} />);

    const used = [...container.querySelectorAll("[class]")].flatMap((node) =>
      (node.getAttribute("class") ?? "").split(/\s+/).filter(Boolean),
    );

    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((name) => !declared.has(name))).toEqual([]);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ThemeToggle label={LABEL} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
